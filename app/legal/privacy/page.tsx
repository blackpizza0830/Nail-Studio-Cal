import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <article className="max-w-3xl mx-auto py-24 px-6 font-light leading-relaxed">
        <h1 className="text-4xl font-serif mb-12">Datenschutzerklärung</h1>
        
        <section className="space-y-8 text-sm text-zinc-600">
          <div>
            <h2 className="font-bold text-zinc-900 uppercase tracking-widest text-[10px] mb-2">1. Datenschutz auf einen Blick</h2>
            <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.</p>
          </div>

          <div>
            <h2 className="font-bold text-zinc-900 uppercase tracking-widest text-[10px] mb-2">2. Datenerfassung auf dieser Website</h2>
            <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.</p>
          </div>

          <div>
            <h2 className="font-bold text-zinc-900 uppercase tracking-widest text-[10px] mb-2">3. Ihre Rechte</h2>
            <p>Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten.</p>
          </div>
          
          <p className="italic text-zinc-400">This is a shortened placeholder for the GDPR policy. Please replace with your full legal text.</p>
        </section>
      </article>
      <Footer />
    </main>
  );
}
