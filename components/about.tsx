'use client';

import { motion } from 'motion/react';
import Image from 'next/image';

export function About() {
  return (
    <section id="ueber-uns" className="py-24 md:py-32 border-t border-brand-border">
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        <div className="w-full lg:w-1/2 aspect-[4/5] relative bg-brand-bg overflow-hidden sleek-border">
          <Image
            src="/about/studio.jpg"
            alt="Studio Cherry"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        
        <div className="w-full lg:w-1/2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-0 md:p-8"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-gray mb-6 md:mb-8 block">
              Philosophie
            </span>
            <h2 className="text-4xl md:text-6xl font-serif italic font-light mb-8 md:mb-12 leading-tight">
              Deine Zeit.<br />
              Deine Cherry.
            </h2>
            <p className="text-brand-gray text-sm md:text-base font-light leading-relaxed mb-6 md:mb-8">
              Bei Cherry nehmen wir uns Zeit – für ein Gespräch, für gesunde Nägel und für Designs, die wirklich zu dir passen. Saubere Arbeit, lang anhaltende Ergebnisse und ein offenes Ohr für deine Wünsche sind für uns selbstverständlich.
            </p>
            <p className="text-zinc-600 text-sm md:text-base font-light leading-relaxed mb-8 md:mb-12">
              Our studio in Dresden offers a quiet sanctuary for those who appreciate a clean, balanced environment. We exclusively use high-end, vegan products to ensure the best results for your skin and nails.
            </p>
            <div className="pt-8 md:pt-12 border-t border-zinc-100">
              <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold">Studio Founder</span>
              <p className="font-serif text-lg md:text-xl italic mt-1 text-zinc-400">Elena M.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
