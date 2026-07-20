import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  Briefcase,
  Layers,
  FolderOpen,
  Calendar,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Award,
  DollarSign,
  ChevronRight,
  Globe,
  Settings,
  X,
  FileText,
  Star,
  Plane
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { Booking, ServiceType, TripService, TravelOffice } from '../types';
import {
  mockTrips,
  mockHotels,
  mockCars,
  mockFlights,
  mockOffices
} from '../data/mockData';

interface OfficePortalProps {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  onSwitchRole: (role: 'traveler' | 'office' | 'admin') => void;
}

export const OfficePortal: React.FC<OfficePortalProps> = ({
  bookings,
  setBookings,
  onSwitchRole
}) => {
  const { t, tf, language, dir, setLanguage } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'services' | 'bookings' | 'employees' | 'reports'>('summary');
  
  // Current logged in travel agency
  const [currentOffice, setCurrentOffice] = useState<TravelOffice>(mockOffices[0]); // Dallas Travel Agency

  // Adding listings form state
  const [isAddMode, setIsAddMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState(50);
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<ServiceType>('trip');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&q=80');

  // Employee list state
  const [employees, setEmployees] = useState([
    { id: 'emp-1', name: 'Mustafa Al-Zubi', role: 'Sales Manager', permission: 'Full Write' },
    { id: 'emp-2', name: 'Leila Qassim', role: 'Ticketing Agent', permission: 'Edit Bookings' },
    { id: 'emp-3', name: 'Tareq Nimer', role: 'Umrah Supervisor', permission: 'Field Support' },
  ]);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Ticketing Agent');

  // Local listings pool synchronized with global localStorage catalog
  const [officeTrips, setOfficeTrips] = useState<TripService[]>(() => {
    const saved = localStorage.getItem('safretak_trips_catalog');
    let allTrips: TripService[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        allTrips = parsed.map((item: any) => {
          const mock = mockTrips.find(t => t.id === item.id);
          if (mock) {
            return {
              ...item,
              description: mock.description,
              title: mock.title,
              duration: mock.duration,
              included: mock.included,
              officeName: mock.officeName,
              location: mock.location,
              terms: mock.terms,
              cancellationPolicy: mock.cancellationPolicy,
            };
          }
          return item;
        });
        localStorage.setItem('safretak_trips_catalog', JSON.stringify(allTrips));
      } catch (e) {
        console.error("Failed to parse trips catalog:", e);
      }
    }
    if (allTrips.length === 0) {
      allTrips = mockTrips.map(t => ({
        ...t,
        availableDates: t.availableDates || [
          '2026-07-20',
          '2026-07-22',
          '2026-07-25',
          '2026-08-01',
          '2026-08-15'
        ]
      }));
      localStorage.setItem('safretak_trips_catalog', JSON.stringify(allTrips));
    }
    return allTrips.filter(t => t.officeId === currentOffice.id);
  });

  const [newDateInputs, setNewDateInputs] = useState<Record<string, string>>({});

  const syncToGlobalCatalog = (updatedOfficeTrips: TripService[]) => {
    setOfficeTrips(updatedOfficeTrips);
    const saved = localStorage.getItem('safretak_trips_catalog');
    let allTrips: TripService[] = [];
    if (saved) {
      try {
        allTrips = JSON.parse(saved);
      } catch (e) {}
    }
    if (allTrips.length === 0) {
      allTrips = mockTrips.map(t => ({
        ...t,
        availableDates: t.availableDates || [
          '2026-07-20',
          '2026-07-22',
          '2026-07-25',
          '2026-08-01',
          '2026-08-15'
        ]
      }));
    }
    
    // Replace current office's trips in the global list
    const otherOfficesTrips = allTrips.filter(t => t.officeId !== currentOffice.id);
    const newGlobalList = [...updatedOfficeTrips, ...otherOfficesTrips];
    localStorage.setItem('safretak_trips_catalog', JSON.stringify(newGlobalList));
  };

  const handleDeleteListing = (id: string) => {
    const updated = officeTrips.filter(t => t.id !== id);
    syncToGlobalCatalog(updated);
  };

  const handleAddListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const added: TripService = {
      id: `trip-${Math.floor(1000 + Math.random() * 9000)}`,
      officeId: currentOffice.id,
      officeName: currentOffice.name,
      title: newTitle,
      price: Number(newPrice),
      rating: 5.0,
      image: newImage,
      description: newDesc || 'No description provided.',
      type: 'domestic',
      duration: '3 Days / 2 Nights',
      seatsRemaining: 20,
      itinerary: [],
      included: ['Guided tour services', 'Safety briefings'],
      availableDates: ['2026-07-20', '2026-07-25', '2026-08-01'] // pre-populated with default dates
    };

    const updated = [added, ...officeTrips];
    syncToGlobalCatalog(updated);
    setIsAddMode(false);
    setNewTitle('');
    setNewPrice(50);
    setNewDesc('');
  };

  const handleAddTripDate = (tripId: string) => {
    const dateVal = newDateInputs[tripId];
    if (!dateVal) return;

    const updated = officeTrips.map(t => {
      if (t.id === tripId) {
        const currentDates = t.availableDates || [];
        if (currentDates.includes(dateVal)) return t; // Avoid duplicates
        return {
          ...t,
          availableDates: [...currentDates, dateVal].sort()
        };
      }
      return t;
    });

    syncToGlobalCatalog(updated);
    setNewDateInputs(prev => ({ ...prev, [tripId]: '' }));
  };

  const handleRemoveTripDate = (tripId: string, dateToRemove: string) => {
    const updated = officeTrips.map(t => {
      if (t.id === tripId) {
        const currentDates = t.availableDates || [];
        return {
          ...t,
          availableDates: currentDates.filter(d => d !== dateToRemove)
        };
      }
      return t;
    });

    syncToGlobalCatalog(updated);
  };

  const handleAddEmployee = () => {
    if (!newEmpName.trim()) return;
    setEmployees([
      ...employees,
      {
        id: `emp-${Math.floor(100 + Math.random() * 900)}`,
        name: newEmpName,
        role: newEmpRole,
        permission: newEmpRole === 'Sales Manager' ? 'Full Write' : 'Edit Bookings',
      },
    ]);
    setNewEmpName('');
  };

  // Status transitions: Pending -> Confirmed/Cancelled
  const handleUpdateBookingStatus = (id: string, nextStatus: 'Confirmed' | 'Cancelled') => {
    setBookings(
      bookings.map(b => (b.id === id ? { ...b, status: nextStatus, paymentStatus: nextStatus === 'Confirmed' ? 'paid' : b.paymentStatus } : b))
    );

    const booking = bookings.find(b => b.id === id);
    if (booking) {
      if (nextStatus === 'Confirmed') {
        const notif = {
          id: Date.now(),
          type: 'PAYMENT_RECEIPT',
          bookingId: booking.id,
          titleAr: 'تم تأكيد حجزك واستلام الدفعة',
          titleEn: 'Booking Confirmed & Payment Received',
          descAr: `قام مكتب ${booking.officeName} بتأكيد حجزك وتم استلام الدفعة النقدية بنجاح. اضغط هنا لعرض تفاصيل الحجز والإيصال.`,
          descEn: `${booking.officeName} confirmed your booking and payment. Click to view receipt.`,
          timeAr: 'الآن',
          timeEn: 'Just now',
          read: false,
          requiresAction: false
        };
        const existing = JSON.parse(localStorage.getItem('safretk_notifications') || '[]');
        localStorage.setItem('safretk_notifications', JSON.stringify([notif, ...existing]));
        window.dispatchEvent(new CustomEvent('addNotification', {
          detail: {
            id: Date.now(),
            type: 'PAYMENT_RECEIPT',
            bookingId: booking.id,
            titleAr: 'تم تأكيد حجزك واستلام الدفعة',
            titleEn: 'Booking Confirmed & Payment Received',
            descAr: `قام مكتب ${booking.officeName} بتأكيد حجزك وتم استلام الدفعة النقدية بنجاح. اضغط هنا لعرض تفاصيل الحجز والإيصال.`,
            descEn: `${booking.officeName} confirmed your booking and payment. Click to view receipt.`,
            timeAr: 'الآن',
            timeEn: 'Just now',
            read: false,
            requiresAction: false
          }
        }));
      } else if (nextStatus === 'Cancelled') {
        const notif = {
          id: Date.now(),
          type: 'BOOKING_CANCELLED',
          bookingId: booking.id,
          titleAr: 'تم إلغاء الحجز',
          titleEn: 'Booking Cancelled',
          descAr: `نعتذر، قام مكتب ${booking.officeName} بإلغاء طلب الحجز الخاص بك لعدم توفر شواغر أو لسبب آخر.`,
          descEn: `Sorry, ${booking.officeName} has cancelled your booking request.`,
          timeAr: 'الآن',
          timeEn: 'Just now',
          read: false,
          requiresAction: false
        };
        const existing = JSON.parse(localStorage.getItem('safretk_notifications') || '[]');
        localStorage.setItem('safretk_notifications', JSON.stringify([notif, ...existing]));
        window.dispatchEvent(new CustomEvent('addNotification', {
          detail: {
            id: Date.now(),
            type: 'BOOKING_CANCELLED',
            bookingId: booking.id,
            titleAr: 'تم إلغاء الحجز',
            titleEn: 'Booking Cancelled',
            descAr: `نعتذر، قام مكتب ${booking.officeName} بإلغاء طلب الحجز الخاص بك لعدم توفر شواغر أو لسبب آخر.`,
            descEn: `Sorry, ${booking.officeName} has cancelled your booking request.`,
            timeAr: 'الآن',
            timeEn: 'Just now',
            read: false,
            requiresAction: false
          }
        }));
      }
    }
  };

  // Financial statistics
  const officeBookings = bookings.filter(b => b.officeId === currentOffice.id);
  const totalSales = officeBookings
    .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingSales = officeBookings
    .filter(b => b.status === 'Pending')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className="min-h-screen bg-[#0A211A] text-gray-100 flex flex-col font-sans relative" dir={dir}>
      <div className="lattice" />
      {/* Office Portal Header */}
      <header className="sticky top-0 z-50 bg-[#0E4B2E] border-b border-[#173B2F] px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 bg-[#123329] border border-[#C9A227]/35 rounded-xl flex items-center justify-center shadow">
            <div className="absolute inset-0.5 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="/safretak-logo.jpeg"
                alt="Safretak Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-[#123329] border border-[#C9A227]/30 rounded-full flex items-center justify-center text-[10px] shadow-md select-none z-10">
              🇯🇴
            </div>
          </div>
          <div>
            <h1 className="font-serif text-base font-bold text-[#C9A227]/90">
              {tf(currentOffice.name)}
            </h1>
            <p className="text-[10px] text-emerald-400 font-mono tracking-wider">
              {language === 'ar' ? 'مكتب سياحة أردني معتمد' : 'APPROVED JORDAN TRAVEL OFFICE'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#173B2F] hover:bg-[#0E4B2E] text-xs transition"
          >
            <Globe className="w-3.5 h-3.5 text-[#C9A227]/90" />
            <span>{language === 'en' ? 'عربي' : 'انجليزي'}</span>
          </button>

          <button
            onClick={() => onSwitchRole('traveler')}
            className="px-3 py-1.5 bg-[#C9A227] hover:bg-[#C9A227]/90 text-[#0A211A] rounded-lg text-xs font-bold transition flex items-center gap-1"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>{t('role.traveler')}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6 md:gap-8">
        {/* Office Dashboard Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-[#123329] border border-[#173B2F] rounded-2xl p-4 self-start space-y-4">
          <div className="pb-3 border-b border-[#173B2F] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 block">OFFICE workspace</span>
              <span className="text-xs text-[#C9A227]/90 font-bold">{currentOffice.subscriptionPlan} Partner</span>
              <span className="text-[10px] font-mono text-gray-400 block mt-1">ID: {currentOffice.id}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-yellow-400">
              <Star className="w-4 h-4 fill-current text-yellow-500" />
              <span>{currentOffice.rating}</span>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1 pb-2 md:pb-0">
            <button
              onClick={() => setActiveSubTab('summary')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeSubTab === 'summary' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{t('office.summary')}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('services')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeSubTab === 'services' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t('office.manage_services')}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('bookings')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition relative ${
                activeSubTab === 'bookings' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t('office.manage_bookings')}</span>
              {officeBookings.filter(b => b.status === 'Pending').length > 0 && (
                <span className="absolute top-2 right-2 rtl:left-2 rtl:right-auto w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('employees')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeSubTab === 'employees' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t('office.employees')}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('reports')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeSubTab === 'reports' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t('office.reports')}</span>
            </button>
          </nav>
        </aside>

        {/* Dynamic Display */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* SUB-TAB: SUMMARY OVERVIEW */}
            {activeSubTab === 'summary' && (
              <motion.div
                key="summary-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Metrics row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase tracking-wider">{t('office.revenue')}</span>
                    <h3 className="text-2xl font-serif font-bold text-emerald-400 mt-2">{totalSales} JOD</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Confirmed payments</p>
                  </div>

                  <div className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase tracking-wider">Pending Settlement</span>
                    <h3 className="text-2xl font-serif font-bold text-[#C9A227]/90 mt-2">{pendingSales} JOD</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Awaiting client cash/CliQ</p>
                  </div>

                  <div className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase tracking-wider">{t('office.total_bookings')}</span>
                    <h3 className="text-2xl font-serif font-bold text-white mt-2">{officeBookings.length}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Active client transactions</p>
                  </div>
                </div>

                {/* Sub Plan info */}
                <div className="p-5 bg-gradient-to-br from-[#0E4B2E] to-[#123329] border border-[#173B2F] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 bg-[#C9A227]/20 text-[#C9A227]/90 rounded-full font-mono font-bold">PREMIUM AGENCY TIER</span>
                    <h4 className="text-sm font-bold text-white mt-2">Unlimited listings & 2% discounted local commission model.</h4>
                    <p className="text-xs text-gray-400 mt-1">Your next annual renewal is due in May 2027.</p>
                  </div>
                  <button className="px-4 py-2 bg-[#0A211A] border border-[#173B2F] hover:border-[#C9A227] rounded-xl text-xs font-bold text-[#C9A227]/90">
                    {tf('Manage Billing / الاشتراك')}
                  </button>
                </div>

                {/* Recent bookings activity logs */}
                <div className="bg-[#123329] border border-[#173B2F] rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Recent Activity Stream</h4>
                  <div className="divide-y divide-emerald-950">
                    {officeBookings.slice(0, 3).map((b) => (
                      <div key={b.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{b.travelerName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Booked {tf(b.serviceName)}</p>
                        </div>
                        <span className="text-[#C9A227]/90 font-mono font-bold">{b.totalPrice} JOD</span>
                      </div>
                    ))}
                    {officeBookings.length === 0 && (
                      <p className="text-xs text-gray-500 italic py-4">No recent bookings registered.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: MANAGE SERVICES LISTINGS */}
            {activeSubTab === 'services' && (
              <motion.div
                key="services-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-emerald-400 uppercase">
                    Active Catalog Listings ({officeTrips.length})
                  </h3>
                  <button
                    onClick={() => setIsAddMode(!isAddMode)}
                    className="px-3.5 py-2 bg-[#C9A227] hover:bg-[#C9A227]/90 text-[#0A211A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('office.add_service')}</span>
                  </button>
                </div>

                {isAddMode && (
                  <form onSubmit={handleAddListing} className="bg-[#123329] p-5 border border-[#C9A227]/40 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold uppercase text-[#C9A227]/90">Listing details form</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-gray-400 mb-1">Service / Tour Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dana Biosphere Hiking Tour"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full p-2.5 rounded bg-[#0A211A] border border-[#173B2F] text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Standard Selling Price (JOD)</label>
                        <input
                          type="number"
                          required
                          value={newPrice}
                          onChange={(e) => setNewPrice(Number(e.target.value))}
                          className="w-full p-2.5 rounded bg-[#0A211A] border border-[#173B2F] text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-gray-400 mb-1">Service Description</label>
                        <textarea
                          placeholder="Provide daily guides, food inclusions or vehicle specifications..."
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          rows={3}
                          className="w-full p-2.5 rounded bg-[#0A211A] border border-[#173B2F] text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsAddMode(false)}
                        className="px-3 py-2 bg-emerald-950 text-gray-300 rounded-lg"
                      >
                        {t('btn.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#C9A227] text-black font-bold rounded-lg"
                      >
                        {tf('Publish Live / نشر العرض')}
                      </button>
                    </div>
                  </form>
                )}

                {/* List of existing items with available dates management */}
                <div className="space-y-4">
                  {officeTrips.map((trip) => {
                    const dates = trip.availableDates || [];
                    return (
                      <div key={trip.id} className="p-5 bg-[#123329]/90 border border-[#173B2F] rounded-2xl space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-4 items-center">
                            <img src={trip.image} className="w-16 h-16 object-cover rounded-xl" alt="" />
                            <div>
                              <h4 className="text-sm font-bold text-white">{tf(trip.title)}</h4>
                              <span className="text-xs text-[#C9A227]/90 font-mono font-bold">{trip.price} JOD</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('addNotification', {
                                  detail: {
                                    id: Date.now() + 1,
                                    type: 'TRIP_TIME_CHANGED',
                                    titleAr: 'تغيير في موعد الرحلة!',
                                    titleEn: 'Trip schedule changed!',
                                    descAr: `قام المكتب بتعديل موعد رحلة (${tf(trip.title)}). يرجى الاطلاع وتأكيد العلم.`,
                                    descEn: `The office has delayed the trip (${tf(trip.title)}). Please acknowledge.`,
                                    timeAr: 'الآن',
                                    timeEn: 'Just now',
                                    read: false,
                                    requiresAction: true
                                  }
                                }));
                                alert(language === 'ar' ? 'تم إرسال إشعار للمسافرين بتأجيل موعد الرحلة.' : 'Notification sent to travelers about delayed trip time.');
                              }}
                              className="px-3 py-1.5 text-blue-400 hover:bg-blue-950/40 rounded-xl transition border border-blue-900/40 flex items-center gap-1.5 text-xs font-bold"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{language === 'ar' ? 'تأجيل موعد' : 'Delay Trip'}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteListing(trip.id)}
                              className="p-2 text-red-400 hover:bg-red-950/40 rounded-xl transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Available Dates management */}
                        <div className="pt-3 border-t border-emerald-950 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#C9A227]" />
                              <span>{language === 'ar' ? 'التواريخ المتاحة للحجز' : 'Available Booking Dates'}</span>
                            </label>
                            <span className="text-[10px] bg-[#0A211A] px-2 py-0.5 rounded text-[#C9A227] font-mono">
                              {dates.length} {language === 'ar' ? 'تواريخ' : 'Dates'}
                            </span>
                          </div>

                          {/* Date Tags */}
                          <div className="flex flex-wrap gap-1.5">
                            {dates.map((dateStr) => (
                              <span 
                                key={dateStr} 
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0A211A] hover:bg-[#0E4B2E] border border-[#173B2F] rounded-lg text-xs font-mono text-gray-200 transition"
                              >
                                <span>{dateStr}</span>
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveTripDate(trip.id, dateStr)}
                                  className="text-red-400 hover:text-red-300 focus:outline-none font-bold ml-1"
                                  title={language === 'ar' ? 'حذف التاريخ' : 'Delete Date'}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {dates.length === 0 && (
                              <p className="text-[11px] text-gray-500 italic">
                                {language === 'ar' ? 'لا توجد تواريخ محددة، لن يتمكن المسافرون من الحجز!' : 'No dates set. Travelers will not be able to book!'}
                              </p>
                            )}
                          </div>

                          {/* Add Date input inline */}
                          <div className="flex gap-2 items-center max-w-sm">
                            <input
                              type="date"
                              value={newDateInputs[trip.id] || ''}
                              onChange={(e) => setNewDateInputs(prev => ({ ...prev, [trip.id]: e.target.value }))}
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0A211A] border border-[#173B2F] text-xs text-gray-200 focus:outline-none focus:border-[#C9A227]/40"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddTripDate(trip.id)}
                              disabled={!newDateInputs[trip.id]}
                              className="px-3 py-1.5 bg-[#C9A227] disabled:bg-gray-700 disabled:text-gray-400 text-black text-xs font-bold rounded-lg hover:bg-[#C9A227]/90 transition shrink-0"
                            >
                              {language === 'ar' ? 'إضافة تاريخ' : 'Add Date'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: MANAGE CLIENT BOOKINGS */}
            {activeSubTab === 'bookings' && (
              <motion.div
                key="bookings-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold font-mono tracking-wider text-emerald-400 uppercase">
                  Incoming Client Bookings ({officeBookings.length})
                </h3>

                <div className="space-y-3">
                  {officeBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#C9A227]/90">{b.id}</span>
                          <span className="text-gray-400">by {b.travelerName} ({b.travelerPhone})</span>
                        </div>
                        <p className="font-bold text-white text-sm">{tf(b.serviceName)}</p>
                        <p className="text-[11px] text-emerald-400">Settle Price: {b.totalPrice} JOD via {b.paymentMethod}</p>
                        <p className="text-[10px] text-gray-400">Date requested: {b.bookingDetails.date}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <span>Status:</span>
                          <span
                            className={`font-semibold ${
                              b.status === 'Confirmed' ? 'text-emerald-400' : b.status === 'Pending' ? 'text-[#C9A227]/90' : 'text-red-400'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2 self-stretch sm:self-auto">
                        {b.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'Confirmed')}
                              className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-xs font-bold rounded-lg text-emerald-100 flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'تأكيد' : 'Confirm'}</span>
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'Cancelled')}
                              className="flex-1 sm:flex-none px-3.5 py-2 bg-red-950/40 border border-red-900/40 hover:bg-red-950 text-xs font-bold rounded-lg text-red-400 flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'رفض' : 'Reject'}</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('addNotification', {
                              detail: {
                                id: Date.now() + 2,
                                type: 'UPLOAD_DOCUMENTS',
                                bookingId: b.id,
                                titleAr: 'تنبيه: مطلوب إعادة رفع الهوية/الجواز',
                                titleEn: 'Action required: Re-upload ID/Passport',
                                descAr: `يرجى إعادة رفع صورة الهوية أو جواز السفر للحجز ${b.id} من مكتب ${b.officeName}.`,
                                descEn: `Please re-upload your ID or Passport for booking ${b.id} from ${b.officeName}.`,
                                timeAr: 'الآن',
                                timeEn: 'Just now',
                                read: false,
                                requiresAction: false
                              }
                            }));
                            alert(language === 'ar' ? 'تم إرسال إشعار للمسافر لطلب تحديث بيانات الهوية/الجواز' : 'Notification sent to traveler requesting ID/Passport update');
                          }}
                          className="flex-1 sm:flex-none px-3.5 py-2 bg-[#C9A227]/20 border border-[#C9A227]/40 hover:bg-[#C9A227]/30 text-xs font-bold rounded-lg text-[#C9A227] flex items-center justify-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'طلب هوية/جواز' : 'Request ID'}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {officeBookings.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                      <p>No traveler bookings found for your office.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: EMPLOYEES & PERMISSIONS */}
            {activeSubTab === 'employees' && (
              <motion.div
                key="employees-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="p-4 bg-[#123329] border border-[#173B2F] rounded-2xl">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-4">Add Employee Representative</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Enter representative full name..."
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      className="flex-1 p-2.5 rounded bg-[#0A211A] border border-[#173B2F] text-xs text-white"
                    />
                    <select
                      value={newEmpRole}
                      onChange={(e) => setNewEmpRole(e.target.value)}
                      className="p-2.5 rounded bg-[#0A211A] border border-[#173B2F] text-xs text-white"
                    >
                      <option value="Sales Agent">Sales Agent</option>
                      <option value="Ticketing Agent">Ticketing Agent</option>
                      <option value="Umrah Supervisor">Umrah Supervisor</option>
                    </select>
                    <button
                      onClick={handleAddEmployee}
                      className="px-4 py-2 bg-[#C9A227] text-black font-bold text-xs rounded-lg hover:bg-[#C9A227]/90 transition"
                    >
                      Add Employee
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">Current Staff Members</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {employees.map((emp) => (
                      <div key={emp.id} className="p-4 bg-[#123329] border border-[#173B2F] rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-white">{emp.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{emp.role}</p>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-950/80 border border-emerald-900 text-emerald-400 rounded-full font-bold">
                          {emp.permission}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: REPORTS */}
            {activeSubTab === 'reports' && (
              <motion.div
                key="reports-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#123329] border border-[#173B2F] rounded-2xl p-6 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-emerald-400 uppercase">
                    Financial Reports & Projections
                  </h3>
                  <button className="px-3 py-1.5 bg-[#0E4B2E] border border-[#173B2F] hover:border-[#C9A227] text-xs font-bold text-emerald-300 rounded-lg transition">
                    Export Excel / PDF
                  </button>
                </div>

                {/* Simulated Revenue Bar Graph */}
                <div className="space-y-4">
                  <span className="text-xs text-gray-400 block">Weekly Revenue Shares (JOD)</span>
                  <div className="h-44 bg-[#0A211A] border border-[#173B2F] rounded-2xl p-4 flex items-end justify-between gap-2">
                    {[
                      { week: 'Week 1', val: 420, h: 'h-1/5' },
                      { week: 'Week 2', val: 950, h: 'h-2/5' },
                      { week: 'Week 3', val: 1420, h: 'h-3/5' },
                      { week: 'Week 4', val: 2300, h: 'h-4/5' },
                      { week: 'Week 5', val: 3200, h: 'h-full' },
                    ].map((bar, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <span className="text-[9px] text-emerald-400 font-mono opacity-0 group-hover:opacity-100 transition">
                          {bar.val} JOD
                        </span>
                        <div className={`w-full ${bar.h} bg-gradient-to-t from-[#C9A227] to-[#E8CD7A] rounded-t-lg transition hover:brightness-110`} />
                        <span className="text-[9px] text-gray-500 font-mono">{bar.week}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0A211A] border border-[#173B2F] rounded-xl text-xs space-y-2">
                    <p className="font-bold text-white">💰 Safretak Platform Commission Deduct</p>
                    <p className="text-gray-400">As a Premium agency partner, platform retains a standard 2% service handling fee. Net payouts are cleared daily to your Jordan bank account.</p>
                  </div>
                  <div className="p-4 bg-[#0A211A] border border-[#173B2F] rounded-xl text-xs space-y-2">
                    <p className="font-bold text-white">📈 Marketing Campaign Success</p>
                    <p className="text-gray-400">Your featured Wadi Rum stargazing banner campaign generated 142 clicks and 14 direct client bookings this month.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
