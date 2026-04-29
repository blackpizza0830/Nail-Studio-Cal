'use client';

import { useState, Suspense } from 'react';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronLeft, ExternalLink, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// ─── Service display cards ───────────────────────────────────────────────────
// 카드는 서비스 정보 표시용 — 클릭 시 아래 neetocal 임베드가 열림
const SERVICES = [
  { id: 'manikuere-klassisch',  name: 'Maniküre Klassisch',   priceLabel: '35 €',      duration: '45 Min',  desc: 'Pflege, Form & Lack' },
  { id: 'gel-manikuere',        name: 'Gel-Maniküre',         priceLabel: '48 €',      duration: '60 Min',  desc: 'Langanhaltend & strapazierfähig' },
  { id: 'naildesign-nailart',   name: 'Naildesign / Nailart', priceLabel: '68 €',      duration: '90 Min',  desc: 'Kreative Designs & Nail Art' },
  { id: 'auffullen-gel',        name: 'Auffüllen Gel',        priceLabel: '42 €',      duration: '60 Min',  desc: 'Auffüllen bestehender Gelnägel' },
  { id: 'french-nails',         name: 'French Nails',         priceLabel: '55 €',      duration: '75 Min',  desc: 'Der Klassiker — zeitlos & elegant' },
  { id: 'babyboomer',           name: 'Babyboomer',           priceLabel: '58 €',      duration: '75 Min',  desc: 'Natürlicher Ombré-Look' },
  { id: 'nagelverlangerung',    name: 'Nagelverlängerung',    priceLabel: '75 €',      duration: '120 Min', desc: 'Verlängerung & Modellage' },
  { id: 'entfernung',           name: 'Entfernung',           priceLabel: '20 €',      duration: '30 Min',  desc: 'Schonende Gel- oder Acrylentfernung' },
  { id: 'beratung',             name: 'Beratung',             priceLabel: 'Kostenlos', duration: '15 Min',  desc: 'Persönliche Beratung vorab' },
];

// neetocal 전체 페이지를 임베드 — 서비스 선택 후 neetocal 자체 UI에서 예약 진행
const NEETOCAL_EMBED_URL = 'https://nail-studio.neetocal.com';

type Service = (typeof SERVICES)[number];

function BookingContent() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');

  const initialService = SERVICES.find(s => s.id === serviceParam) ?? null;
  const [selected, setSelected] = useState<Service | null>(initialService);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="max-w-4xl mx-auto py-20 px-6 lg:px-12">

        {/* Header */}
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#999] mb-2">Studio Cherry</p>
          <h1 className="text-3xl font-serif italic">Termin buchen</h1>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Service selection ── */}
          {!selected && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#999] mb-8">
                Behandlung wählen
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SERVICES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelected(s); setIframeLoaded(false); }}
                    className="text-left p-6 border border-[#EFEFEF] rounded-xl hover:border-brand-ink hover:shadow-sm transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-sm leading-snug pr-2">{s.name}</h3>
                      <span className="font-serif italic text-brand-ink shrink-0">{s.priceLabel}</span>
                    </div>
                    <p className="text-[11px] text-[#BBB] mb-4 leading-relaxed">{s.desc}</p>
                    <div className="flex items-center gap-1 text-[10px] text-[#999] font-medium">
                      <Clock size={10} /> {s.duration}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: NeetoCal embed ── */}
          {selected && (
            <motion.div
              key="embed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              {/* Back + summary bar */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => { setSelected(null); setIframeLoaded(false); }}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#999] hover:text-brand-ink font-bold transition-colors"
                >
                  <ChevronLeft size={14} /> Zurück
                </button>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-serif italic text-brand-ink">{selected.name}</span>
                  <span className="text-[#999] text-[11px]">
                    <Clock size={10} className="inline mr-1" />{selected.duration}
                  </span>
                  <span className="font-bold text-sm">{selected.priceLabel}</span>
                </div>
              </div>

              {/* NeetoCal iframe */}
              <div className="rounded-2xl overflow-hidden border border-[#F0F0F0] shadow-sm relative">
                {/* Loading spinner */}
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#FAFAFA] min-h-[400px]">
                    <Loader2 className="animate-spin text-brand-ink" size={28} />
                    <p className="text-[10px] uppercase tracking-widest text-[#CCC]">Kalender wird geladen…</p>
                  </div>
                )}
                <iframe
                  src={NEETOCAL_EMBED_URL}
                  title={`Termin buchen — ${selected.name}`}
                  className="w-full border-none"
                  style={{ minHeight: '750px', display: iframeLoaded ? 'block' : 'block' }}
                  allow="payment"
                  onLoad={() => setIframeLoaded(true)}
                />
              </div>

              {/* Fallback link if iframe is blocked */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <a
                  href={NEETOCAL_EMBED_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#AAA] hover:text-brand-ink transition-colors font-bold"
                >
                  <ExternalLink size={11} />
                  Kalender in neuem Tab öffnen
                </a>
              </div>

              <p className="text-[9px] uppercase tracking-widest text-[#CCC] text-center mt-3 leading-relaxed">
                Stornierungen kostenlos bis 24h vor dem Termin · Buchung gesichert via NeetoCal
              </p>
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-serif italic text-zinc-300">
        Laden...
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
