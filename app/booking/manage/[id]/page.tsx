'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { motion } from 'motion/react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type Booking = {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  customerName: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
  source?: string;
  clientBookingUrl?: string;
};

export default function ManageBookingPage() {
  const params = useParams();
  const id = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'found' | 'notfound'>('loading');

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

  if (loadState === 'notfound' || !booking) {
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

  const isCancelled = booking.status === 'cancelled';
  const dateFormatted = format(parseISO(booking.date), 'PPPP', { locale: de });

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="max-w-xl mx-auto py-20 px-6">

        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#999] mb-2">Studio Cherry</p>
          <h1 className="text-3xl font-serif italic">Termin verwalten</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#EFEFEF] rounded-2xl overflow-hidden mb-8"
        >
          {/* Status bar */}
          <div className={`px-8 py-4 flex items-center gap-3 ${isCancelled ? 'bg-zinc-100' : 'bg-brand-ink'}`}>
            {isCancelled ? (
              <><XCircle size={16} className="text-zinc-400" /><span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Storniert</span></>
            ) : (
              <><CheckCircle size={16} className="text-white" /><span className="text-[10px] uppercase tracking-widest font-bold text-white">Bestätigt</span></>
            )}
          </div>

          {/* Details */}
          <div className="px-8 py-8 space-y-5">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#CCC] mb-1">Behandlung</p>
              <p className="text-lg font-serif italic text-brand-ink">{booking.serviceName}</p>
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
          </div>
        </motion.div>

        {/* Cal.com manage link */}
        {!isCancelled && (
          <div className="space-y-3">
            {booking.clientBookingUrl ? (
              <a
                href={booking.clientBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-brand-ink text-white rounded-xl py-4 text-[10px] uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
              >
                <ExternalLink size={14} />
                Termin verschieben / stornieren
              </a>
            ) : (
              <div className="bg-zinc-50 border border-[#EFEFEF] rounded-xl p-6 text-center">
                <p className="text-sm text-[#999] leading-relaxed">
                  Ihren Termin können Sie über den Link in Ihrer Cal.com-Bestätigungs-E-Mail verschieben oder stornieren.
                </p>
              </div>
            )}
            <p className="text-center text-[9px] uppercase tracking-widest text-[#CCC] pt-1">
              Stornierungen kostenlos bis 24h vor dem Termin
            </p>
          </div>
        )}

        {isCancelled && (
          <div className="text-center">
            <p className="text-sm text-[#999] mb-6">Ihr Termin wurde storniert.</p>
            <Link href="/booking" className="minimal-button px-12 py-4">Neuen Termin buchen</Link>
          </div>
        )}

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
