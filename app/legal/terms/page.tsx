import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';

export default function AGBPage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <article className="max-w-3xl mx-auto py-24 px-6 font-light leading-relaxed">
        <h1 className="text-4xl font-serif mb-12">Allgemeine Geschäftsbedingungen (AGB)</h1>
        
        <section className="space-y-8 text-sm text-zinc-600">
          <div>
            <h2 className="font-bold text-zinc-900 uppercase tracking-widest text-[10px] mb-2">1. Geltungsbereich</h2>
            <p>Diese AGB gelten für alle Dienstleistungen von Studio Cherry.</p>
          </div>

          <div>
            <h2 className="font-bold text-zinc-900 uppercase tracking-widest text-[10px] mb-2">2. Terminreservierung & Stornierung</h2>
            <p>Termine können bis zu 24 Stunden vor dem Termin kostenfrei storniert oder verschoben werden. Bei kurzfristigeren Absagen oder Nichterscheinen behalten wir uns vor, eine Ausfallgebühr in Höhe von 50% des Behandlungspreises in Rechnung zu stellen.</p>
          </div>

          <div>
            <h2 className="font-bold text-zinc-900 uppercase tracking-widest text-[10px] mb-2">3. Preise & Zahlung</h2>
            <p>Es gelten die Preise zum Zeitpunkt der Buchung. Die Zahlung erfolgt vor Ort in Bar oder per EC-Karte.</p>
          </div>
          
          <p className="italic text-zinc-400">This is a placeholder for your business terms. Please consult with a legal professional.</p>
        </section>
      </article>
      <Footer />
    </main>
  );
}
