import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'STUDIO BLANCO | Nail & Beauty',
  description: 'Minimalist nail and beauty studio in Dresden.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${cormorant.variable}`}>
      <body suppressHydrationWarning className="bg-white text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
