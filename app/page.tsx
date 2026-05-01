'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Nav } from '@/components/nav';
import { Hero } from '@/components/hero';
import { Services } from '@/components/services';
import { Gallery } from '@/components/gallery';
import { About } from '@/components/about';
import { Footer } from '@/components/footer';
import { Testimonials } from '@/components/testimonials';

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Nav />
      <div>
        <Hero />
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
          <Gallery />
          <Services />
        </div>
        <Testimonials />
        <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-32">
          <About />
          <section id="kontakt" className="py-24 border-t border-brand-border text-center">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-gray mb-8 block">Kontakt</span>
            <h2 className="text-4xl md:text-5xl font-serif italic mb-12">Kommen Sie vorbei</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-sm text-brand-gray font-light">
              <div>
                <h3 className="uppercase tracking-widest font-bold text-brand-ink mb-4">Adresse</h3>
                <p>Münzgasse 2<br />01067 Dresden</p>
              </div>
              <div>
                <h3 className="uppercase tracking-widest font-bold text-brand-ink mb-4">Öffnungszeiten</h3>
                <p>Mo - Fr: 09:00 - 18:00<br />Sa: 10:00 - 16:00</p>
              </div>
              <div>
                <h3 className="uppercase tracking-widest font-bold text-brand-ink mb-4">Direkt</h3>
                <p>Tel: +49 123 456789<br />Mail: hello@studio-cherry.de</p>
              </div>
            </div>
            <Link href="/booking" className="inline-block mt-16 minimal-button px-16">
              Termin buchen
            </Link>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
