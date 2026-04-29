import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const BOOKING_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://nail-studio-5.vercel.app'}/booking`;
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayMmDd = `${mm}-${dd}`;

    // birthDate stored as 'YYYY-MM-DD', compare MM-DD
    const snapshot = await db.collection('customers')
      .where('birthDateMmDd', '==', todayMmDd)
      .get();

    if (snapshot.empty) return NextResponse.json({ sent: 0 });

    const results = await Promise.allSettled(
      snapshot.docs.map(async (d) => {
        const { name, email } = d.data();
        if (!email) return;

        await resend.emails.send({
          from: FROM,
          to: email,
          subject: '🎂 Herzlichen Glückwunsch zum Geburtstag!',
          html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #F0F0F0;">
    <div style="background:#1A1A1A;padding:40px;text-align:center;">
      <p style="color:#C8A97E;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Studio Cherry</p>
      <h1 style="color:#fff;font-size:24px;font-style:italic;margin:0;font-weight:normal;">Alles Gute zum Geburtstag!</h1>
    </div>
    <div style="padding:48px 40px;text-align:center;">
      <p style="font-size:40px;margin:0 0 24px;">🎂</p>
      <p style="color:#555;font-size:15px;line-height:1.9;margin:0 0 32px;">
        Hallo <strong>${name?.split(' ')[0] || 'liebe Kundin'}</strong>,<br><br>
        herzlichen Glückwunsch zu Ihrem besonderen Tag!<br>
        Gönnen Sie sich ein schönes Geburtstagsgeschenk — Sie haben es verdient.
      </p>
      <div style="background:#FAFAFA;border:1px solid #F0F0F0;padding:20px 32px;margin-bottom:32px;display:inline-block;">
        <p style="font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;font-family:Arial,sans-serif;">Geburtstagsgeschenk</p>
        <p style="font-size:20px;color:#1A1A1A;font-style:italic;margin:0;">10% Rabatt auf Ihren nächsten Besuch</p>
        <p style="font-size:11px;color:#999;margin:8px 0 0;font-family:Arial,sans-serif;">Gültig für 30 Tage</p>
      </div>
      <br>
      <a href="${BOOKING_URL}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 40px;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Termin buchen</a>
    </div>
    <div style="background:#F9F9F9;padding:24px 40px;text-align:center;border-top:1px solid #F0F0F0;">
      <p style="color:#CCC;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin:0;font-family:Arial,sans-serif;">Studio Cherry · Nail &amp; Beauty</p>
    </div>
  </div>
</body></html>`,
        });
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Birthday emails sent: ${sent}/${snapshot.docs.length}`);
    return NextResponse.json({ sent });
  } catch (error) {
    console.error('Birthday cron error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
