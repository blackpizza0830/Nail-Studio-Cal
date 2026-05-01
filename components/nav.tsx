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
          {[
            { href: '/#leistungen', label: 'Leistungen' },
            { href: '/#ueber-uns', label: 'Über Uns' },
            { href: '/#kontakt', label: 'Kontakt' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative group py-2 hover:text-brand-ink transition-colors duration-300"
            >
              {item.label}
              <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-brand-ink transition-all duration-500 ease-out group-hover:w-full" />
            </Link>
          ))}
          <Link
            href="/booking"
            className="relative overflow-hidden inline-flex items-center justify-center px-6 py-2.5 border border-brand-ink text-brand-ink group transition-colors duration-500 hover:text-white"
          >
            <span className="relative z-10">Buchen</span>
            <span
              aria-hidden
              className="absolute inset-0 bg-brand-ink scale-x-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:scale-x-100"
            />
          </Link>
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
