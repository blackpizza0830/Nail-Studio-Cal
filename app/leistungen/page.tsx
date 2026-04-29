'use client';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import Link from 'next/link';

const SERVICES = [
  {
    category: "Nägel",
    items: [
      { id: "manikuere-klassisch",  name: "Maniküre Klassisch",   price: "35 €",      duration: "45 Min",  desc: "Pflege, Form & Lack" },
      { id: "gel-manikuere",        name: "Gel-Maniküre",         price: "48 €",      duration: "60 Min",  desc: "Langanhaltend & strapazierfähig" },
      { id: "naildesign-nailart",   name: "Naildesign / Nailart", price: "68 €",      duration: "90 Min",  desc: "Kreative Designs & Nail Art" },
      { id: "auffullen-gel",        name: "Auffüllen Gel",        price: "42 €",      duration: "60 Min",  desc: "Auffüllen bestehender Gelnägel" },
      { id: "french-nails",         name: "French Nails",         price: "55 €",      duration: "75 Min",  desc: "Der Klassiker — zeitlos & elegant" },
      { id: "babyboomer",           name: "Babyboomer",           price: "58 €",      duration: "75 Min",  desc: "Natürlicher Ombré-Look" },
      { id: "nagelverlangerung",    name: "Nagelverlängerung",    price: "75 €",      duration: "120 Min", desc: "Verlängerung & Modellage" },
      { id: "entfernung",           name: "Entfernung",           price: "20 €",      duration: "30 Min",  desc: "Schonende Gel- oder Acrylentfernung" },
      { id: "beratung",             name: "Beratung",             price: "Kostenlos", duration: "15 Min",  desc: "Persönliche Beratung vorab" },
    ]
  },
];

export default function LeistungenPage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-4xl mx-auto py-24 px-12">
        <div className="text-center mb-24">
          <h1 className="text-5xl md:text-6xl font-serif mb-6 italic">Leistungen & Preise</h1>
          <p className="text-brand-gray font-light">Transparente Preise für Ihre Schönheit.</p>
        </div>

        <div className="space-y-24">
          {SERVICES.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-[11px] uppercase tracking-[0.4em] font-bold text-zinc-300 mb-12 border-b border-brand-border pb-4">
                {cat.category}
              </h2>
              <div className="space-y-12">
                {cat.items.map((item) => (
                  <div key={item.name} className="flex flex-col md:flex-row justify-between items-center gap-6 py-6 border-b border-[#F5F5F5] last:border-0">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-4 mb-1">
                        <h3 className="text-xl font-serif">{item.name}</h3>
                        <span className="font-serif italic text-lg text-brand-ink">{item.price}</span>
                      </div>
                      <p className="text-sm text-zinc-500 font-light">{item.desc}</p>
                      <span className="text-[10px] uppercase tracking-widest text-[#CCC] mt-1 inline-block">{item.duration}</span>
                    </div>
                    <Link
                      href={`/booking?service=${item.id}`}
                      className="shrink-0 text-[10px] uppercase tracking-widest font-bold border border-brand-ink px-6 py-3 hover:bg-brand-ink hover:text-white transition-all rounded-lg whitespace-nowrap"
                    >
                      Buchen →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 p-8 bg-brand-bg sleek-border text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#999]">
            * Preise können je nach Aufwand und Designwünschen variieren.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
