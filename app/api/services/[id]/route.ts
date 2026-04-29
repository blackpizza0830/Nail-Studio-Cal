import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getAdminDb();
    await db.collection('services').doc(id).update({
      ...body,
      updatedAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PUT service error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    await db.collection('services').doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE service error:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen.' }, { status: 500 });
  }
}
