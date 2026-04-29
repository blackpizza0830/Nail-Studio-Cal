import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const BOOKING_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://nail-studio-5.vercel.app'}/booking`;
  // Vercel Cron security check
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const now = new Date();
    const targetFrom = new Date(now);
    targetFrom.setDate(targetFrom.getDate() - 35); // 35 days ago
    const targetTo = new Date(now);
    targetTo.setDate(targetTo.getDate() - 28); // 28 days ago

    const snapshot = await db.collection('customers')
      .where('lastVisit', '>=', targetFrom)
      .where('lastVisit', '<=', targetTo)
      .get();

    if (snapshot.empty) return NextResponse.json({ sent: 0 });

    const results = await Promise.allSettled(
      snapshot.docs.map(async (d) => {
        const { name, email } = d.data();
        if (!email) return;

        await resend.emails.send({
          from: FROM,
          to: email,
          subject: 'Wir vermissen Sie — Zeit für eine neue Behandlung! 💅',
          html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #F0F0F0;">
    <div style="background:#1A1A1A;padding:40px;text-align:center;">
      <p style="color:#C8A97E;font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">Studio Cherry</p>
      <h1 style="color:#fff;font-size:22px;font-style:italic;margin:0;font-weight:normal;">Wir vermissen Sie!</h1>
    </div>
    <div style="padding:48px 40px;text-align:center;">
      <p style="color:#555;font-size:15px;line-height:1.9;margin:0 0 32px;">
        Hallo <strong>${name?.split(' ')[0] || 'liebe Kundin'}</strong>,<br><br>
        es ist schon eine Weile her — Zeit, sich wieder etwas Gutes zu tun.
      </p>
      <a href="${BOOKING_URL}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 40px;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Jetzt Termin buchen</a>
      <p style="color:#CCC;font-size:11px;margin-top:40px;font-family:Arial,sans-serif;font-style:italic;">Wir freuen uns auf Ihren nächsten Besuch.</p>
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
    console.log(`Revisit emails sent: ${sent}/${snapshot.docs.length}`);
    return NextResponse.json({ sent });
  } catch (error) {
    console.error('Revisit cron error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
