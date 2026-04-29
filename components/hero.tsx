'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const HERO_IMAGES = [
  "https://picsum.photos/seed/nail-hero-1/1920/1080?blur=1",
  "https://picsum.photos/seed/nail-studio-2/1920/1080?grayscale",
  "https://picsum.photos/seed/minimalist-nail-3/1920/1080",
];

export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[calc(100vh-6rem)] w-full overflow-hidden flex items-center justify-center border-b border-brand-border">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={HERO_IMAGES[index]}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={HERO_IMAGES[index]}
              alt="Studio Cherry Hero"
              fill
              className="object-cover brightness-[0.85]"
              priority
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Centered Content */}
      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-6xl md:text-8xl font-serif text-white italic font-light mb-8 drop-shadow-sm tracking-tight">
            Studio Cherry
          </h1>
          <p className="text-white/80 text-xs uppercase tracking-[0.4em] font-bold mb-12">
            Kleine Kunstwerke, handgemacht in der Dresdner Altstadt.
          </p>
          <Link href="/booking" className="inline-block bg-white text-brand-ink px-12 py-5 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-brand-ink hover:text-white transition-all duration-500 sleek-border shadow-xl">
            Termin buchen
          </Link>
        </motion.div>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-4">
        {HERO_IMAGES.map((_, i) => (
          <div 
            key={i}
            className={`h-[1px] w-8 transition-colors duration-500 ${i === index ? 'bg-white' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </section>
  );
}
