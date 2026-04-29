'use client';

import { useState, useMemo, useEffect } from 'react';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { format, startOfToday, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search,
  LayoutDashboard,
  UserCheck,
  Scissors,
  Trash2,
  Plus,
  Loader2,
  ImageIcon,
  Pencil,
  X,
  Upload,
  MoreVertical,
  Crown,
  MessageCircle,
  AlertTriangle,
  StickyNote,
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import {
  type BookingLite,
  bookingsForEmail,
  lastPastVisit,
  nextAppointment,
  visitRhythmWeeks,
  preferredServiceLabel,
  totalVisitsAndRevenue,
  whatsappHref,
  isVipHint,
  sortBookingsChrono,
} from '@/lib/customer-insights';

type Tab = 'overview' | 'bookings' | 'customers' | 'services' | 'gallery';

type CmsService = { id: string; name: string; price: string; duration: string; description?: string; category?: string };
type GalleryItem = { id: string; url: string; alt: string };

const CAL_PUBLIC_BOOKING = 'https://cal.com/hyeonjin-sun-park-vocrbh/30min';

type CustomerDb = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  points?: number;
  visitCount?: number;
  lastVisit?: unknown;
  allergyNote?: string;
  memo?: string;
  photoUrl?: string;
  designThumbUrls?: unknown;
  vip?: boolean;
};

type MergedCustomerRow = {
  doc: CustomerDb | null;
  email: string;
  name: string;
  phone: string;
  bookings: BookingLite[];
};

function formatFirestoreDate(v: unknown): string {
  if (v == null) return '—';
  if (v instanceof Date) return format(v, 'yyyy-MM-dd');
  if (typeof v === 'object' && v !== null && 'seconds' in v && typeof (v as { seconds: number }).seconds === 'number') {
    return format(new Date((v as { seconds: number }).seconds * 1000), 'yyyy-MM-dd');
  }
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    try {
      return format((v as { toDate: () => Date }).toDate(), 'yyyy-MM-dd');
    } catch {
      return '—';
    }
  }
  return '—';
}

function parseDesignThumbs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === 'string' && u.startsWith('http'));
}

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthed(!!user);
      setAuthChecked(true);
      if (!user) router.replace('/admin/login');
    });
    return () => unsub();
  }, [router]);

  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-ink border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthed) return null;

  return <AdminDashboard />;
}

function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Services CMS
  const [cmsServices, setCmsServices] = useState<CmsService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingService, setEditingService] = useState<CmsService | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', duration: '', description: '', category: 'Nägel' });
  const [showServiceForm, setShowServiceForm] = useState(false);

  // Gallery CMS
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [galleryAlt, setGalleryAlt] = useState('');

  // Customers CRM (Firestore + merged bookings)
  const [customerDocs, setCustomerDocs] = useState<CustomerDb[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [editCustomer, setEditCustomer] = useState<CustomerDb | null>(null);
  const [customerEditForm, setCustomerEditForm] = useState({
    allergyNote: '',
    memo: '',
    photoUrl: '',
    designThumbLines: '',
    vip: false,
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        setCustomerDocs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CustomerDb)));
        setCustomersLoading(false);
      },
      (e) => {
        console.error('customers snapshot:', e);
        setCustomersLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => setCmsServices((d.services || []) as CmsService[]))
      .catch(() => {});
  }, []);

  const openCustomerEdit = (c: CustomerDb | null) => {
    if (!c) {
      alert('Kein Kundenprofil in der Datenbank. Erscheint automatisch nach der nächsten Cal.com-Buchung.');
      return;
    }
    setEditCustomer(c);
    const thumbs = parseDesignThumbs(c.designThumbUrls);
    setCustomerEditForm({
      allergyNote: c.allergyNote || '',
      memo: c.memo || '',
      photoUrl: c.photoUrl || '',
      designThumbLines: thumbs.join('\n'),
      vip: !!c.vip,
    });
  };

  const saveCustomerEdit = async () => {
    if (!editCustomer) return;
    setSavingCustomer(true);
    try {
      const designThumbUrls = customerEditForm.designThumbLines
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.startsWith('http'))
        .slice(0, 4);
      await updateDoc(doc(db, 'customers', editCustomer.id), {
        allergyNote: customerEditForm.allergyNote.trim() || '',
        memo: customerEditForm.memo.trim() || '',
        photoUrl: customerEditForm.photoUrl.trim() || '',
        designThumbUrls,
        vip: customerEditForm.vip,
      });
      setEditCustomer(null);
    } catch (e) {
      console.error(e);
      alert('Speichern fehlgeschlagen.');
    } finally {
      setSavingCustomer(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{ id: string; date: string; time: string; status: string; customerName: string; customerEmail: string; customerPhone: string; serviceName: string; note?: string; [key: string]: unknown }>;
      const sortedData = data.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.time.localeCompare(b.time);
      });
      setBookings(sortedData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtered bookings based on search query
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter(b =>
      b.customerName?.toLowerCase().includes(q) ||
      b.customerEmail?.toLowerCase().includes(q) ||
      b.serviceName?.toLowerCase().includes(q) ||
      b.date?.includes(q)
    );
  }, [bookings, searchQuery]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const today = format(startOfToday(), 'yyyy-MM-dd');
    const todayBookings = bookings.filter(b => b.date === today && b.status === 'confirmed');
    
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const weeklyBookings = bookings.filter(b => {
      const bDate = parseISO(b.date);
      return isWithinInterval(bDate, { start: weekStart, end: weekEnd }) && b.status === 'confirmed';
    });

    const activeCustomers = new Set(bookings.map(b => b.customerEmail)).size;
    
    // Revenue simulation (based on services)
    const revenue = weeklyBookings.reduce((acc, curr) => acc + (curr.price ? parseInt(curr.price) : 50), 0);

    return {
      todayCount: todayBookings.length,
      weeklyCount: weeklyBookings.length,
      customerCount: activeCustomers,
      estWeeklyRevenue: revenue
    };
  }, [bookings]);

  const mergedCustomers = useMemo(() => {
    const norm = (e: string) => e.trim().toLowerCase();
    const fromDb = new Map<string, CustomerDb>();
    for (const c of customerDocs) {
      if (c.email) fromDb.set(norm(c.email), c);
    }
    const emailSet = new Set<string>();
    fromDb.forEach((_, e) => emailSet.add(e));
    for (const b of bookings) {
      if (b.customerEmail) emailSet.add(norm(b.customerEmail));
    }
    const rows: MergedCustomerRow[] = [...emailSet].map((email) => {
      const docRow = fromDb.get(email) ?? null;
      const bs = bookingsForEmail(bookings as unknown as BookingLite[], email);
      const name = docRow?.name || bs[bs.length - 1]?.customerName || email;
      const phone =
        docRow?.phone || [...bs].reverse().find((x) => x.customerPhone)?.customerPhone || '';
      return { doc: docRow, email, name, phone, bookings: bs };
    });
    rows.sort((a, b) => {
      const na = nextAppointment(a.bookings);
      const nb = nextAppointment(b.bookings);
      if (na && !nb) return -1;
      if (!na && nb) return 1;
      if (na && nb && na.date !== nb.date) return na.date.localeCompare(nb.date);
      const la = lastPastVisit(a.bookings)?.date || '';
      const lb = lastPastVisit(b.bookings)?.date || '';
      return lb.localeCompare(la);
    });
    return rows;
  }, [customerDocs, bookings]);

  const filteredMergedCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return mergedCustomers;
    return mergedCustomers.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    );
  }, [mergedCustomers, customerSearch]);

  const cmsForPricing = useMemo(
    () => cmsServices.map((s) => ({ name: s.name, price: s.price })),
    [cmsServices]
  );

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
    } catch (e) {
      console.error(e);
    }
  };

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setCmsServices(data.services || []);
    } catch (e) { console.error(e); }
    finally { setServicesLoading(false); }
  };

  const loadGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      setGalleryItems(data.items || []);
    } catch (e) { console.error(e); }
    finally { setGalleryLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'services') loadServices();
    if (activeTab === 'gallery') loadGallery();
  }, [activeTab]);

  const handleSaveService = async () => {
    const isEdit = !!editingService;
    const url = isEdit ? `/api/services/${editingService.id}` : '/api/services';
    const method = isEdit ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(serviceForm) });
    setShowServiceForm(false);
    setEditingService(null);
    setServiceForm({ name: '', price: '', duration: '', description: '', category: 'Nägel' });
    loadServices();
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Diese Leistung wirklich löschen?')) return;
    await fetch(`/api/services/${id}`, { method: 'DELETE' });
    loadServices();
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on('state_changed',
      (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => { console.error(err); setUploadProgress(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, alt: galleryAlt }),
        });
        setUploadProgress(null);
        setGalleryAlt('');
        e.target.value = '';
        loadGallery();
      }
    );
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Dieses Bild wirklich löschen?')) return;
    await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
    loadGallery();
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A]">
      <Nav />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-serif italic mb-2">Studio Management</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#999] font-bold">
              Willkommen zurück, 전용 관리자 모드
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => signOut(auth).then(() => router.push('/admin/login'))}
              className="text-[10px] uppercase tracking-widest font-bold text-[#CCC] hover:text-red-400 transition-colors"
            >
              Abmelden
            </button>
            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center border border-brand-border">
              <Users size={16} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-12 overflow-x-auto pb-2 scrollbar-none border-b border-[#F0F0F0]">
          {([
            { key: 'overview', label: 'Übersicht', icon: LayoutDashboard },
            { key: 'bookings', label: 'Termine', icon: Calendar },
            { key: 'customers', label: 'Kunden', icon: UserCheck },
            { key: 'services', label: 'Leistungen', icon: Scissors },
            { key: 'gallery', label: 'Galerie', icon: ImageIcon },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-4 px-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === key ? 'text-brand-ink border-b-2 border-brand-ink' : 'text-[#BBB] hover:text-[#888]'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { label: 'Heute', value: metrics.todayCount, icon: Clock, color: 'text-brand-ink' },
                    { label: 'Woche', value: metrics.weeklyCount, icon: Calendar, color: 'text-blue-500' },
                    { label: 'Kunden', value: metrics.customerCount, icon: Users, color: 'text-purple-500' },
                    { label: 'Umsatz', value: `${metrics.estWeeklyRevenue} €`, icon: TrendingUp, color: 'text-green-500' },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 md:p-8 bg-white border border-[#F0F0F0] rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-4 md:mb-6">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-[#999]">{stat.label}</span>
                        <stat.icon size={14} className={stat.color} />
                      </div>
                      <p className="text-2xl md:text-3xl font-serif">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Dashboard Secondary Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Next Appointments */}
                  <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-sm uppercase tracking-widest font-bold">Nächste Termine</h2>
                    {bookings.filter(b => b.status === 'confirmed').slice(0, 5).map(b => (
                      <div key={b.id} className="p-6 bg-white border border-[#F0F0F0] rounded-lg flex justify-between items-center group hover:border-brand-ink transition-all">
                        <div className="flex items-center gap-6">
                          <div className="text-center min-w-[60px]">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-[#999]">{format(parseISO(b.date), 'MMM')}</p>
                            <p className="text-xl font-serif">{format(parseISO(b.date), 'dd')}</p>
                          </div>
                          <div className="h-10 w-px bg-[#F0F0F0]" />
                          <div>
                            <p className="font-medium text-sm">{b.customerName}</p>
                            <p className="text-[10px] text-[#999] uppercase tracking-widest font-bold">{b.serviceName} • {b.time} Uhr</p>
                          </div>
                        </div>
                        <CheckCircle2 size={16} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>

                  {/* Quick Activity */}
                  <div className="space-y-6">
                    <h2 className="text-sm uppercase tracking-widest font-bold">Aktivität</h2>
                    <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[#F0F0F0]">
                       {bookings.slice(0, 4).map(b => (
                         <div key={b.id} className="relative">
                            <div className="absolute -left-[25px] w-2 h-2 rounded-full bg-brand-ink ring-4 ring-white" />
                            <p className="text-[10px] font-bold text-[#999] mb-1">{format(parseISO(b.date), 'd. MMM')}</p>
                            <p className="text-xs">Neue Buchung von <span className="font-bold">{b.customerName}</span> für {b.serviceName}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <h2 className="text-2xl font-serif italic">Buchungsübersicht</h2>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CCC]" size={14} />
                    <input 
                      type="text" 
                      placeholder="Kunde oder Service suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-[#EAEAEA] py-3 pl-12 pr-4 text-xs rounded-full focus:outline-none focus:border-brand-ink transition-all"
                    />
                  </div>
                </div>

                <div className="bg-white border border-[#F0F0F0] rounded-lg overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#F9F9F9] border-b border-[#F0F0F0] text-[9px] uppercase tracking-[0.2em] font-bold text-[#999]">
                          <th className="px-8 py-5">Datum / Zeit</th>
                          <th className="px-8 py-5">Kunde</th>
                          <th className="px-8 py-5">Leistung</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5 text-right">Aktion</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-[#F0F0F0]">
                        {loading ? (
                          <tr><td colSpan={5} className="py-20 text-center text-[#CCC] italic">Daten werden geladen...</td></tr>
                        ) : filteredBookings.length === 0 ? (
                          <tr><td colSpan={5} className="py-20 text-center text-[#CCC] italic">Keine Einträge gefunden</td></tr>
                        ) : (
                          filteredBookings.map(b => (
                            <tr key={b.id} className="hover:bg-[#FDFDFD] transition-colors group">
                              <td className="px-8 py-6">
                                <span className="font-bold">{format(parseISO(b.date), 'dd.MM.yyyy')}</span>
                                <span className="block text-[10px] text-[#BBB] mt-1">{b.time} Uhr</span>
                              </td>
                              <td className="px-8 py-6">
                                <p className="font-medium">{b.customerName}</p>
                                <p className="text-[10px] text-[#BBB] mt-1">{b.customerEmail}</p>
                              </td>
                              <td className="px-8 py-6">
                                <span className="px-2 py-1 bg-brand-bg text-brand-ink rounded text-[9px] font-bold uppercase">{b.serviceName}</span>
                              </td>
                              <td className="px-8 py-6">
                                <div className={`flex items-center gap-2 ${
                                  b.status === 'confirmed' ? 'text-green-500' : 'text-red-400'
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                    b.status === 'confirmed' ? 'bg-green-500' : 'bg-red-400'
                                  }`} />
                                  <span className="uppercase tracking-widest text-[9px] font-bold">{b.status}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {b.status === 'confirmed' && (
                                    <button 
                                      onClick={() => updateStatus(b.id, 'cancelled')}
                                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                      title="Stornieren"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  )}
                                  <button className="p-2 text-[#CCC] hover:text-[#888] transition-colors">
                                    <MoreVertical size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <motion.div
                key="customers"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-2">
                  <div>
                    <h2 className="text-2xl font-serif italic mb-2">Kundenverwaltung</h2>
                    <p className="text-[11px] text-[#999] max-w-xl leading-relaxed">
                      Profildaten aus Firebase; Termine aus Buchungen. Sperrzeiten & Verfügbarkeit nur in Cal.com.
                      Umsatz-Schätzung aus Leistungspreisen (Cal-Titel wird mit CMS gematcht).
                    </p>
                  </div>
                  <div className="relative w-full lg:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CCC]" size={14} />
                    <input
                      type="text"
                      placeholder="Name, E-Mail, Telefon…"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full bg-white border border-[#EAEAEA] py-3 pl-12 pr-4 text-xs rounded-full focus:outline-none focus:border-brand-ink transition-all"
                    />
                  </div>
                </div>

                {customersLoading || loading ? (
                  <div className="py-24 flex justify-center">
                    <Loader2 className="animate-spin text-[#CCC]" size={28} />
                  </div>
                ) : filteredMergedCustomers.length === 0 ? (
                  <div className="py-24 text-center text-[#CCC] italic">Keine Kundendaten.</div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {filteredMergedCustomers.map((row) => {
                      const d = row.doc;
                      const { visits, euros } = totalVisitsAndRevenue(row.bookings, cmsForPricing);
                      const last = lastPastVisit(row.bookings);
                      const next = nextAppointment(row.bookings);
                      const rhythm = visitRhythmWeeks(row.bookings);
                      const preferred = preferredServiceLabel(row.bookings);
                      const wa = whatsappHref(row.phone);
                      const visitCount = d?.visitCount ?? visits;
                      const points = d?.points ?? 0;
                      const vip = isVipHint(visitCount, points, d?.vip);
                      const hist = sortBookingsChrono(row.bookings)
                        .filter((b) => b.status === 'confirmed')
                        .slice(-4)
                        .reverse();
                      const thumbs = parseDesignThumbs(d?.designThumbUrls);
                      const allergy = d?.allergyNote?.trim();
                      const memo = d?.memo?.trim();
                      const lastDisplay = last
                        ? `${last.date} · ${last.time}`
                        : formatFirestoreDate(d?.lastVisit);

                      return (
                        <div
                          key={row.email}
                          className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden shadow-sm flex flex-col"
                        >
                          <div className="px-6 py-5 border-b border-[#F0F0F0] flex gap-4">
                            {d?.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={d.photoUrl}
                                alt=""
                                className="w-14 h-14 rounded-full object-cover border border-[#EFEFEF] shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-brand-bg flex items-center justify-center font-serif text-lg text-brand-ink shrink-0 border border-brand-border">
                                {(row.name || row.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-sm truncate">{row.name}</p>
                                {vip && (
                                  <span className="shrink-0 inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    <Crown size={10} /> VIP
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#888] truncate mt-0.5">{row.email}</p>
                              {row.phone ? (
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                                  <span className="font-medium text-brand-ink">{row.phone}</span>
                                  {wa && (
                                    <a
                                      href={wa}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                                    >
                                      <MessageCircle size={12} /> WhatsApp
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <p className="text-[10px] text-amber-700 mt-2">Keine Telefonnummer — Cal.com Booking anpassen</p>
                              )}
                            </div>
                          </div>

                          <div className="px-6 py-4 space-y-2 text-[11px] border-b border-[#F5F5F5] bg-[#FAFAFA]/80">
                            <div className="flex justify-between gap-4">
                              <span className="text-[#999] uppercase tracking-wider font-bold shrink-0">Letzter Besuch</span>
                              <span className="font-medium text-right text-xs">{lastDisplay}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[#999] uppercase tracking-wider font-bold shrink-0">Nächster Termin</span>
                              <span className="font-medium text-right text-xs flex items-center gap-1 justify-end">
                                {next ? (
                                  <>
                                    {next.date} · {next.time}
                                    <CheckCircle2 size={12} className="text-green-600 shrink-0" />
                                  </>
                                ) : (
                                  '—'
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[#999] uppercase tracking-wider font-bold shrink-0">Besuche / Umsatz</span>
                              <span className="font-medium text-right text-xs">
                                {visits}× / ca. €{euros}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-[#999] uppercase tracking-wider font-bold shrink-0">Rhythmus</span>
                              <span className="font-medium text-right text-xs">{rhythm || '—'}</span>
                            </div>
                          </div>

                          <div className="px-6 py-4 space-y-3 text-[11px] border-b border-[#F5F5F5]">
                            <div>
                              <p className="text-[9px] uppercase tracking-widest font-bold text-[#BBB] mb-1">Bevorzugt</p>
                              <p className="text-xs text-brand-ink leading-snug">{preferred}</p>
                            </div>
                            {allergy && (
                              <div className="flex gap-2 items-start text-amber-900 bg-amber-50/80 rounded-lg px-3 py-2 border border-amber-100">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest font-bold text-amber-800 mb-0.5">Allergie / Sensibel</p>
                                  <p className="text-xs">{allergy}</p>
                                </div>
                              </div>
                            )}
                            {memo && (
                              <div>
                                <p className="text-[9px] uppercase tracking-widest font-bold text-[#BBB] mb-1">Notiz</p>
                                <p className="text-xs text-[#555] whitespace-pre-wrap">{memo}</p>
                              </div>
                            )}
                            {hist.length > 0 && (
                              <div>
                                <p className="text-[9px] uppercase tracking-widest font-bold text-[#BBB] mb-1.5">Letzte Leistungen</p>
                                <ul className="space-y-1 text-[10px] text-[#666]">
                                  {hist.map((b) => (
                                    <li key={b.id}>
                                      <span className="font-medium text-[#333]">{b.date}</span> · {b.serviceName}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="px-6 py-4 border-b border-[#F5F5F5]">
                            <p className="text-[9px] uppercase tracking-widest font-bold text-[#BBB] mb-2">Referenz (max. 4 Fotos)</p>
                            <div className="grid grid-cols-4 gap-2">
                              {[0, 1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="aspect-square rounded-lg bg-[#F4F4F4] border border-[#EBEBEB] overflow-hidden"
                                >
                                  {thumbs[i] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={thumbs[i]} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[9px] text-[#CCC] text-center px-1">
                                      —
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <p className="text-[9px] text-[#BBB] mt-2">URLs im Bearbeiten-Dialog eintragen (z. B. von Instagram oder Cloud).</p>
                          </div>

                          <div className="px-6 py-4 mt-auto flex flex-wrap gap-2">
                            <a
                              href={CAL_PUBLIC_BOOKING}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-brand-ink text-white text-[9px] uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
                            >
                              <Calendar size={14} /> Termin
                            </a>
                            {wa ? (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border border-[#E0E0E0] text-[9px] uppercase tracking-widest font-bold text-brand-ink hover:border-brand-ink transition-colors"
                              >
                                <MessageCircle size={14} /> Nachricht
                              </a>
                            ) : (
                              <span className="inline-flex items-center justify-center gap-1.5 flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border border-dashed border-[#DDD] text-[9px] text-[#BBB] text-center">
                                Kein WhatsApp
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => openCustomerEdit(d)}
                              disabled={!d}
                              className="inline-flex items-center justify-center gap-1.5 flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border border-[#E0E0E0] text-[9px] uppercase tracking-widest font-bold text-brand-ink hover:border-brand-ink transition-colors disabled:opacity-40 disabled:pointer-events-none"
                            >
                              <StickyNote size={14} /> Profil
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-serif italic">Leistungsmanagement</h2>
                  <button
                    onClick={() => { setEditingService(null); setServiceForm({ name: '', price: '', duration: '', description: '', category: 'Nägel' }); setShowServiceForm(true); }}
                    className="minimal-button py-2 px-6 text-[10px] flex items-center gap-2"
                  >
                    <Plus size={12} /> Neue Leistung
                  </button>
                </div>

                {/* Service Form */}
                {showServiceForm && (
                  <div className="p-8 bg-white border border-brand-ink rounded-lg">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-serif italic text-lg">{editingService ? 'Leistung bearbeiten' : 'Neue Leistung'}</h3>
                      <button onClick={() => setShowServiceForm(false)}><X size={16} className="text-[#999]" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Name *</label>
                        <input value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full sleek-border p-3 text-sm focus:outline-none focus:border-brand-ink" placeholder="Shellac Maniküre" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Preis *</label>
                        <input value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} className="w-full sleek-border p-3 text-sm focus:outline-none focus:border-brand-ink" placeholder="45 €" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Dauer *</label>
                        <input value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: e.target.value})} className="w-full sleek-border p-3 text-sm focus:outline-none focus:border-brand-ink" placeholder="60 Min" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Kategorie</label>
                        <select value={serviceForm.category} onChange={e => setServiceForm({...serviceForm, category: e.target.value})} className="w-full sleek-border p-3 text-sm focus:outline-none focus:border-brand-ink bg-white">
                          {['Nägel', 'Wimpern', 'Augenbrauen', 'Pflege', 'Sonstiges'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mb-6">
                      <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Beschreibung</label>
                      <input value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className="w-full sleek-border p-3 text-sm focus:outline-none focus:border-brand-ink" placeholder="Kurze Beschreibung..." />
                    </div>
                    <button onClick={handleSaveService} className="minimal-button py-3 px-8 text-[10px]">
                      {editingService ? 'Speichern' : 'Erstellen'}
                    </button>
                  </div>
                )}

                {servicesLoading ? (
                  <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#CCC]" /></div>
                ) : cmsServices.length === 0 ? (
                  <div className="py-20 text-center text-[#CCC] italic">Noch keine Leistungen. Erstellen Sie die erste.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cmsServices.map((s) => (
                      <div key={s.id} className="p-8 bg-white border border-[#F0F0F0] rounded-lg hover:border-brand-ink transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-serif mb-1">{s.name}</h3>
                            <p className="text-[10px] text-[#999] uppercase tracking-widest font-bold">{s.duration} · {s.category}</p>
                            {s.description && <p className="text-xs text-[#999] mt-2">{s.description}</p>}
                          </div>
                          <p className="text-xl font-serif text-brand-ink shrink-0 ml-4">{s.price}</p>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-[#F9F9F9]">
                          <button
                            onClick={() => { setEditingService(s); setServiceForm({ name: s.name, price: s.price, duration: s.duration, description: s.description || '', category: s.category || 'Nägel' }); setShowServiceForm(true); }}
                            className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-[#999] hover:text-brand-ink transition-colors"
                          >
                            <Pencil size={10} /> Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDeleteService(s.id)}
                            className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-[#CCC] hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={10} /> Löschen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === 'gallery' && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <h2 className="text-2xl font-serif italic">Galerie verwalten</h2>

                {/* Upload area */}
                <div className="p-8 bg-white border border-[#F0F0F0] rounded-lg">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#999] mb-6">Neues Bild hochladen</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Beschreibung (Alt-Text)</label>
                      <input
                        value={galleryAlt}
                        onChange={e => setGalleryAlt(e.target.value)}
                        className="w-full sleek-border p-3 text-sm focus:outline-none focus:border-brand-ink"
                        placeholder="z.B. Shellac Maniküre in Rosé-Gold"
                      />
                    </div>
                    <div className="shrink-0">
                      <label className="text-[10px] uppercase tracking-widest font-bold block mb-2 opacity-0">Upload</label>
                      <label className="minimal-button py-3 px-6 text-[10px] flex items-center gap-2 cursor-pointer">
                        <Upload size={12} />
                        {uploadProgress !== null ? `${uploadProgress}%` : 'Bild wählen'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={uploadProgress !== null} />
                      </label>
                    </div>
                  </div>
                  {uploadProgress !== null && (
                    <div className="mt-4 h-1 bg-zinc-100 rounded overflow-hidden">
                      <div className="h-full bg-brand-ink transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>

                {/* Gallery grid */}
                {galleryLoading ? (
                  <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#CCC]" /></div>
                ) : galleryItems.length === 0 ? (
                  <div className="py-20 text-center text-[#CCC] italic">Noch keine Bilder. Laden Sie das erste Bild hoch.</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryItems.map((item) => (
                      <div key={item.id} className="relative group aspect-square bg-zinc-50 border border-[#F0F0F0] rounded-lg overflow-hidden">
                        <Image src={item.url} alt={item.alt || 'Gallery'} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteGallery(item.id)}
                            className="bg-white text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {item.alt && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
                            <p className="text-white text-[9px] truncate">{item.alt}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {editCustomer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45"
          role="presentation"
          onClick={() => setEditCustomer(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8E8E8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[#F0F0F0] flex items-center justify-between">
              <h3 className="font-serif italic text-lg">Kundenprofil bearbeiten</h3>
              <button type="button" onClick={() => setEditCustomer(null)} className="p-1 text-[#999] hover:text-brand-ink">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm">
              <p className="text-[11px] text-[#888]">{editCustomer.email}</p>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#999]">Profilfoto (URL)</span>
                <input
                  value={customerEditForm.photoUrl}
                  onChange={(e) => setCustomerEditForm((f) => ({ ...f, photoUrl: e.target.value }))}
                  className="mt-1 w-full sleek-border p-3 text-xs"
                  placeholder="https://..."
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customerEditForm.vip}
                  onChange={(e) => setCustomerEditForm((f) => ({ ...f, vip: e.target.checked }))}
                  className="rounded border-[#CCC]"
                />
                <span className="text-[11px] font-medium">VIP markieren</span>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#999]">Allergie / sensibel</span>
                <textarea
                  value={customerEditForm.allergyNote}
                  onChange={(e) => setCustomerEditForm((f) => ({ ...f, allergyNote: e.target.value }))}
                  className="mt-1 w-full sleek-border p-3 text-xs min-h-[72px]"
                  placeholder="z. B. Aceton, bestimmte Gele…"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#999]">Notiz</span>
                <textarea
                  value={customerEditForm.memo}
                  onChange={(e) => setCustomerEditForm((f) => ({ ...f, memo: e.target.value }))}
                  className="mt-1 w-full sleek-border p-3 text-xs min-h-[88px]"
                  placeholder="Vorlieben, Stil, interne Hinweise…"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#999]">Referenz-Fotos (max. 4 URLs, eine Zeile pro Bild)</span>
                <textarea
                  value={customerEditForm.designThumbLines}
                  onChange={(e) => setCustomerEditForm((f) => ({ ...f, designThumbLines: e.target.value }))}
                  className="mt-1 w-full sleek-border p-3 text-xs min-h-[72px] font-mono"
                  placeholder={'https://…\nhttps://…'}
                />
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditCustomer(null)} className="flex-1 py-3 border border-[#E0E0E0] text-[10px] uppercase tracking-widest font-bold rounded-xl">
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={saveCustomerEdit}
                  disabled={savingCustomer}
                  className="flex-1 py-3 bg-brand-ink text-white text-[10px] uppercase tracking-widest font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  {savingCustomer ? <Loader2 className="animate-spin" size={16} /> : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
