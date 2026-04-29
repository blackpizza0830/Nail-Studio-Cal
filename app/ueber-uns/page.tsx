import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Nav />
      {/* Hero Part */}
      <section className="max-w-7xl mx-auto py-24 px-12 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="relative aspect-[4/5] bg-brand-bg sleek-border overflow-hidden">
          <Image
            src="https://picsum.photos/seed/elena-profile/800/1000"
            alt="Elena - Studio Owner"
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-gray mb-8 block">Gründerin</span>
          <h1 className="text-6xl font-serif italic font-light mb-12 leading-tight">Über Elena M.</h1>
          <div className="space-y-6 text-brand-gray font-light leading-relaxed text-lg">
            <p>
              Willkommen bei Studio Cherry. Mein Name ist Elena, und Schönheit ist für mich mehr als nur ein Beruf – es ist eine Leidenschaft für Präzision und Ästhetik.
            </p>
            <p>
              Nach über 10 Jahren Erfahrung in der Beauty-Branche habe ich mich entschieden, meinen Traum von einem eigenen, minimalistischen Studio in Dresden zu verwirklichen. Mein Fokus liegt auf natürlicher Eleganz und der Gesundheit Ihrer Nägel und Haut.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy Part */}
      <section className="bg-brand-bg py-24 px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-serif mb-12">Meine Philosophie</h2>
          <blockquote className="text-2xl font-serif italic text-brand-ink mb-12 leading-relaxed">
            &quot;Wahre Schönheit liegt in der Ruhe und der Aufmerksamkeit für die kleinen Details.&quot;
          </blockquote>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-brand-border">
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold mb-4">Qualität</h3>
              <p className="text-sm text-zinc-500 font-light">Nur hochwertige, vegane Produkte.</p>
            </div>
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold mb-4">Präzision</h3>
              <p className="text-sm text-zinc-500 font-light">Handwerkskunst auf höchstem Niveau.</p>
            </div>
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold mb-4">Hygiene</h3>
              <p className="text-sm text-zinc-500 font-light">Strengste Standards für Ihre Sicherheit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Interior */}
      <section className="max-w-7xl mx-auto py-24 px-12">
        <h2 className="text-center text-4xl font-serif mb-16">Das Studio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-video relative overflow-hidden sleek-border">
             <Image src="https://picsum.photos/seed/studio1/1200/800" alt="Studio Interior 1" fill className="object-cover" />
          </div>
          <div className="aspect-video relative overflow-hidden sleek-border">
             <Image src="https://picsum.photos/seed/studio2/1200/800" alt="Studio Interior 2" fill className="object-cover" />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
