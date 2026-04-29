'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { motion } from 'motion/react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { format, parseISO, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type Booking = {
  id: string;
  serviceName: string;
  servicePrice: number;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note?: string;
  status: 'confirmed' | 'cancelled';
};

export default function ManageBookingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'found' | 'notfound'>('loading');
  const [action, setAction] = useState<'idle' | 'cancelling' | 'cancelled' | 'error'>('idle');

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'bookings', id)).then(snap => {
      if (snap.exists()) {
        setBooking({ id: snap.id, ...snap.data() } as Booking);
        setLoadState('found');
      } else {
        setLoadState('notfound');
      }
    }).catch(() => setLoadState('notfound'));
  }, [id]);

  if (loadState === 'loading') {
    return (
      <main className="min-h-screen bg-white">
        <Nav />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-ink" size={32} />
        </div>
        <Footer />
      </main>
    );
  }

  if (loadState === 'notfound') {
    return (
      <main className="min-h-screen bg-white">
        <Nav />
        <section className="max-w-xl mx-auto py-32 px-6 text-center">
          <XCircle size={48} className="text-zinc-300 mx-auto mb-6" />
          <h1 className="text-2xl font-serif italic mb-4">Termin nicht gefunden</h1>
          <p className="text-sm text-[#999] mb-10">Dieser Link ist ungültig oder der Termin existiert nicht mehr.</p>
          <Link href="/booking" className="minimal-button px-12 py-4">Neuen Termin buchen</Link>
        </section>
        <Footer />
      </main>
    );
  }

  if (!booking) return null;

  const appointmentDateTime = parseISO(`${booking.date}T${booking.time}:00`);
  const hoursUntil = differenceInHours(appointmentDateTime, new Date());
  const canCancel = booking.status === 'confirmed' && hoursUntil >= 24;
  const tooLate = booking.status === 'confirmed' && hoursUntil < 24 && hoursUntil > 0;
  const isPast = hoursUntil <= 0;
  const isCancelled = booking.status === 'cancelled';

  const dateFormatted = format(parseISO(booking.date), 'PPPP', { locale: de });

  const handleCancel = async () => {
    if (!canCancel) return;
    setAction('cancelling');
    try {
      await updateDoc(doc(db, 'bookings', id), { status: 'cancelled' });
      // Send cancellation emails
      await fetch('/api/email/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          serviceName: booking.serviceName,
          date: booking.date,
          time: booking.time,
        }),
      });
      setAction('cancelled');
      setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch {
      setAction('error');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="max-w-xl mx-auto py-20 px-6">

        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#999] mb-2">Studio Cherry</p>
          <h1 className="text-3xl font-serif italic">Termin verwalten</h1>
        </div>

        {/* Booking card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#EFEFEF] rounded-2xl overflow-hidden mb-8"
        >
          {/* Status bar */}
          <div className={`px-8 py-4 flex items-center gap-3 ${
            isCancelled ? 'bg-zinc-100' :
            isPast ? 'bg-zinc-50' :
            'bg-brand-ink'
          }`}>
            {isCancelled ? (
              <><XCircle size={16} className="text-zinc-400" /><span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Storniert</span></>
            ) : isPast ? (
              <><CheckCircle size={16} className="text-zinc-400" /><span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Vergangener Termin</span></>
            ) : (
              <><CheckCircle size={16} className="text-white" /><span className="text-[10px] uppercase tracking-widest font-bold text-white">Bestätigt</span></>
            )}
          </div>

          {/* Details */}
          <div className="px-8 py-8 space-y-5">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#CCC] mb-1">Behandlung</p>
              <p className="text-lg font-serif italic text-brand-ink">{booking.serviceName}</p>
              {booking.servicePrice > 0 && (
                <p className="text-[11px] text-[#999] mt-0.5">{booking.servicePrice} €</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#CCC] mb-1 flex items-center gap-1">
                  <Calendar size={8} /> Datum
                </p>
                <p className="text-sm font-medium">{dateFormatted}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#CCC] mb-1 flex items-center gap-1">
                  <Clock size={8} /> Uhrzeit
                </p>
                <p className="text-sm font-medium">{booking.time} Uhr</p>
              </div>
            </div>
            <div className="border-t border-[#F5F5F5] pt-5">
              <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#CCC] mb-1">Name</p>
              <p className="text-sm">{booking.customerName}</p>
            </div>
            {booking.note && (
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#CCC] mb-1">Anmerkung</p>
                <p className="text-sm text-[#666]">{booking.note}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        {action === 'cancelled' || isCancelled ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <p className="text-sm text-[#999] mb-6">Ihr Termin wurde erfolgreich storniert.</p>
            <Link href="/booking" className="minimal-button px-12 py-4">Neuen Termin buchen</Link>
          </motion.div>
        ) : isPast ? (
          <div className="text-center py-4">
            <p className="text-sm text-[#CCC]">Dieser Termin ist bereits vergangen.</p>
          </div>
        ) : tooLate ? (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex gap-4">
            <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">Stornierung nicht mehr möglich</p>
              <p className="text-xs text-amber-600 leading-relaxed">
                Kostenlose Stornierungen sind bis 24 Stunden vor dem Termin möglich.
                Ihr Termin ist in weniger als 24 Stunden.
              </p>
            </div>
          </div>
        ) : canCancel ? (
          <div className="space-y-3">
            {/* Reschedule */}
            <Link
              href={`/booking?reschedule=${id}`}
              className="flex items-center justify-center gap-2 w-full border border-brand-ink text-brand-ink rounded-xl py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-brand-bg transition-colors"
            >
              <RefreshCw size={14} />
              Termin verschieben
            </Link>
            {/* Cancel */}
            <button
              onClick={handleCancel}
              disabled={action === 'cancelling'}
              className="flex items-center justify-center gap-2 w-full border border-[#EFEFEF] text-[#999] rounded-xl py-4 text-[10px] uppercase tracking-widest font-bold hover:border-red-200 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {action === 'cancelling' ? (
                <><Loader2 size={14} className="animate-spin" /> Wird storniert…</>
              ) : (
                <><XCircle size={14} /> Termin stornieren</>
              )}
            </button>
            {action === 'error' && (
              <p className="text-center text-xs text-red-400">Fehler aufgetreten. Bitte versuchen Sie es erneut.</p>
            )}
            <p className="text-center text-[9px] uppercase tracking-widest text-[#CCC] pt-2">
              Stornierungen kostenlos bis 24h vor dem Termin
            </p>
          </div>
        ) : null}

        <div className="mt-12 text-center">
          <Link href="/" className="text-[10px] uppercase tracking-widest font-bold text-[#CCC] hover:text-brand-ink transition-colors">
            Zurück zur Startseite
          </Link>
        </div>

      </section>
      <Footer />
    </main>
  );
}
