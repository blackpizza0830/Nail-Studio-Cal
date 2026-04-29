'use client';

import { motion, useAnimationControls } from 'motion/react';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

const REVIEWS = [
  {
    name: "Sarah K.",
    source: "Google Review",
    text: "Das beste Studio in Dresden. Die Atmosphäre ist unglaublich beruhigend und das Ergebnis perfekt minimalistisch.",
    stars: 5
  },
  {
    name: "Emma M.",
    source: "Instagram",
    text: "Absolut verliebt in mein neues Nageldesign! Die Detailverliebtheit ist hier einfach auf einem anderen Level.",
    stars: 5
  },
  {
    name: "Julia S.",
    source: "Google Review",
    text: "Sehr professionell, hygienisch und freundlich. Ich komme seit Monaten hierher und wurde nie enttäuscht.",
    stars: 5
  },
  {
    name: "Nina T.",
    source: "Direct",
    text: "Endlich ein Studio, das echtes Handwerk versteht. Mein Shellac hält ewig und sieht bis zum Ende top aus.",
    stars: 5
  }
];

export function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 md:py-32 border-b border-brand-border bg-brand-bg/30">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#999] mb-4 block font-bold">Kundenstimmen</span>
            <h2 className="text-3xl md:text-4xl font-serif italic">Was unsere Kunden sagen</h2>
          </div>
          <div className="flex gap-2">
            {REVIEWS.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setIndex(i)}
                className={`h-1 w-8 transition-all duration-500 ${i === index ? 'bg-brand-ink' : 'bg-zinc-200'}`}
              />
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden h-[380px] md:h-[300px]">
          <div className="flex h-full">
            {REVIEWS.map((review, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 flex flex-col justify-center"
                initial={{ opacity: 0, x: 50 }}
                animate={{ 
                  opacity: i === index ? 1 : 0,
                  x: i === index ? 0 : (i < index ? -50 : 50),
                  pointerEvents: i === index ? 'auto' : 'none'
                }}
                transition={{ duration: 0.8, ease: "circOut" }}
              >
                <div className="max-w-2xl">
                  <div className="flex gap-1 mb-6">
                    {[...Array(review.stars)].map((_, s) => (
                      <Star key={s} size={14} className="fill-brand-ink text-brand-ink" />
                    ))}
                  </div>
                  <p className="text-xl md:text-3xl font-serif italic text-brand-ink leading-relaxed mb-8">
                    &quot;{review.text}&quot;
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-brand-ink">— {review.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#ccc] sm:ml-4 mt-1 sm:mt-0">{review.source}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
