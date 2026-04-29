'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, Check, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const SERVICES = [
  { id: 'shellac', name: 'Shellac Maniküre', price: '45 €', duration: '60 Min', desc: 'Inkl. Reinigung & Pflege' },
  { id: 'gel', name: 'Gel Neumodellage', price: '65 €', duration: '90 Min', desc: 'Verlängerung & Design' },
  { id: 'lash-lift', name: 'Lash Lift', price: '60 €', duration: '60 Min', desc: 'Bringen Sie Ihre Wimpern in Schwung' },
  { id: 'brow-lam', name: 'Brow Lamination', price: '50 €', duration: '45 Min', desc: 'Perfekt geformte Augenbrauen' },
];

const TIME_SLOTS = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

type Step = 'service' | 'datetime' | 'confirm' | 'success';

function BookingContent() {
  const searchParams = useSearchParams();
  const rescheduleId = searchParams.get('reschedule');

  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' });
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);

  // Real-time block and existing booking tracking
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  useEffect(() => {
    // 1. Listen for block times
    const qBlocks = query(collection(db, 'blocked_times'));
    const unsubBlocks = onSnapshot(qBlocks, (snap) => {
      setBlockedTimes(snap.docs.map(doc => doc.data()));
    });

    // 2. Listen for current bookings to prevent double booking
    const qBookings = query(collection(db, 'bookings'), where('status', '==', 'confirmed'));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      setExistingBookings(snap.docs.map(doc => doc.data()));
    });

    return () => { unsubBlocks(); unsubBookings(); };
  }, []);

  const isSlotAvailable = (date: Date, time: string) => {
    const dStr = format(date, 'yyyy-MM-dd');
    
    // Check for admin blocks
    const isBlocked = blockedTimes.some(b => b.date === dStr && (b.time === null || b.time === time));
    if (isBlocked) return false;

    // Check for existing bookings
    const isBooked = existingBookings.some(b => b.date === dStr && b.time === time);
    if (isBooked) return false;

    return true;
  };

  const isDateFullyBlocked = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    const fullDayBlock = blockedTimes.some(b => b.date === dStr && b.time === null);
    if (fullDayBlock) return true;

    // Check if all slots are taken either by blocks or bookings
    return TIME_SLOTS.every(slot => !isSlotAvailable(date, slot));
  };

  useEffect(() => {
    if (rescheduleId) {
      setForm(prev => ({ ...prev, note: `Umbuchung von Termin ID: ${rescheduleId}` })); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [rescheduleId]);

  const days = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = addDays(start, 45);
    return eachDayOfInterval({ start, end });
  }, []);

  const handleBooking = async () => {
    if (!selectedTime) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        note: form.note,
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });
      setLastBookingId(docRef.id);
      setStep('success');
    } catch (error) {
      console.error("Booking error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="max-w-4xl mx-auto py-24 px-12">
        <div className="flex justify-between items-center mb-24">
          <h1 className="text-4xl font-serif italic">Termin buchen</h1>
          <div className="flex gap-4">
            {['service', 'datetime', 'confirm'].map((s, i) => (
              <div 
                key={s} 
                className={`h-1 w-12 transition-all duration-700 ${
                  (['service', 'datetime', 'confirm', 'success'].indexOf(step) >= i) ? 'bg-brand-ink' : 'bg-zinc-100'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {step === 'service' && (
              <motion.div
                key="service"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="mb-12">
                  <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#999] mb-4">Schritt 1</h2>
                  <p className="text-2xl font-serif">Behandlung wählen</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {SERVICES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedService(s); setStep('datetime'); }}
                      className={`service-item-card text-left transition-all hover:scale-[1.02] ${
                        selectedService.id === s.id ? 'border-brand-ink bg-brand-bg' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{s.name}</h3>
                        <span className="font-serif italic text-brand-ink">{s.price}</span>
                      </div>
                      <p className="text-xs text-[#999] mb-4">{s.desc}</p>
                      <div className="text-[9px] uppercase tracking-widest font-bold opacity-60">
                        {s.duration}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'datetime' && (
              <motion.div
                key="datetime"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <button onClick={() => setStep('service')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#999] hover:text-brand-ink transition-colors font-bold">
                  <ChevronLeft size={14} /> Zurück
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div>
                    <h3 className="text-sm uppercase tracking-widest font-bold mb-8">Tag Wählen</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                        <div key={d} className="text-center text-[10px] text-[#ccc] py-2 font-bold uppercase">{d}</div>
                      ))}
                      {days.map(day => {
                        const isPast = isBefore(day, startOfToday());
                        const isFullyBlocked = isDateFullyBlocked(day);
                        const disabled = isPast || isFullyBlocked;
                        return (
                          <button
                            key={day.toISOString()}
                            disabled={disabled}
                            onClick={() => setSelectedDate(day)}
                            className={`aspect-square text-[11px] transition-all flex items-center justify-center rounded-sm ${
                              isSameDay(day, selectedDate) ? 'bg-brand-ink text-white' : 
                              disabled ? 'text-zinc-200 cursor-not-allowed bg-zinc-50/50' : 'hover:bg-brand-bg'
                            } ${isFullyBlocked && !isPast ? 'line-through decoration-zinc-300' : ''}`}
                          >
                            {format(day, 'd')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm uppercase tracking-widest font-bold mb-8">Uhrzeit Wählen</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {TIME_SLOTS.map(t => {
                        const available = isSlotAvailable(selectedDate, t);
                        return (
                          <button
                            key={t}
                            disabled={!available}
                            onClick={() => setSelectedTime(t)}
                            className={`py-4 sleek-border text-xs transition-all uppercase tracking-widest font-bold ${
                              selectedTime === t ? 'bg-brand-ink text-white' : 
                              !available ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed opacity-50' : 'hover:bg-brand-bg'
                            }`}
                          >
                            {t} {!available && '— Belegt'}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTime && (
                      <button 
                        onClick={() => setStep('confirm')}
                        className="w-full mt-12 minimal-button"
                      >
                        Weiter
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto"
              >
                <button onClick={() => setStep('datetime')} className="mb-12 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#999] hover:text-brand-ink font-bold">
                  <ChevronLeft size={14} /> Zurück
                </button>

                <div className="space-y-8">
                  <div className="p-8 bg-brand-bg sleek-border mb-8">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#999] mb-6">Zusammenfassung</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-brand-border pb-4">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#ccc]">Service</span>
                        <span className="text-lg font-serif italic text-brand-ink">{selectedService.name}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-brand-border pb-4">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#ccc]">Datum</span>
                        <span className="text-sm">{format(selectedDate, 'PPP', { locale: de })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#ccc]">Uhrzeit</span>
                        <span className="text-sm">{selectedTime} Uhr</span>
                      </div>
                    </div>
                  </div>

                  <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleBooking(); }}>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold">Name</label>
                      <input 
                        required
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full sleek-border p-4 text-sm font-light focus:outline-none focus:border-brand-ink" 
                        placeholder="Vollständiger Name" 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold">Email</label>
                        <input 
                          required
                          type="email"
                          value={form.email}
                          onChange={e => setForm({...form, email: e.target.value})}
                          className="w-full sleek-border p-4 text-sm font-light focus:outline-none focus:border-brand-ink" 
                          placeholder="dein@email.de" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold">Telefon</label>
                        <input 
                          required
                          value={form.phone}
                          onChange={e => setForm({...form, phone: e.target.value})}
                          className="w-full sleek-border p-4 text-sm font-light focus:outline-none focus:border-brand-ink" 
                          placeholder="+49" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold">Anmerkung (Optional)</label>
                      <textarea 
                        value={form.note}
                        onChange={e => setForm({...form, note: e.target.value})}
                        className="w-full sleek-border p-4 text-sm font-light focus:outline-none focus:border-brand-ink" 
                        rows={3}
                      />
                    </div>

                    <button 
                      disabled={loading}
                      className="w-full minimal-button flex justify-center items-center gap-2 h-14"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : 'Termin Bestätigen'}
                    </button>

                    <p className="text-[9px] uppercase tracking-widest text-[#ccc] text-center leading-relaxed">
                      * Stornierungen und Änderungen sind bis zu 24 Stunden vor dem Termin kostenfrei möglich. 
                      Bei kurzfristigeren Absagen behalten wir uns vor, eine Gebühr zu erheben.
                    </p>
                  </form>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24"
              >
                <div className="w-20 h-20 bg-brand-ink text-white rounded-full flex items-center justify-center mx-auto mb-12 shadow-xl shadow-brand-ink/20">
                  <Check size={40} />
                </div>
                <h2 className="text-4xl font-serif italic mb-6">Buchung Erfolgreich!</h2>
                <p className="text-brand-gray font-light max-w-sm mx-auto mb-12 leading-relaxed">
                  Vielen Dank, {form.name.split(' ')[0]}. Ihr Termin wurde bestätigt. Wir freuen uns auf Ihren Besuch im Studio Cherry.
                </p>
                <div className="flex flex-col items-center gap-6">
                  {lastBookingId && (
                    <Link 
                      href={`/booking/manage/${lastBookingId}`}
                      className="text-[10px] uppercase tracking-widest font-bold text-brand-ink border-b border-brand-ink pb-1 mb-4"
                    >
                      Termin verwalten / stornieren
                    </Link>
                  )}
                  <Link href="/" className="minimal-button px-12">
                    Zurück zur Startseite
                  </Link>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#ccc]">
                    Eine Bestätigung wurde an {form.email} gesendet.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      <Footer />
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif italic text-zinc-300">Laden...</div>}>
      <BookingContent />
    </Suspense>
  );
}
