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

export default function BookingPage() {
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK || 'demo';

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    script.onload = () => {
      if (window.Cal) {
        window.Cal('init', 'booking', { origin: 'https://cal.com' });
        window.Cal.ns.booking('inline', {
          elementOrSelector: '#cal-inline',
          config: { layout: 'month_view' },
          calLink,
        });
        window.Cal.ns.booking('ui', {
          styles: { branding: { brandColor: '#1A1A1A' } },
          hideEventTypeDetails: false,
          layout: 'month_view',
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [calLink]);

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="max-w-5xl mx-auto py-20 px-6">
        <div className="mb-16 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#999] mb-4">Studio Cherry</p>
          <h1 className="text-4xl font-serif italic">Termin buchen</h1>
          <p className="text-sm text-[#999] mt-4 font-light">24/7 online buchen — sofortige Bestätigung per E-Mail</p>
        </div>
        <div
          id="cal-inline"
          style={{ width: '100%', height: '800px', overflow: 'scroll' }}
        />
      </section>
      <Footer />
    </main>
  );
}
