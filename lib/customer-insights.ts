import { format, parseISO, differenceInDays } from 'date-fns';

export type BookingLite = {
  id: string;
  date: string;
  time: string;
  status: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  serviceName: string;
  price?: string | number;
};

export type CmsServiceLite = { name: string; price: string };

/** Digits only for WhatsApp wa.me */
export function whatsappHref(phone: string | undefined | null): string | null {
  if (!phone?.trim()) return null;
  let d = phone.replace(/\D/g, '');
  if (d.length < 8) return null;
  if (d.startsWith('0') && d.length >= 10) d = '49' + d.slice(1);
  return `https://wa.me/${d}`;
}

function parseEuro(priceStr: string): number {
  const n = parseFloat(String(priceStr).replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function estimateBookingEuro(b: BookingLite, cms: CmsServiceLite[]): number {
  if (b.price !== undefined && b.price !== '') {
    const p = typeof b.price === 'number' ? b.price : parseEuro(String(b.price));
    if (p > 0) return p;
  }
  const title = (b.serviceName || '').toLowerCase();
  for (const s of cms) {
    const n = s.name.toLowerCase();
    if (title.includes(n) || n.includes(title.slice(0, Math.min(12, title.length)))) {
      const e = parseEuro(s.price);
      if (e > 0) return e;
    }
  }
  if (/kostenlos|free|beratung/i.test(b.serviceName)) return 0;
  return 50;
}

export function bookingsForEmail(bookings: BookingLite[], email: string): BookingLite[] {
  const e = email.toLowerCase();
  return bookings.filter((b) => (b.customerEmail || '').toLowerCase() === e);
}

export function sortBookingsChrono(bookings: BookingLite[]): BookingLite[] {
  return [...bookings].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.time || '').localeCompare(b.time || '');
  });
}

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export function lastPastVisit(bookings: BookingLite[]): BookingLite | null {
  const day = todayStr();
  const past = sortBookingsChrono(bookings).filter(
    (b) => b.status === 'confirmed' && b.date < day
  );
  return past.length ? past[past.length - 1]! : null;
}

/** Earliest future confirmed booking */
export function nextAppointment(bookings: BookingLite[]): BookingLite | null {
  const day = todayStr();
  const upcoming = sortBookingsChrono(bookings).filter(
    (b) => b.status === 'confirmed' && b.date >= day
  );
  return upcoming.length ? upcoming[0]! : null;
}

export function visitRhythmWeeks(bookings: BookingLite[]): string | null {
  const confirmed = sortBookingsChrono(bookings).filter((b) => b.status === 'confirmed');
  if (confirmed.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < confirmed.length; i++) {
    const a = parseISO(confirmed[i - 1]!.date);
    const b = parseISO(confirmed[i]!.date);
    gaps.push(differenceInDays(b, a));
  }
  const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  if (!Number.isFinite(avg) || avg <= 0) return null;
  const weeks = Math.round(avg / 7);
  if (weeks < 1) return '~1 Woche';
  return `~${weeks} Wochen`;
}

export function preferredServiceLabel(bookings: BookingLite[]): string {
  const counts = new Map<string, number>();
  for (const b of bookings) {
    if (b.status !== 'confirmed' || !b.serviceName) continue;
    const key = b.serviceName.trim();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let best = '';
  let n = 0;
  for (const [k, v] of counts) {
    if (v > n) {
      n = v;
      best = k;
    }
  }
  return best || '—';
}

export function totalVisitsAndRevenue(
  bookings: BookingLite[],
  cms: CmsServiceLite[]
): { visits: number; euros: number } {
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const euros = confirmed.reduce((s, b) => s + estimateBookingEuro(b, cms), 0);
  return { visits: confirmed.length, euros };
}

export function isVipHint(visitCount: number, points: number, vipFlag?: boolean): boolean {
  if (vipFlag) return true;
  if (visitCount >= 10) return true;
  if (points >= 100) return true;
  return false;
}
