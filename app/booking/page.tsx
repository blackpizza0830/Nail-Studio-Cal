'use client';

import { useEffect, Suspense } from 'react';
import { getCalApi } from '@calcom/embed-react';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// ─── Cal.com config ───────────────────────────────────────────────────────────
// calLink: "username/event-slug"
// 서비스별 Cal.com 이벤트 타입을 만들면 아래 calLink를 각각 지정할 수 있습니다.
// 지금은 하나의 이벤트 타입("30min")을 모든 서비스에 공유합니다.
const CAL_USERNAME = 'hyeonjin-sun-park-vocrbh';
const CAL_DEFAULT_SLUG = '30min';

const SERVICES = [
  { id: 'manikuere-klassisch',  name: 'Maniküre Klassisch',   priceLabel: '35 €',      duration: '45 Min',  desc: 'Pflege, Form & Lack',                  calSlug: CAL_DEFAULT_SLUG },
  { id: 'gel-manikuere',        name: 'Gel-Maniküre',         priceLabel: '48 €',      duration: '60 Min',  desc: 'Langanhaltend & strapazierfähig',       calSlug: CAL_DEFAULT_SLUG },
  { id: 'naildesign-nailart',   name: 'Naildesign / Nailart', priceLabel: '68 €',      duration: '90 Min',  desc: 'Kreative Designs & Nail Art',           calSlug: CAL_DEFAULT_SLUG },
  { id: 'auffullen-gel',        name: 'Auffüllen Gel',        priceLabel: '42 €',      duration: '60 Min',  desc: 'Auffüllen bestehender Gelnägel',        calSlug: CAL_DEFAULT_SLUG },
  { id: 'french-nails',         name: 'French Nails',         priceLabel: '55 €',      duration: '75 Min',  desc: 'Der Klassiker — zeitlos & elegant',     calSlug: CAL_DEFAULT_SLUG },
  { id: 'babyboomer',           name: 'Babyboomer',           priceLabel: '58 €',      duration: '75 Min',  desc: 'Natürlicher Ombré-Look',                calSlug: CAL_DEFAULT_SLUG },
  { id: 'nagelverlangerung',    name: 'Nagelverlängerung',    priceLabel: '75 €',      duration: '120 Min', desc: 'Verlängerung & Modellage',              calSlug: CAL_DEFAULT_SLUG },
  { id: 'entfernung',           name: 'Entfernung',           priceLabel: '20 €',      duration: '30 Min',  desc: 'Schonende Gel- oder Acrylentfernung',   calSlug: CAL_DEFAULT_SLUG },
  { id: 'beratung',             name: 'Beratung',             priceLabel: 'Kostenlos', duration: '15 Min',  desc: 'Persönliche Beratung vorab',            calSlug: CAL_DEFAULT_SLUG },
];

function BookingContent() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');

  // Cal.com embed 초기화 — 팝업 UI 설정
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: 'nail-studio' });
      cal('ui', {
        hideEventTypeDetails: false,
        layout: 'month_view',
        theme: 'light',
      });
    })();
  }, []);

  // URL에 ?service=xxx 파라미터가 있으면 즉시 해당 서비스로 팝업 열기
  useEffect(() => {
    if (!serviceParam) return;
    const service = SERVICES.find(s => s.id === serviceParam);
    if (!service) return;

    (async () => {
      const cal = await getCalApi({ namespace: 'nail-studio' });
      cal('modal', {
        calLink: `${CAL_USERNAME}/${service.calSlug}`,
        config: { layout: 'month_view' },
      });
    })();
  }, [serviceParam]);

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="max-w-4xl mx-auto py-20 px-6 lg:px-12">

        {/* Header */}
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#999] mb-2">Studio Cherry</p>
          <h1 className="text-3xl font-serif italic">Termin buchen</h1>
          <p className="text-sm text-[#999] mt-3 font-light">
            Behandlung wählen — der Kalender öffnet sich direkt.
          </p>
        </div>

        {/* Service grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-4"
        >
          {SERVICES.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              // Cal.com popup trigger — data 속성으로 연결
              data-cal-namespace="nail-studio"
              data-cal-link={`${CAL_USERNAME}/${s.calSlug}`}
              data-cal-config={JSON.stringify({ layout: 'month_view' })}
              className="text-left p-6 border border-[#EFEFEF] rounded-xl hover:border-brand-ink hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium text-sm leading-snug pr-2 group-hover:text-brand-ink transition-colors">
                  {s.name}
                </h3>
                <span className="font-serif italic text-brand-ink shrink-0">{s.priceLabel}</span>
              </div>
              <p className="text-[11px] text-[#BBB] mb-4 leading-relaxed">{s.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-[#999] font-medium">
                  <Clock size={10} /> {s.duration}
                </div>
                <span className="text-[9px] uppercase tracking-widest font-bold text-[#CCC] group-hover:text-brand-ink transition-colors">
                  Buchen →
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <p className="text-[9px] uppercase tracking-widest text-[#CCC] text-center mt-12 leading-relaxed">
          Stornierungen kostenlos bis 24h vor dem Termin · Buchung gesichert via Cal.com
        </p>

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
