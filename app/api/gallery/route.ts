import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET gallery error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Galerie.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url, alt } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL ist erforderlich.' }, { status: 400 });
    const db = getAdminDb();
    const docRef = await db.collection('gallery').add({
      url,
      alt: alt || '',
      createdAt: new Date(),
    });
    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error('POST gallery error:', error);
    return NextResponse.json({ error: 'Fehler beim Hinzufügen.' }, { status: 500 });
  }
}
