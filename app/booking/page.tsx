'use client';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { useState } from 'react';
import { Clock, Star, ChevronRight, X, Loader2 } from 'lucide-react';

const CAL_USERNAME = 'hyeonjin-sun-park-qcbfta';
const CAL_ORIGIN = 'https://cal.eu';

const SERVICES = [
  { name: 'Maniküre Klassisch',   slug: '15min',              duration: '45 Min', price: '€ 35',  desc: 'Pflege, Form & Lack' },
  { name: 'Gel-Maniküre',         slug: '30min',              duration: '60 Min', price: '€ 48',  desc: 'Langanhaltend & strapazierfähig' },
  { name: 'Naildesign / Nailart', slug: 'naildesign-nailart', duration: '90 Min', price: '€ 68',  desc: 'Kreative Designs & Nail Art' },
  { name: 'Auffüllen Gel',        slug: 'auffullen-gel',      duration: '60 Min', price: '€ 42',  desc: 'Auffüllen bestehender Gelnägel' },
  { name: 'French Nails',         slug: 'french-nails',       duration: '75 Min', price: '€ 55',  desc: 'Der Klassiker — zeitlos & elegant' },
  { name: 'Babyboomer',           slug: 'babyboomer',         duration: '75 Min', price: '€ 58',  desc: 'Natürlicher Ombré-Look' },
  { name: 'Nagelverlängerung',    slug: 'nagelverlangerung',  duration: '120 Min',price: '€ 75',  desc: 'Verlängerung & Modellage' },
  { name: 'Entfernung',           slug: 'entfernung',         duration: '30 Min', price: '€ 20',  desc: 'Schonende Gel- oder Acrylentfernung' },
  { name: 'Beratung',             slug: 'beratung',           duration: '15 Min', price: 'Kostenlos', desc: 'Persönliche Beratung vorab' },
];

const HOURS = [
  { day: 'Montag',     hours: '10:00 – 19:00' },
  { day: 'Dienstag',   hours: '10:00 – 19:00' },
  { day: 'Mittwoch',   hours: '10:00 – 19:00' },
  { day: 'Donnerstag', hours: '10:00 – 19:00' },
  { day: 'Freitag',    hours: '10:00 – 18:00' },
  { day: 'Samstag',    hours: '10:00 – 16:00' },
  { day: 'Sonntag',    hours: 'Geschlossen' },
];

const today = new Date().toLocaleDateString('de-DE', { weekday: 'long' });

export default function BookingPage() {
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const openBooking = (slug: string) => {
    setIframeLoaded(false);
    setModalUrl(`${CAL_ORIGIN}/${CAL_USERNAME}/${slug}`);
  };

  const closeModal = () => {
    setModalUrl(null);
    setIframeLoaded(false);
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <Nav />

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#C8A97E] mb-3">Studio Cherry</p>
          <h1 className="text-3xl font-serif italic mb-2">Termin online buchen</h1>
          <p className="text-sm text-[#999] font-light">24/7 · Kostenlos · Bezahlung vor Ort · Sofortige Bestätigung</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Services list */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#999] mb-6">Alle Leistungen</h2>
            {SERVICES.map((s) => (
              <div
                key={s.slug}
                className="bg-white border border-[#EFEFEF] rounded-xl p-5 flex items-center justify-between gap-4 hover:border-brand-ink hover:shadow-sm transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-sm text-[#1A1A1A]">{s.name}</h3>
                  </div>
                  <p className="text-[11px] text-[#BBB] mb-2">{s.desc}</p>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-[10px] text-[#999] font-medium">
                      <Clock size={10} />
                      {s.duration}
                    </span>
                    <span className="text-[10px] font-bold text-brand-ink">{s.price}</span>
                  </div>
                </div>
                <button
                  onClick={() => openBooking(s.slug)}
                  className="shrink-0 flex items-center gap-1.5 bg-[#1A1A1A] text-white px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-zinc-700 transition-all group-hover:scale-[1.02]"
                >
                  Buchen <ChevronRight size={11} />
                </button>
              </div>
            ))}
          </div>

          {/* Right: Info panel */}
          <div className="space-y-6">

            {/* Rating card */}
            <div className="bg-white border border-[#EFEFEF] rounded-xl p-6">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#999] mb-5">Bewertung</h3>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-[#1A1A1A] rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-lg">5,0</span>
                </div>
                <div className="space-y-1">
                  {['Empfang', 'Sauberkeit', 'Ambiente', 'Qualität'].map((label) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[9px] text-[#BBB] w-16">{label}</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={8} className="fill-[#C8A97E] text-[#C8A97E]" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-[#CCC] font-light italic">Alle Kunden würden uns weiterempfehlen.</p>
            </div>

            {/* Opening hours */}
            <div className="bg-white border border-[#EFEFEF] rounded-xl p-6">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#999] mb-5">Öffnungszeiten</h3>
              <div className="space-y-2.5">
                {HOURS.map(({ day, hours }) => {
                  const isToday = today === day;
                  return (
                    <div key={day} className={`flex justify-between items-center text-[11px] ${isToday ? 'font-bold text-[#1A1A1A]' : 'text-[#888]'}`}>
                      <span>{day}</span>
                      <span className={hours === 'Geschlossen' ? 'text-[#CCC]' : ''}>{hours}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info */}
            <div className="bg-white border border-[#EFEFEF] rounded-xl p-6 text-center">
              <p className="text-[10px] text-[#BBB] leading-relaxed">
                Nach der Buchung erhalten Sie eine<br />
                <strong className="text-[#888]">Bestätigungs-E-Mail</strong> mit allen Details.
              </p>
            </div>

          </div>
        </div>
      </div>

      <Footer />

      {/* Cal.eu booking modal */}
      {modalUrl && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full sm:rounded-2xl overflow-hidden sm:max-w-2xl h-[92vh] sm:h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0] shrink-0">
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#999]">Termin buchen · Studio Cherry</p>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X size={16} className="text-[#999]" />
              </button>
            </div>

            {/* Loading state */}
            {!iframeLoaded && (
              <div className="absolute inset-0 mt-14 flex items-center justify-center bg-white pointer-events-none z-10">
                <Loader2 size={28} className="animate-spin text-[#CCC]" />
              </div>
            )}

            {/* Cal.eu iframe */}
            <iframe
              src={modalUrl}
              className="flex-1 w-full border-0"
              onLoad={() => setIframeLoaded(true)}
              allow="payment"
            />
          </div>
        </div>
      )}
    </main>
  );
}
