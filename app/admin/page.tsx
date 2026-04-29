'use client';

import { useState, useMemo, useEffect } from 'react';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, where, limit, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { format, startOfToday, parseISO, isAfter, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
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
  ShieldAlert,
  Trash2,
  Plus,
  Loader2,
  ImageIcon,
  Pencil,
  X,
  Upload,
  MoreVertical,
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

type Tab = 'overview' | 'bookings' | 'customers' | 'services' | 'gallery' | 'blocking';

type CmsService = { id: string; name: string; price: string; duration: string; description?: string; category?: string };
type GalleryItem = { id: string; url: string; alt: string };

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
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form for blocking
  const [blockForm, setBlockForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), time: '', note: '' });
  const [isBlockingLoading, setIsBlockingLoading] = useState(false);

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

  useEffect(() => {
    const qBlocks = query(collection(db, 'blocked_times'), orderBy('date', 'asc'));
    const unsubscribeBlocks = onSnapshot(qBlocks, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlockedTimes(data);
    });
    return () => unsubscribeBlocks();
  }, []);

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBlockingLoading(true);
    try {
      await addDoc(collection(db, 'blocked_times'), {
        date: blockForm.date,
        time: blockForm.time || null, // Empty string means full day
        note: blockForm.note,
        createdAt: serverTimestamp()
      });
      setBlockForm({ ...blockForm, time: '', note: '' });
    } catch (error) {
      console.error(error);
      alert("Error blocking time");
    } finally {
      setIsBlockingLoading(false);
    }
  };

  const deleteBlock = async (id: string) => {
    if (!confirm("Diesen Block wirklich löschen?")) return;
    try {
      await deleteDoc(doc(db, 'blocked_times', id));
    } catch (error) {
      console.error(error);
    }
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
            { key: 'blocking', label: 'Sperrzeiten', icon: ShieldAlert },
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
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-serif italic">Kundenverwaltung</h2>
                  <button className="minimal-button py-2 px-6 text-[10px]">Export (CSV)</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Distinct Customers */}
                  {Array.from(new Set(bookings.map(b => b.customerEmail))).map((email, idx) => {
                    const latestBooking = bookings.find(b => b.customerEmail === email);
                    return (
                      <div key={idx} className="p-6 bg-white border border-[#F0F0F0] rounded-lg shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center font-bold text-brand-ink text-xs uppercase">
                            {latestBooking?.customerName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{latestBooking?.customerName}</p>
                            <p className="text-[10px] text-[#BBB]">{email}</p>
                          </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-[#F9F9F9]">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-[#999] uppercase tracking-widest">Letzter Besuch</span>
                            <span className="font-bold">{latestBooking?.date}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-[#999] uppercase tracking-widest">Bevorzugt</span>
                            <span className="font-bold text-brand-ink">{latestBooking?.serviceName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {bookings.length === 0 && (
                     <div className="col-span-full py-20 text-center text-[#CCC] italic">Noch keine Kundendaten vorhanden.</div>
                  )}
                </div>
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

            {activeTab === 'blocking' && (
              <motion.div
                key="blocking"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-12"
              >
                <div className="lg:col-span-1 space-y-8">
                  <h2 className="text-2xl font-serif italic">Zeitraum sperren</h2>
                  <form onSubmit={handleAddBlock} className="space-y-6 p-8 bg-white border border-[#F0F0F0] rounded-lg shadow-sm">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold">Datum</label>
                      <input 
                        type="date"
                        required
                        value={blockForm.date}
                        onChange={e => setBlockForm({ ...blockForm, date: e.target.value })}
                        className="w-full sleek-border p-4 text-xs font-light focus:outline-none focus:border-brand-ink"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold">Uhrzeit (Optional)</label>
                      <select 
                        value={blockForm.time}
                        onChange={e => setBlockForm({ ...blockForm, time: e.target.value })}
                        className="w-full sleek-border p-4 text-xs font-light focus:outline-none focus:border-brand-ink bg-white uppercase tracking-widest"
                      >
                        <option value="">Ganzer Tag</option>
                        {['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'].map(t => (
                          <option key={t} value={t}>{t} Uhr</option>
                        ))}
                      </select>
                      <p className="text-[9px] text-[#BBB] italic mt-1">* Leer lassen für ganztägige Sperrung.</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase tracking-widest font-bold">Notiz</label>
                       <input 
                        type="text"
                        placeholder="Grund (z.B. Pause, Urlaub)"
                        value={blockForm.note}
                        onChange={e => setBlockForm({ ...blockForm, note: e.target.value })}
                        className="w-full sleek-border p-4 text-xs font-light focus:outline-none focus:border-brand-ink"
                      />
                    </div>
                    <button 
                      disabled={isBlockingLoading}
                      className="w-full py-4 bg-brand-ink text-white text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
                    >
                      {isBlockingLoading ? <Loader2 className="animate-spin" size={14} /> : <><Plus size={14} /> Sperren 확인</>}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <h2 className="text-2xl font-serif italic">Aktive Sperrzeiten</h2>
                  <div className="bg-white border border-[#F0F0F0] rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#F9F9F9] border-b border-[#F0F0F0] text-[9px] uppercase tracking-[0.2em] font-bold text-[#999]">
                          <th className="px-8 py-5">Datum</th>
                          <th className="px-8 py-5">Zeit / Umfang</th>
                          <th className="px-8 py-5">Notiz</th>
                          <th className="px-8 py-5 text-right">Aktion</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-[#F0F0F0]">
                        {blockedTimes.length === 0 ? (
                          <tr><td colSpan={4} className="py-20 text-center text-[#CCC] italic">Keine Sperrzeiten definiert.</td></tr>
                        ) : (
                          blockedTimes.map(block => (
                            <tr key={block.id} className="hover:bg-[#FDFDFD] transition-colors group">
                               <td className="px-8 py-6 font-bold">{block.date}</td>
                               <td className="px-8 py-6">
                                 {block.time ? (
                                   <span className="px-2 py-1 bg-brand-bg text-brand-ink rounded text-[9px] font-bold">{block.time} Uhr</span>
                                 ) : (
                                   <span className="px-2 py-1 bg-brand-ink text-white rounded text-[9px] font-bold uppercase tracking-widest">Ganzer Tag</span>
                                 )}
                               </td>
                               <td className="px-8 py-6 text-[#999]">{block.note || '-'}</td>
                               <td className="px-8 py-6 text-right">
                                 <button 
                                  onClick={() => deleteBlock(block.id)}
                                  className="p-2 text-[#CCC] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                 >
                                   <Trash2 size={16} />
                                 </button>
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
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </main>
  );
}
