import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';

export default function ImpressumPage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <article className="max-w-3xl mx-auto py-24 px-6 font-light leading-relaxed">
        <h1 className="text-4xl font-serif mb-12">Impressum</h1>
        
        <section className="space-y-8 text-sm text-zinc-600">
          <div>
            <h2 className="font-bold text-zinc-900 uppercase tracking-widest text-[10px] mb-2">Angaben gemäß § 5 TMG</h2>
            <p>Studio Cherry</p>
            <p>Elena M.</p>
            <p>Münzgasse 2</p>
            <p>01067 Dresden</p>
          </div>

          <div>
            <h2 className="font-bold text-zinc-900 uppercase tracking-widest text-[10px] mb-2">Kontakt</h2>
            <p>Telefon: +49 123 456789</p>
            <p>E-Mail: hello@studio-cherry.de</p>
          </div>

          <div>
            <h2 className="font-bold text-zinc-900 uppercase tracking-widest text-[10px] mb-2">Steuer-ID</h2>
            <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: DE 987 654 321</p>
          </div>

          <div>
            <h2 className="font-bold text-zinc-900 uppercase tracking-widest text-[10px] mb-2">EU-Streitschlichtung</h2>
            <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/.</p>
          </div>
        </section>
      </article>
      <Footer />
    </main>
  );
}
