import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Cal.com webhook payload types
interface CalAttendee {
  name: string;
  email: string;
  phone?: string;
  timeZone?: string;
}

interface CalPayload {
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  attendees: CalAttendee[];
  eventTypeId?: number;
  cancellationReason?: string;
}

interface CalWebhookBody {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_CANCELLED' | 'BOOKING_RESCHEDULED' | 'MEETING_ENDED';
  createdAt: string;
  payload: CalPayload;
}

function verifySignature(body: string, signature: string | null, secret: string | undefined): boolean {
  if (!secret || !signature) return !secret; // If no secret set, skip verification
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${expected}` === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('X-Cal-Signature-256');

  if (!verifySignature(rawBody, signature, process.env.CAL_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: CalWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { triggerEvent, payload } = body;
  const attendee = payload.attendees?.[0];
  if (!attendee) return NextResponse.json({ ok: true });

  // Lazy email helper — survives missing RESEND_API_KEY without crashing webhook
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;
  const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jinzzang774@gmail.com';

  const sendMail = async (args: { to: string; subject: string; html: string }) => {
    if (!resend) {
      console.warn('[cal webhook] RESEND_API_KEY missing — skipping email to', args.to);
      return;
    }
    try {
      await resend.emails.send({ from: FROM, ...args });
    } catch (err) {
      console.error('[cal webhook] Email send failed:', err);
    }
  };

  const startDate = new Date(payload.startTime);
  const dateStr = format(startDate, 'yyyy-MM-dd');
  const timeStr = format(startDate, 'HH:mm');
  const dateFormatted = format(startDate, 'PPP', { locale: de });
  const BOOKING_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://nail-studio-cal.vercel.app';

  try {
    const db = getAdminDb();

    // ─── BOOKING CREATED ───────────────────────────────────────────
    if (triggerEvent === 'BOOKING_CREATED') {

      // 1. Save booking to Firebase
      const bookingRef = db.collection('bookings').doc();
      await bookingRef.set({
        calUid: payload.uid,
        serviceId: payload.eventTypeId?.toString() || 'cal',
        serviceName: payload.title,
        date: dateStr,
        time: timeStr,
        customerName: attendee.name,
        customerEmail: attendee.email,
        customerPhone: attendee.phone || '',
        status: 'confirmed',
        source: 'cal.com',
        createdAt: new Date(),
      });

      // 2. Upsert customer record
      const customerId = attendee.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const customerRef = db.collection('customers').doc(customerId);
      const customerSnap = await customerRef.get();

      if (customerSnap.exists) {
        await customerRef.update({
          lastVisit: new Date(),
          visitCount: (customerSnap.data()?.visitCount || 0) + 1,
          points: (customerSnap.data()?.points || 0) + 10,
          phone: attendee.phone || customerSnap.data()?.phone || '',
        });
      } else {
        await customerRef.set({
          name: attendee.name,
          email: attendee.email,
          phone: attendee.phone || '',
          points: 10,
          visitCount: 1,
          createdAt: new Date(),
          lastVisit: new Date(),
        });
      }

      // 3. Send confirmation emails
      const manageUrl = `${BOOKING_URL}/booking`;

      const customerHtml = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #F0F0F0;">
    <div style="background:#1A1A1A;padding:40px;text-align:center;">
      <p style="color:#C8A97E;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Studio Cherry</p>
      <h1 style="color:#fff;font-size:24px;font-style:italic;margin:0;font-weight:normal;">Buchungsbestätigung</h1>
    </div>
    <div style="padding:48px 40px;">
      <p style="color:#555;font-size:14px;line-height:1.8;margin:0 0 32px">
        Hallo <strong>${attendee.name.split(' ')[0]}</strong>,<br>
        vielen Dank für Ihre Buchung! Wir freuen uns auf Ihren Besuch.
      </p>
      <div style="background:#FAFAFA;border:1px solid #F0F0F0;padding:32px;margin-bottom:32px;">
        <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#999;margin:0 0 20px;font-family:Arial,sans-serif;">Ihre Termindetails</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;width:40%">Behandlung</td><td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:#1A1A1A;text-align:right;">${payload.title}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Datum</td><td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:#1A1A1A;text-align:right;">${dateFormatted}</td></tr>
          <tr><td style="padding:10px 0;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Uhrzeit</td><td style="padding:10px 0;font-size:14px;color:#1A1A1A;text-align:right;font-style:italic;">${timeStr} Uhr</td></tr>
        </table>
      </div>
      <p style="color:#999;font-size:11px;line-height:1.8;text-align:center;font-family:Arial,sans-serif;">
        Sie können Ihren Termin über den Cal.com-Link in Ihrer Bestätigungs-E-Mail verwalten.<br><br>
        <strong>+10 Punkte</strong> wurden Ihrem Konto gutgeschrieben 🌸
      </p>
    </div>
    <div style="background:#F9F9F9;padding:24px 40px;text-align:center;border-top:1px solid #F0F0F0;">
      <p style="color:#CCC;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">Studio Cherry · Nail &amp; Beauty</p>
    </div>
  </div>
</body></html>`;

      await Promise.all([
        sendMail({
          to: attendee.email,
          subject: `✓ Buchungsbestätigung — ${payload.title} am ${dateStr}`,
          html: customerHtml,
        }),
        sendMail({
          to: ADMIN_EMAIL,
          subject: `[Studio Cherry] Neue Buchung: ${attendee.name} · ${payload.title}`,
          html: `<div style="font-family:Arial,sans-serif;padding:32px;max-width:480px;">
            <p style="font-size:10px;color:#999;letter-spacing:3px;text-transform:uppercase;">Neue Buchung via Cal.com</p>
            <h2 style="color:#1A1A1A;">${attendee.name}</h2>
            <p><strong>Service:</strong> ${payload.title}</p>
            <p><strong>Datum:</strong> ${dateFormatted} · ${timeStr} Uhr</p>
            <p><strong>Email:</strong> ${attendee.email}</p>
            <p><strong>Telefon:</strong> ${attendee.phone || '–'}</p>
          </div>`,
        }),
      ]);
    }

    // ─── BOOKING CANCELLED ────────────────────────────────────────
    if (triggerEvent === 'BOOKING_CANCELLED') {

      // Update booking status in Firebase
      const bookingSnap = await db.collection('bookings')
        .where('calUid', '==', payload.uid)
        .limit(1)
        .get();
      if (!bookingSnap.empty) {
        await bookingSnap.docs[0].ref.update({ status: 'cancelled' });
      }

      // Send cancellation email
      await sendMail({
        to: attendee.email,
        subject: `Stornierung bestätigt — ${payload.title}`,
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #F0F0F0;">
    <div style="background:#1A1A1A;padding:40px;text-align:center;">
      <p style="color:#C8A97E;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Studio Cherry</p>
      <h1 style="color:#fff;font-size:22px;font-style:italic;margin:0;font-weight:normal;">Stornierungsbestätigung</h1>
    </div>
    <div style="padding:48px 40px;text-align:center;">
      <p style="color:#555;font-size:14px;line-height:1.8;">
        Hallo <strong>${attendee.name.split(' ')[0]}</strong>,<br>
        Ihr Termin am <strong>${dateFormatted} · ${timeStr} Uhr</strong> wurde storniert.
      </p>
      <a href="${BOOKING_URL}/booking" style="display:inline-block;margin-top:32px;background:#1A1A1A;color:#fff;text-decoration:none;padding:14px 32px;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Neuen Termin buchen</a>
    </div>
    <div style="background:#F9F9F9;padding:24px 40px;text-align:center;border-top:1px solid #F0F0F0;">
      <p style="color:#CCC;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">Studio Cherry · Nail &amp; Beauty</p>
    </div>
  </div>
</body></html>`,
      });
    }

    // ─── RESCHEDULED — same as created + cancel old ───────────────
    if (triggerEvent === 'BOOKING_RESCHEDULED') {
      await db.collection('bookings').add({
        calUid: payload.uid,
        serviceName: payload.title,
        date: dateStr,
        time: timeStr,
        customerName: attendee.name,
        customerEmail: attendee.email,
        customerPhone: attendee.phone || '',
        status: 'confirmed',
        source: 'cal.com',
        rescheduled: true,
        createdAt: new Date(),
      });

      await sendMail({
        to: attendee.email,
        subject: `Termin verschoben — ${payload.title} am ${dateStr}`,
        html: `<p>Ihr Termin wurde auf ${dateFormatted} · ${timeStr} Uhr verschoben.</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Cal.com webhook error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
