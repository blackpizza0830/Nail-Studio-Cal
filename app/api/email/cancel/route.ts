import { NextRequest, NextResponse } from 'next/server';
import { getTransporter, FROM, ADMIN_EMAIL, BASE_URL } from '@/lib/mailer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerEmail, serviceName, date, time } = await req.json();

    const dateFormatted = new Date(date).toLocaleDateString('de-DE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const transporter = getTransporter();

    const customerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #F0F0F0;">
    <div style="background:#1A1A1A;padding:40px;text-align:center;">
      <p style="color:#C8A97E;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Studio Cherry</p>
      <h1 style="color:#fff;font-size:22px;font-style:italic;margin:0;font-weight:normal;">Stornierungsbestätigung</h1>
    </div>
    <div style="padding:48px 40px;">
      <p style="color:#555;font-size:14px;line-height:1.8;margin:0 0 32px">
        Hallo <strong>${customerName}</strong>,<br>
        Ihr Termin wurde erfolgreich storniert.
      </p>
      <div style="background:#FAFAFA;border:1px solid #F0F0F0;padding:24px 32px;margin-bottom:32px;">
        <p style="font-size:13px;color:#555;margin:8px 0;"><strong>Behandlung:</strong> ${serviceName}</p>
        <p style="font-size:13px;color:#555;margin:8px 0;"><strong>Datum:</strong> ${dateFormatted} · ${time} Uhr</p>
      </div>
      <div style="text-align:center;">
        <a href="${BASE_URL}/booking" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:14px 32px;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Neuen Termin buchen</a>
      </div>
    </div>
    <div style="background:#F9F9F9;padding:24px 40px;text-align:center;border-top:1px solid #F0F0F0;">
      <p style="color:#CCC;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">Studio Cherry · Nail &amp; Beauty</p>
    </div>
  </div>
</body>
</html>`;

    await Promise.all([
      transporter.sendMail({
        from: FROM,
        to: customerEmail,
        subject: `Stornierung bestätigt — ${serviceName} am ${date}`,
        html: customerHtml,
      }),
      transporter.sendMail({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `[Studio Cherry] Stornierung: ${customerName} · ${serviceName} · ${date}`,
        html: `<p>${customerName} (${customerEmail}) hat den Termin am ${dateFormatted} · ${time} Uhr storniert.</p>`,
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Cancel email error:', error);
    return NextResponse.json({ error: 'Email konnte nicht gesendet werden.' }, { status: 500 });
  }
}
