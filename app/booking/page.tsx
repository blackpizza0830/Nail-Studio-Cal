'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfToday, isSameDay, isBefore, eachDayOfInterval, startOfMonth, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { collection, serverTimestamp, query, where, onSnapshot, doc, setDoc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { ChevronLeft, Check, Loader2, Clock, Euro } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const SERVICES = [
  { id: 'manikuere-klassisch',  name: 'Maniküre Klassisch',   price: 35,  priceLabel: '35 €',      duration: '45 Min', desc: 'Pflege, Form & Lack' },
  { id: 'gel-manikuere',        name: 'Gel-Maniküre',         price: 48,  priceLabel: '48 €',      duration: '60 Min', desc: 'Langanhaltend & strapazierfähig' },
  { id: 'naildesign-nailart',   name: 'Naildesign / Nailart', price: 68,  priceLabel: '68 €',      duration: '90 Min', desc: 'Kreative Designs & Nail Art' },
  { id: 'auffullen-gel',        name: 'Auffüllen Gel',        price: 42,  priceLabel: '42 €',      duration: '60 Min', desc: 'Auffüllen bestehender Gelnägel' },
  { id: 'french-nails',         name: 'French Nails',         price: 55,  priceLabel: '55 €',      duration: '75 Min', desc: 'Der Klassiker — zeitlos & elegant' },
  { id: 'babyboomer',           name: 'Babyboomer',           price: 58,  priceLabel: '58 €',      duration: '75 Min', desc: 'Natürlicher Ombré-Look' },
  { id: 'nagelverlangerung',    name: 'Nagelverlängerung',    price: 75,  priceLabel: '75 €',      duration: '120 Min', desc: 'Verlängerung & Modellage' },
  { id: 'entfernung',           name: 'Entfernung',           price: 20,  priceLabel: '20 €',      duration: '30 Min', desc: 'Schonende Gel- oder Acrylentfernung' },
  { id: 'beratung',             name: 'Beratung',             price: 0,   priceLabel: 'Kostenlos', duration: '15 Min', desc: 'Persönliche Beratung vorab' },
];

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const CLOSED_DAYS = [0]; // 0 = Sunday

type Step = 'service' | 'datetime' | 'confirm' | 'success';

function BookingContent() {
  const searchParams = useSearchParams();
  const rescheduleId = searchParams.get('reschedule');
  const serviceParam = searchParams.get('service');

  const initialService = SERVICES.find(s => s.id === serviceParam) ?? SERVICES[0];

  const [step, setStep] = useState<Step>(serviceParam ? 'datetime' : 'service');
  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' });
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);

  const [blockedTimes, setBlockedTimes] = useState<{ date: string; time: string | null }[]>([]);
  const [existingBookings, setExistingBookings] = useState<{ date: string; time: string }[]>([]);

  useEffect(() => {
    const unsubBlocks = onSnapshot(query(collection(db, 'blocked_times')), (snap) => {
      setBlockedTimes(snap.docs.map(d => d.data() as { date: string; time: string | null }));
    });
    const unsubBookings = onSnapshot(
      query(collection(db, 'bookings'), where('status', '==', 'confirmed')),
      (snap) => setExistingBookings(snap.docs.map(d => d.data() as { date: string; time: string }))
    );
    return () => { unsubBlocks(); unsubBookings(); };
  }, []);

  useEffect(() => {
    if (rescheduleId) {
      updateDoc(doc(db, 'bookings', rescheduleId), { status: 'cancelled' }).catch(console.error);
    }
  }, [rescheduleId]);

  const isSlotAvailable = (date: Date, time: string) => {
    const dStr = format(date, 'yyyy-MM-dd');
    if (blockedTimes.some(b => b.date === dStr && (b.time === null || b.time === time))) return false;
    if (existingBookings.some(b => b.date === dStr && b.time === time)) return false;
    return true;
  };

  const isDateUnavailable = (date: Date) => {
    if (CLOSED_DAYS.includes(getDay(date))) return true;
    const dStr = format(date, 'yyyy-MM-dd');
    if (blockedTimes.some(b => b.date === dStr && b.time === null)) return true;
    return TIME_SLOTS.every(t => !isSlotAvailable(date, t));
  };

  const days = useMemo(() => {
    const start = startOfMonth(new Date());
    return eachDayOfInterval({ start, end: addDays(start, 55) });
  }, []);

  const handleBooking = async () => {
    if (!selectedTime) return;
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        date: dateStr,
        time: selectedTime,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        note: form.note,
        status: 'confirmed',
        createdAt: serverTimestamp(),
      });
      setLastBookingId(docRef.id);

      // Upsert customer — non-blocking, doesn't affect booking success
      const customerId = form.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      setDoc(doc(db, 'customers', customerId), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        lastVisit: serverTimestamp(),
        visitCount: increment(1),
        points: increment(10),
      }, { merge: true }).catch(console.error);

      // Send email (fire and forget)
      const bookingId = docRef.id;
      fetch('/api/email/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, customerName: form.name, customerEmail: form.email, customerPhone: form.phone, serviceName: selectedService.name, date: dateStr, time: selectedTime }),
      }).catch(console.error);

      setStep('success');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = ['service', 'datetime', 'confirm'].indexOf(step);

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="max-w-4xl mx-auto py-20 px-6 lg:px-12">

        {/* Header + progress */}
        <div className="flex justify-between items-center mb-16">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#999] mb-2">Studio Cherry</p>
            <h1 className="text-3xl font-serif italic">Termin buchen</h1>
          </div>
          {step !== 'success' && (
            <div className="flex gap-2">
              {['service', 'datetime', 'confirm'].map((s, i) => (
                <div key={s} className={`h-1 w-10 rounded-full transition-all duration-500 ${stepIndex >= i ? 'bg-brand-ink' : 'bg-zinc-100'}`} />
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Service ── */}
          {step === 'service' && (
            <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#999] mb-8">Schritt 1 — Behandlung wählen</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SERVICES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setStep('datetime'); }}
                    className={`text-left p-6 border transition-all hover:border-brand-ink hover:shadow-sm rounded-xl group ${selectedService.id === s.id ? 'border-brand-ink bg-brand-bg' : 'border-[#EFEFEF] bg-white'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-sm leading-snug pr-2">{s.name}</h3>
                      <span className="font-serif italic text-brand-ink shrink-0">{s.priceLabel}</span>
                    </div>
                    <p className="text-[11px] text-[#BBB] mb-4 leading-relaxed">{s.desc}</p>
                    <div className="flex items-center gap-1 text-[10px] text-[#999] font-medium">
                      <Clock size={10} />{s.duration}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Date + Time ── */}
          {step === 'datetime' && (
            <motion.div key="datetime" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setStep('service')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#999] hover:text-brand-ink font-bold mb-8">
                <ChevronLeft size={14} /> Zurück
              </button>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#999] mb-8">Schritt 2 — Datum & Uhrzeit</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Calendar */}
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold mb-6">Datum wählen</p>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => (
                      <div key={d} className="text-center text-[9px] text-[#CCC] py-1 font-bold uppercase">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {/* offset for first day */}
                    {Array.from({ length: (getDay(days[0]) + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
                    {days.map(day => {
                      const isPast = isBefore(day, startOfToday());
                      const unavailable = isPast || isDateUnavailable(day);
                      const isSelected = isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, startOfToday());
                      return (
                        <button
                          key={day.toISOString()}
                          disabled={unavailable}
                          onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                          className={`aspect-square text-[11px] rounded-lg flex items-center justify-center transition-all font-medium
                            ${isSelected ? 'bg-brand-ink text-white' :
                              unavailable ? 'text-zinc-200 cursor-not-allowed' :
                              isToday ? 'border border-brand-ink text-brand-ink hover:bg-brand-bg' :
                              'hover:bg-brand-bg text-[#444]'}`}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-[#CCC] mt-4 italic">* Sonntags geschlossen</p>
                </div>

                {/* Time slots */}
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold mb-6">
                    Uhrzeit — {format(selectedDate, 'PPP', { locale: de })}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map(t => {
                      const available = isSlotAvailable(selectedDate, t);
                      return (
                        <button
                          key={t}
                          disabled={!available}
                          onClick={() => setSelectedTime(t)}
                          className={`py-3 text-xs font-bold uppercase tracking-widest rounded-lg border transition-all
                            ${selectedTime === t ? 'bg-brand-ink text-white border-brand-ink' :
                              !available ? 'bg-zinc-50 text-zinc-200 border-zinc-100 cursor-not-allowed' :
                              'border-[#EFEFEF] hover:border-brand-ink hover:bg-brand-bg'}`}
                        >
                          {t} {!available && <span className="text-[8px] normal-case font-normal">Belegt</span>}
                        </button>
                      );
                    })}
                  </div>
                  {selectedTime && (
                    <button onClick={() => setStep('confirm')} className="w-full mt-8 minimal-button py-4">
                      Weiter →
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-lg mx-auto">
              <button onClick={() => setStep('datetime')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#999] hover:text-brand-ink font-bold mb-8">
                <ChevronLeft size={14} /> Zurück
              </button>
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#999] mb-8">Schritt 3 — Ihre Daten</p>

              {/* Summary */}
              <div className="p-6 bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl mb-8">
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#CCC] mb-4">Zusammenfassung</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-serif italic text-brand-ink">{selectedService.name}</span>
                    <span className="font-bold text-sm">{selectedService.priceLabel}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[#999]">
                    <span>{format(selectedDate, 'PPP', { locale: de })}</span>
                    <span className="font-bold">{selectedTime} Uhr</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#CCC]">
                    <Clock size={9} /> {selectedService.duration}
                  </div>
                </div>
              </div>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleBooking(); }}>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border border-[#E8E8E8] rounded-lg p-3.5 text-sm focus:outline-none focus:border-brand-ink transition-colors"
                    placeholder="Vollständiger Name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">E-Mail *</label>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full border border-[#E8E8E8] rounded-lg p-3.5 text-sm focus:outline-none focus:border-brand-ink transition-colors"
                      placeholder="ihre@email.de" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Telefon *</label>
                    <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      className="w-full border border-[#E8E8E8] rounded-lg p-3.5 text-sm focus:outline-none focus:border-brand-ink transition-colors"
                      placeholder="+49" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Anmerkung</label>
                  <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                    className="w-full border border-[#E8E8E8] rounded-lg p-3.5 text-sm focus:outline-none focus:border-brand-ink transition-colors resize-none"
                    rows={3} placeholder="Wünsche, Hinweise..." />
                </div>
                <button disabled={loading} className="w-full minimal-button py-4 flex justify-center items-center gap-2 h-14 mt-2">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Termin bestätigen'}
                </button>
                <p className="text-[9px] uppercase tracking-widest text-[#CCC] text-center leading-relaxed">
                  Stornierungen kostenlos bis 24h vor dem Termin
                </p>
              </form>
            </motion.div>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
              <div className="w-20 h-20 bg-brand-ink text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-brand-ink/20">
                <Check size={36} />
              </div>
              <h2 className="text-3xl font-serif italic mb-4">Buchung erfolgreich!</h2>
              <p className="text-[#999] font-light max-w-sm mx-auto mb-2 leading-relaxed">
                Vielen Dank, <strong className="text-brand-ink">{form.name.split(' ')[0]}</strong>.<br />
                Ihr Termin ist bestätigt.
              </p>
              <p className="text-[10px] uppercase tracking-widest text-[#CCC] mb-10">
                Bestätigung geht an {form.email}
              </p>
              <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
                <Link href="/" className="minimal-button w-full py-4 text-center">Zurück zur Startseite</Link>
                {lastBookingId && (
                  <>
                    <Link
                      href={`/booking?reschedule=${lastBookingId}`}
                      className="w-full py-4 text-center border border-brand-ink text-brand-ink rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-brand-bg transition-colors"
                    >
                      Termin verschieben
                    </Link>
                    <Link
                      href={`/booking/manage/${lastBookingId}`}
                      className="w-full py-4 text-center border border-[#EFEFEF] text-[#999] rounded-xl text-[10px] uppercase tracking-widest font-bold hover:border-red-200 hover:text-red-400 transition-colors"
                    >
                      Termin stornieren
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
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
