import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// ─── NeetoCal webhook payload types ─────────────────────────────────────────
// Docs: https://help.neetocal.com/articles/securing-webhook-requests
// Signature header: x-neeto-webhook-signature (sha256=HMAC-SHA256)
// IMPORTANT: HTML entities in JSON payload must be escaped before verifying

interface NeetoFormResponse {
  field: string;
  value: string | string[];
  type: string;
  field_code: string;
}

interface NeetoMeeting {
  name: string;
}

interface NeetoBooking {
  id: string;
  sid: string;
  name: string;
  email: string;
  starts_at: string;
  ends_at: string;
  time_zone: string;
  status: string;
  cancel_reason?: string | null;
  meeting?: NeetoMeeting;
  form_responses?: NeetoFormResponse[];
  admin_booking_url?: string;
  client_booking_url?: string;
}

interface NeetoWebhookBody {
  event: string;  // 'booking_created' | 'booking_cancelled' | 'booking_rescheduled' | ...
  booking: NeetoBooking;
}

// ─── Signature verification ──────────────────────────────────────────────────
// neetocal requires HTML entities to be escaped in the raw body before hashing
function escapeHtmlEntities(s: string): string {
  return s
    .replace(/>/g, '\\u003e')
    .replace(/</g, '\\u003c')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function verifySignature(rawBody: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret) return true;
  if (!signature) return false;

  const escaped = escapeHtmlEntities(rawBody);
  const expected = 'sha256=' + createHmac('sha256', secret).update(escaped).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ─── Helper: extract phone from form responses ───────────────────────────────
function extractPhone(responses?: NeetoFormResponse[]): string {
  if (!responses) return '';
  const phoneField = responses.find(r =>
    r.field_code === 'phone' || r.field_code === 'phone_number' || r.type === 'phone_number'
  );
  return typeof phoneField?.value === 'string' ? phoneField.value : '';
}

// ─── Main handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-neeto-webhook-signature');

  if (!verifySignature(rawBody, signature, process.env.NEETOCAL_WEBHOOK_SECRET)) {
    console.error('[neetocal webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: NeetoWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event, booking } = body;

  if (!booking || !booking.email) {
    console.warn('[neetocal webhook] Missing booking data, skipping');
    return NextResponse.json({ ok: true });
  }

  const phone = extractPhone(booking.form_responses);
  const serviceName = booking.meeting?.name ?? 'Termin';
  const startDate = new Date(booking.starts_at);
  const dateStr = format(startDate, 'yyyy-MM-dd');
  const timeStr = format(startDate, 'HH:mm');
  const dateFormatted = format(startDate, 'PPP', { locale: de });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jinzzang774@gmail.com';
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://nail-studio-cal.vercel.app';

  try {
    const db = getAdminDb();

    // ─── BOOKING CREATED ────────────────────────────────────────────────────
    if (event === 'booking_created') {

      // 1. Save booking to Firebase
      const bookingRef = db.collection('bookings').doc();
      await bookingRef.set({
        neetoSid: booking.sid,
        neetoId: booking.id,
        serviceName,
        date: dateStr,
        time: timeStr,
        customerName: booking.name,
        customerEmail: booking.email,
        customerPhone: phone,
        status: 'confirmed',
        source: 'neetocal',
        adminBookingUrl: booking.admin_booking_url ?? null,
        clientBookingUrl: booking.client_booking_url ?? null,
        createdAt: new Date(),
      });

      // 2. Upsert customer
      const customerId = booking.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const customerRef = db.collection('customers').doc(customerId);
      const customerSnap = await customerRef.get();

      if (customerSnap.exists) {
        await customerRef.update({
          lastVisit: new Date(),
          visitCount: (customerSnap.data()?.visitCount ?? 0) + 1,
          points: (customerSnap.data()?.points ?? 0) + 10,
          phone: phone || customerSnap.data()?.phone || '',
        });
      } else {
        await customerRef.set({
          name: booking.name,
          email: booking.email,
          phone,
          points: 10,
          visitCount: 1,
          createdAt: new Date(),
          lastVisit: new Date(),
        });
      }

      // 3. Emails
      const customerHtml = buildCustomerConfirmationEmail(booking.name, serviceName, dateFormatted, timeStr);
      const adminHtml = buildAdminNotificationEmail(booking.name, serviceName, dateFormatted, timeStr, booking.email, phone);

      await Promise.all([
        resend.emails.send({
          from: FROM,
          to: booking.email,
          subject: `✓ Buchungsbestätigung — ${serviceName} am ${dateStr}`,
          html: customerHtml,
        }),
        resend.emails.send({
          from: FROM,
          to: ADMIN_EMAIL,
          subject: `[Studio Cherry] Neue Buchung: ${booking.name} · ${serviceName}`,
          html: adminHtml,
        }),
      ]);
    }

    // ─── BOOKING CANCELLED ──────────────────────────────────────────────────
    if (event === 'booking_cancelled') {
      // Update status in Firebase
      const snap = await db.collection('bookings')
        .where('neetoSid', '==', booking.sid)
        .limit(1)
        .get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({
          status: 'cancelled',
          cancelReason: booking.cancel_reason ?? null,
          cancelledAt: new Date(),
        });
      }

      // Cancellation email
      await resend.emails.send({
        from: FROM,
        to: booking.email,
        subject: `Stornierung bestätigt — ${serviceName}`,
        html: buildCancellationEmail(booking.name, serviceName, dateFormatted, timeStr, BASE_URL),
      });
    }

    // ─── BOOKING RESCHEDULED ────────────────────────────────────────────────
    if (event === 'booking_rescheduled') {
      // Mark old booking cancelled, add new one
      const snap = await db.collection('bookings')
        .where('neetoSid', '==', booking.sid)
        .limit(1)
        .get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({ status: 'rescheduled' });
      }

      await db.collection('bookings').add({
        neetoSid: booking.sid,
        neetoId: booking.id,
        serviceName,
        date: dateStr,
        time: timeStr,
        customerName: booking.name,
        customerEmail: booking.email,
        customerPhone: phone,
        status: 'confirmed',
        source: 'neetocal',
        rescheduled: true,
        createdAt: new Date(),
      });

      await resend.emails.send({
        from: FROM,
        to: booking.email,
        subject: `Termin verschoben — ${serviceName} am ${dateStr}`,
        html: `
<div style="font-family:Georgia,serif;max-width:540px;margin:40px auto;background:#fff;padding:48px;border:1px solid #F0F0F0;">
  <p style="color:#C8A97E;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 32px">Studio Cherry</p>
  <p style="color:#555;font-size:14px;line-height:1.8;">
    Hallo <strong>${booking.name.split(' ')[0]}</strong>,<br>
    Ihr Termin wurde auf <strong>${dateFormatted} · ${timeStr} Uhr</strong> verschoben.
  </p>
</div>`,
      });
    }

    console.log(`[neetocal webhook] Processed event: ${event} for ${booking.email}`);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('[neetocal webhook] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// ─── Email templates ─────────────────────────────────────────────────────────

function buildCustomerConfirmationEmail(name: string, service: string, date: string, time: string): string {
  const firstName = name.split(' ')[0];
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #F0F0F0;">
    <div style="background:#1A1A1A;padding:40px;text-align:center;">
      <p style="color:#C8A97E;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Studio Cherry</p>
      <h1 style="color:#fff;font-size:24px;font-style:italic;margin:0;font-weight:normal;">Buchungsbestätigung</h1>
    </div>
    <div style="padding:48px 40px;">
      <p style="color:#555;font-size:14px;line-height:1.8;margin:0 0 32px">
        Hallo <strong>${firstName}</strong>,<br>
        vielen Dank für Ihre Buchung! Wir freuen uns auf Ihren Besuch.
      </p>
      <div style="background:#FAFAFA;border:1px solid #F0F0F0;padding:32px;margin-bottom:32px;">
        <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#999;margin:0 0 20px;font-family:Arial,sans-serif;">Ihre Termindetails</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;width:40%">Behandlung</td>
            <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:#1A1A1A;text-align:right;">${service}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Datum</td>
            <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:#1A1A1A;text-align:right;">${date}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Uhrzeit</td>
            <td style="padding:10px 0;font-size:14px;color:#1A1A1A;text-align:right;font-style:italic;">${time} Uhr</td>
          </tr>
        </table>
      </div>
      <p style="color:#999;font-size:11px;line-height:1.8;text-align:center;font-family:Arial,sans-serif;">
        Sie können Ihren Termin über den Link in Ihrer NeetoCal-Bestätigungs-E-Mail verwalten.<br><br>
        <strong>+10 Punkte</strong> wurden Ihrem Konto gutgeschrieben 🌸
      </p>
    </div>
    <div style="background:#F9F9F9;padding:24px 40px;text-align:center;border-top:1px solid #F0F0F0;">
      <p style="color:#CCC;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">Studio Cherry · Nail &amp; Beauty</p>
    </div>
  </div>
</body></html>`;
}

function buildAdminNotificationEmail(name: string, service: string, date: string, time: string, email: string, phone: string): string {
  return `
<div style="font-family:Arial,sans-serif;padding:32px;max-width:480px;">
  <p style="font-size:10px;color:#999;letter-spacing:3px;text-transform:uppercase;">Neue Buchung via NeetoCal</p>
  <h2 style="color:#1A1A1A;margin:8px 0 24px;">${name}</h2>
  <p><strong>Service:</strong> ${service}</p>
  <p><strong>Datum:</strong> ${date} · ${time} Uhr</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Telefon:</strong> ${phone || '–'}</p>
</div>`;
}

function buildCancellationEmail(name: string, service: string, date: string, time: string, baseUrl: string): string {
  const firstName = name.split(' ')[0];
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #F0F0F0;">
    <div style="background:#1A1A1A;padding:40px;text-align:center;">
      <p style="color:#C8A97E;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Studio Cherry</p>
      <h1 style="color:#fff;font-size:22px;font-style:italic;margin:0;font-weight:normal;">Stornierungsbestätigung</h1>
    </div>
    <div style="padding:48px 40px;text-align:center;">
      <p style="color:#555;font-size:14px;line-height:1.8;">
        Hallo <strong>${firstName}</strong>,<br>
        Ihr Termin am <strong>${date} · ${time} Uhr</strong> für <em>${service}</em> wurde storniert.
      </p>
      <a href="${baseUrl}/booking"
         style="display:inline-block;margin-top:32px;background:#1A1A1A;color:#fff;text-decoration:none;padding:14px 32px;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">
        Neuen Termin buchen
      </a>
    </div>
    <div style="background:#F9F9F9;padding:24px 40px;text-align:center;border-top:1px solid #F0F0F0;">
      <p style="color:#CCC;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">Studio Cherry · Nail &amp; Beauty</p>
    </div>
  </div>
</body></html>`;
}
