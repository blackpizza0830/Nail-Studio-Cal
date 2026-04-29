'use client';

import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function Nav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 md:h-24 flex items-center justify-between">
        <Link href="/" className="group flex flex-col pt-2" onClick={() => setIsOpen(false)}>
          <span className="text-lg md:text-xl font-light uppercase tracking-[0.2em]">Studio Cherry</span>
          <div className="h-[1px] w-0 group-hover:w-full bg-brand-ink transition-all duration-500 mt-1" />
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10 text-[11px] uppercase tracking-widest text-brand-gray font-medium">
          <Link href="/#leistungen" className="hover:text-brand-ink transition-colors">Leistungen</Link>
          <Link href="/#ueber-uns" className="hover:text-brand-ink transition-colors">Über Uns</Link>
          <Link href="/#kontakt" className="hover:text-brand-ink transition-colors">Kontakt</Link>
          <Link href="/booking" className="text-brand-ink border-b border-brand-ink pb-1">Buchen</Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-brand-ink p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-brand-border overflow-hidden"
          >
            <div className="flex flex-col px-6 py-8 gap-6 text-[11px] uppercase tracking-widest font-bold">
              <Link href="/#leistungen" onClick={() => setIsOpen(false)}>Leistungen</Link>
              <Link href="/#ueber-uns" onClick={() => setIsOpen(false)}>Über Uns</Link>
              <Link href="/#kontakt" onClick={() => setIsOpen(false)}>Kontakt</Link>
              <Link 
                href="/booking" 
                className="bg-brand-ink text-white p-4 text-center"
                onClick={() => setIsOpen(false)}
              >
                Buchen
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
