'use client';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { useEffect } from 'react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cal?: any;
  }
}

const CAL_USERNAME = 'hyeonjin-sun-park-qcbfta';
const CAL_ORIGIN = 'https://cal.eu';
const CAL_EMBED_SCRIPT = 'https://app.cal.eu/embed/embed.js';

export default function BookingPage() {
  useEffect(() => {
    if (document.querySelector('script[src="' + CAL_EMBED_SCRIPT + '"]')) return;

    const script = document.createElement('script');
    script.src = CAL_EMBED_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (!window.Cal) return;
      window.Cal('init', 'booking', { origin: CAL_ORIGIN });
      window.Cal.ns.booking('inline', {
        elementOrSelector: '#cal-inline',
        config: { layout: 'month_view' },
        calLink: CAL_USERNAME,
      });
      window.Cal.ns.booking('ui', {
        styles: { branding: { brandColor: '#1A1A1A' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    };
    document.head.appendChild(script);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="max-w-5xl mx-auto py-20 px-6">
        <div className="mb-16 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#999] mb-4">Studio Cherry</p>
          <h1 className="text-4xl font-serif italic mb-4">Termin buchen</h1>
          <p className="text-sm text-[#999] font-light">24/7 online buchen — sofortige Bestätigung per E-Mail</p>
        </div>

        {/* Services quick-link row */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { label: 'Gel-Maniküre', slug: '30min' },
            { label: 'Auffüllen Gel', slug: 'auffullen-gel' },
            { label: 'Babyboomer', slug: 'babyboomer' },
            { label: 'Naildesign / Nailart', slug: 'naildesign-nailart' },
          ].map(({ label, slug }) => (
            <a
              key={slug}
              href={`${CAL_ORIGIN}/${CAL_USERNAME}/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 sleek-border text-[10px] uppercase tracking-widest font-bold hover:bg-brand-bg hover:border-brand-ink transition-all"
            >
              {label}
            </a>
          ))}
        </div>

        <div
          id="cal-inline"
          style={{ width: '100%', height: '820px', overflow: 'scroll' }}
        />
      </section>
      <Footer />
    </main>
  );
}
