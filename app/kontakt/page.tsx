'use client';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { Mail, Phone, MapPin, Instagram } from 'lucide-react';

export default function KontaktPage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-7xl mx-auto py-24 px-12 grid grid-cols-1 lg:grid-cols-2 gap-24">
        {/* Left: Form */}
        <div>
          <h1 className="text-5xl font-serif mb-12 italic">Kontakt</h1>
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold">Name</label>
                <input type="text" className="w-full bg-brand-bg sleek-border p-4 text-sm font-light focus:outline-none focus:border-brand-ink" placeholder="Ihr Name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold">Email</label>
                <input type="email" className="w-full bg-brand-bg sleek-border p-4 text-sm font-light focus:outline-none focus:border-brand-ink" placeholder="email@beispiel.de" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold">Nachricht</label>
              <textarea rows={6} className="w-full bg-brand-bg sleek-border p-4 text-sm font-light focus:outline-none focus:border-brand-ink" placeholder="Wie können wir Ihnen helfen?" />
            </div>
            <div className="flex items-center gap-4">
              <input type="checkbox" id="gdpr" className="w-4 h-4 rounded border-brand-border" />
              <label htmlFor="gdpr" className="text-[10px] uppercase tracking-widest text-[#999]">Ich stimme der Datenschutzerklärung zu.</label>
            </div>
            <button className="minimal-button">Nachricht Senden</button>
          </form>
        </div>

        {/* Right: Info & Map */}
        <div className="space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-300">Anschrift</h3>
              <div className="flex gap-4 text-brand-gray font-light">
                <MapPin size={18} className="text-brand-ink shrink-0" />
                <p className="text-sm leading-relaxed">Münzgasse 2<br />01067 Dresden<br />Deutschland</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-300">Kontaktinfo</h3>
              <div className="flex flex-col gap-3 text-brand-gray font-light text-sm">
                <div className="flex items-center gap-4">
                  <Phone size={18} className="text-brand-ink" />
                  <p>+49 123 456789</p>
                </div>
                <div className="flex items-center gap-4">
                  <Mail size={18} className="text-brand-ink" />
                  <p>hello@studio-blanco.de</p>
                </div>
                <div className="flex items-center gap-4">
                  <Instagram size={18} className="text-brand-ink" />
                  <p>@studio_blanco</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-300">Öffnungszeiten</h3>
            <div className="text-sm font-light text-brand-gray space-y-2">
              <div className="flex justify-between border-b border-zinc-50 pb-2"><span>MO - FR</span><span>10:00 - 19:00</span></div>
              <div className="flex justify-between border-b border-zinc-50 pb-2"><span>SA</span><span>11:00 - 16:00</span></div>
              <div className="flex justify-between text-zinc-300"><span>SO</span><span>Geschlossen</span></div>
            </div>
          </div>

          <div className="aspect-square bg-brand-bg overflow-hidden sleek-border relative">
            {/* Google Maps Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-zinc-300 italic">
              [ Google Maps Embed ]
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
