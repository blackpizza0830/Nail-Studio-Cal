'use client';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

export default function ManageBookingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="max-w-xl mx-auto py-32 px-6 text-center">
        <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-border">
          <Calendar size={24} className="text-brand-ink" />
        </div>
        <h1 className="text-3xl font-serif italic mb-4">Termin verwalten</h1>
        <p className="text-sm text-[#999] font-light leading-relaxed mb-12 max-w-sm mx-auto">
          Termine werden über Cal.com verwaltet. Sie haben eine E-Mail mit einem Link zur Verwaltung Ihres Termins erhalten.
        </p>
        <div className="flex flex-col items-center gap-4">
          <Link href="/booking" className="minimal-button px-12 py-4">
            Neuen Termin buchen
          </Link>
          <Link href="/" className="text-[10px] uppercase tracking-widest font-bold text-[#CCC] hover:text-brand-ink transition-colors">
            Zurück zur Startseite
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
