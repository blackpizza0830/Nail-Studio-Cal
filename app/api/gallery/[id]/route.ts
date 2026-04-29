import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    await db.collection('gallery').doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE gallery error:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen.' }, { status: 500 });
  }
}
