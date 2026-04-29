'use client';

import { motion } from 'motion/react';
import Image from 'next/image';

const IMAGES = [
  { src: "https://picsum.photos/seed/insta1/800/800", alt: "Nail aesthetic 1" },
  { src: "https://picsum.photos/seed/insta2/800/800", alt: "Nail aesthetic 2" },
  { src: "https://picsum.photos/seed/insta3/800/800", alt: "Nail aesthetic 3" },
  { src: "https://picsum.photos/seed/insta4/800/800", alt: "Nail aesthetic 4" },
  { src: "https://picsum.photos/seed/insta5/800/800", alt: "Nail aesthetic 5" },
  { src: "https://picsum.photos/seed/insta6/800/800", alt: "Nail aesthetic 6" },
];

export function Gallery() {
  return (
    <section id="gallery" className="py-24 md:py-32 border-t border-brand-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 sm:mb-16 gap-4">
        <h2 className="text-4xl md:text-5xl font-serif italic font-light tracking-tight">Aus dem Studio</h2>
        <a 
          href="https://instagram.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] uppercase tracking-[0.3em] text-brand-gray hover:text-brand-ink transition-colors border-b border-zinc-200 pb-1"
        >
          @Studio_Cherry
        </a>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
        {IMAGES.map((img, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: (idx % 3) * 0.1 }}
            className="aspect-square relative overflow-hidden bg-zinc-50 group border border-zinc-100"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            {/* Instagram Hover Effect */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
               <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-white text-[10px] uppercase tracking-widest font-bold drop-shadow-sm">View on IG</span>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
