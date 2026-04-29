import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('services').orderBy('order', 'asc').get();
    const services = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ services });
  } catch (error) {
    console.error('GET services error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Leistungen.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, duration, description, category } = body;
    if (!name || !price || !duration) {
      return NextResponse.json({ error: 'Name, Preis und Dauer sind erforderlich.' }, { status: 400 });
    }
    const db = getAdminDb();
    const countSnap = await db.collection('services').count().get();
    const docRef = await db.collection('services').add({
      name, price, duration,
      description: description || '',
      category: category || 'Allgemein',
      order: countSnap.data().count,
      createdAt: new Date(),
    });
    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error('POST service error:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen der Leistung.' }, { status: 500 });
  }
}
