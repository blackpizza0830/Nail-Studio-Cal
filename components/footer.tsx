import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="px-12 py-10 border-t border-brand-border bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] text-[#999] uppercase tracking-[0.2em]">
        <div>
          © {currentYear} Studio Cherry — Professional Nail Care
        </div>
        
        <div className="flex gap-8 items-center">
          <Link href="/admin" className="opacity-0 hover:opacity-100 transition-opacity text-[8px] mr-4">Management</Link>
          <Link href="/legal/impressum" className="hover:text-black transition-colors">Impressum</Link>
          <Link href="/legal/privacy" className="hover:text-black transition-colors">Datenschutz</Link>
          <Link href="/legal/terms" className="hover:text-black transition-colors">AGB</Link>
        </div>
      </div>
    </footer>
  );
}
