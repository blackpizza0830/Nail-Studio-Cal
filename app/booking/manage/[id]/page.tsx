'use client';

import { useState, useEffect } from 'react';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { motion } from 'motion/react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { format, parseISO, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ManageBookingPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const docRef = doc(db, 'bookings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() });
        } else {
          setMessage({ type: 'error', text: 'Reservierung nicht gefunden.' });
        }
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Ein Fehler ist aufgetreten.' });
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    if (!booking) return;

    // Check 24 hour policy
    const appointmentDate = parseISO(`${booking.date}T${booking.time}`);
    const now = new Date();
    const hoursDiff = differenceInHours(appointmentDate, now);

    if (hoursDiff < 24) {
      setMessage({ 
        type: 'error', 
        text: 'Stornierungen sind nur bis zu 24 Stunden vor dem Termin möglich. Bitte kontaktieren Sie das Studio telefonisch.' 
      });
      return;
    }

    if (!confirm('Möchten Sie diesen Termin wirklich stornieren?')) return;

    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'bookings', id), { status: 'cancelled' });
      setBooking({ ...booking, status: 'cancelled' });
      setMessage({ type: 'success', text: 'Ihre Reservierung wurde erfolgreich storniert.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Stornierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-ink" size={32} />
    </div>
  );

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="max-w-xl mx-auto py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sleek-card"
        >
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-serif italic">Reservierung verwalten</h1>
          </div>

          {message && (
            <div className={`p-4 mb-8 flex gap-4 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle className="shrink-0" size={20} /> : <AlertCircle className="shrink-0" size={20} />}
              <p>{message.text}</p>
            </div>
          )}

          {booking && (
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 sleek-border bg-brand-bg">
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-100">
                     <Calendar size={18} className="text-brand-ink" />
                   </div>
                   <div>
                     <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Datum & Zeit</p>
                     <p className="text-sm font-medium">{format(parseISO(booking.date), 'PPP', { locale: de })} • {booking.time} Uhr</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 p-4 sleek-border">
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-100">
                     <Clock size={18} className="text-brand-ink" />
                   </div>
                   <div>
                     <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Behandlung</p>
                     <p className="text-sm font-medium">{booking.serviceName}</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 p-4 sleek-border">
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-100">
                     <div className="text-[10px] font-bold">P</div>
                   </div>
                   <div>
                     <p className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Status</p>
                     <p className={`text-sm font-bold uppercase tracking-wider ${
                        booking.status === 'confirmed' ? 'text-green-600' : 'text-red-500'
                     }`}>
                        {booking.status === 'confirmed' ? 'Bestätigt' : 'Storniert'}
                     </p>
                   </div>
                </div>
              </div>

              {booking.status === 'confirmed' && (
                <div className="space-y-4 pt-8 border-t border-brand-border">
                   <button 
                    disabled={actionLoading}
                    onClick={handleCancel}
                    className="w-full py-4 border border-red-500 text-red-500 text-[10px] uppercase tracking-widest font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                   >
                     {actionLoading ? <Loader2 className="animate-spin" size={14} /> : 'Termin stornieren'}
                   </button>
                   <Link href={`/booking?reschedule=${booking.id}`} className="block w-full py-4 bg-brand-ink text-white text-[10px] uppercase tracking-widest font-bold text-center hover:bg-zinc-800 transition-all">
                     Termin verschieben
                   </Link>
                   <p className="text-[9px] text-[#ccc] text-center italic">
                     * Terminänderungen (Verschiebungen) führen zur Stornierung des alten Termins.
                   </p>
                </div>
              )}

              {booking.status === 'cancelled' && (
                <Link href="/booking" className="block w-full py-4 bg-brand-ink text-white text-[10px] uppercase tracking-widest font-bold text-center">
                  Neuen Termin buchen
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </section>
      <Footer />
    </main>
  );
}
