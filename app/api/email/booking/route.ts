import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jinzzang774@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, customerName, customerEmail, customerPhone, serviceName, date, time } = await req.json();

    const dateFormatted = new Date(date).toLocaleDateString('de-DE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const manageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://nail-studio-5.vercel.app'}/booking/manage/${bookingId}`;

    const customerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #F0F0F0;">
    <div style="background:#1A1A1A;padding:40px;text-align:center;">
      <p style="color:#C8A97E;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Studio Cherry</p>
      <h1 style="color:#fff;font-size:24px;font-style:italic;margin:0;font-weight:normal;">Buchungsbestätigung</h1>
    </div>
    <div style="padding:48px 40px;">
      <p style="color:#555;font-size:14px;line-height:1.8;margin:0 0 32px">
        Hallo <strong>${customerName}</strong>,<br>
        vielen Dank für Ihre Buchung! Wir freuen uns auf Ihren Besuch.
      </p>
      <div style="background:#FAFAFA;border:1px solid #F0F0F0;padding:32px;margin-bottom:32px;">
        <p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#999;margin:0 0 20px;font-family:Arial,sans-serif;">Ihre Termindetails</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;width:40%">Behandlung</td><td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:#1A1A1A;text-align:right;">${serviceName}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Datum</td><td style="padding:10px 0;border-bottom:1px solid #F0F0F0;font-size:14px;color:#1A1A1A;text-align:right;">${dateFormatted}</td></tr>
          <tr><td style="padding:10px 0;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Uhrzeit</td><td style="padding:10px 0;font-size:14px;color:#1A1A1A;text-align:right;font-style:italic;">${time} Uhr</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin-bottom:40px;">
        <a href="${manageUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:14px 32px;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Termin verwalten</a>
      </div>
      <p style="color:#999;font-size:11px;line-height:1.8;text-align:center;font-family:Arial,sans-serif;">
        Stornierungen sind bis zu 24 Stunden vor dem Termin kostenfrei möglich.<br>
        Bei Fragen: ${ADMIN_EMAIL}
      </p>
    </div>
    <div style="background:#F9F9F9;padding:24px 40px;text-align:center;border-top:1px solid #F0F0F0;">
      <p style="color:#CCC;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">Studio Cherry · Nail &amp; Beauty</p>
    </div>
  </div>
</body>
</html>`;

    const adminHtml = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:32px;background:#FAFAFA;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #eee;padding:32px;">
    <p style="font-size:10px;color:#999;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px">Neue Buchung</p>
    <h2 style="font-size:20px;margin:0 0 24px;color:#1A1A1A;">${customerName}</h2>
    <p style="font-size:13px;color:#555;margin:6px 0;"><strong>Service:</strong> ${serviceName}</p>
    <p style="font-size:13px;color:#555;margin:6px 0;"><strong>Datum:</strong> ${dateFormatted} · ${time} Uhr</p>
    <p style="font-size:13px;color:#555;margin:6px 0;"><strong>Email:</strong> ${customerEmail}</p>
    <p style="font-size:13px;color:#555;margin:6px 0;"><strong>Telefon:</strong> ${customerPhone || '–'}</p>
    <p style="margin-top:24px;"><a href="${manageUrl}" style="color:#1A1A1A;font-size:11px;">Buchung verwalten →</a></p>
  </div>
</body></html>`;

    await Promise.all([
      resend.emails.send({
        from: FROM,
        to: customerEmail,
        subject: `✓ Buchungsbestätigung — ${serviceName} am ${date}`,
        html: customerHtml,
      }),
      resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `[Studio Cherry] Neue Buchung: ${customerName} · ${serviceName}`,
        html: adminHtml,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Booking email error:', error);
    return NextResponse.json({ error: 'Email konnte nicht gesendet werden.' }, { status: 500 });
  }
}
