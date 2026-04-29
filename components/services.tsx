'use client';

import { motion } from 'motion/react';

const SERVICE_CATEGORIES = [
  {
    title: "Nail Care",
    items: [
      { name: "Classic Manicure", price: "35€", duration: "45 min" },
      { name: "Shellac Manicure", price: "55€", duration: "60 min" },
      { name: "Gel Extensions", price: "85€", duration: "90 min" },
      { name: "Refill Gel", price: "65€", duration: "75 min" },
    ]
  },
  {
    title: "Beauty Treatments",
    items: [
      { name: "Lash Lift", price: "60€", duration: "60 min" },
      { name: "Brow Lamination", price: "50€", duration: "45 min" },
      { name: "Waxing Package", price: "45€", duration: "40 min" },
    ]
  }
];

export function Services() {
  return (
    <section id="leistungen" className="py-24 border-t border-zinc-100">
      <div className="flex flex-col md:flex-row gap-16">
        <div className="md:w-1/3">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">Leistungen</h2>
          <p className="text-zinc-500 font-light text-sm leading-relaxed">
            Hochwertige Produkte und Liebe zum Detail. Jede Behandlung wird individuell auf Ihre Bedürfnisse abgestimmt.
          </p>
        </div>
        
        <div className="md:w-2/3 grid gap-16">
          {SERVICE_CATEGORIES.map((category, idx) => (
            <motion.div 
              key={category.title}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
            >
              <h3 className="text-xs uppercase tracking-widest font-bold mb-8 text-zinc-400 border-b border-zinc-50 pb-4">
                {category.title}
              </h3>
              <div className="space-y-8">
                {category.items.map((item) => (
                  <div key={item.name} className="service-item-card group">
                    <div>
                      <h4 className="text-sm font-medium transition-all duration-300">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-brand-gray opacity-70">
                        {item.duration} • Professional Care
                      </p>
                    </div>
                    <span className="text-sm font-serif italic text-brand-gray group-hover:text-brand-ink">
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
