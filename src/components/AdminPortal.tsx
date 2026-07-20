import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Users,
  Briefcase,
  Layers,
  Percent,
  TrendingUp,
  AlertOctagon,
  Image,
  Globe,
  Settings,
  UserX,
  FileCheck2,
  CheckCircle2,
  Plus,
  Trash2,
  Database,
  BarChart3,
  Calendar,
  X
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { TravelOffice, Complaint, Coupon, PlatformAd, Booking, PlatformStats } from '../types';
import {
  mockOffices,
  mockComplaints,
  mockCoupons,
  mockAds,
  initialStats
} from '../data/mockData';
import { clearDatabase } from '../firebase';
import { runDataDiagnosticTests, TestResult } from '../utils/dataValidator';

interface AdminPortalProps {
  bookings: Booking[];
  onSwitchRole: (role: 'traveler' | 'office' | 'admin') => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  bookings,
  onSwitchRole
}) => {
  const { t, tf, language, dir, setLanguage } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'offices' | 'complaints' | 'coupons' | 'ads' | 'lists'>('stats');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<TestResult[]>([]);

  // Admin dynamic control lists
  const [offices, setOffices] = useState<TravelOffice[]>(mockOffices);
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [ads, setAds] = useState<PlatformAd[]>(mockAds);
  
  // Cities & countries lists
  const [cities, setCities] = useState([
    { nameAr: 'عمان', nameEn: 'Amman', code: 'AMM' },
    { nameAr: 'العقبة', nameEn: 'Aqaba', code: 'AQB' },
    { nameAr: 'البحر الميت', nameEn: 'Dead Sea', code: 'DSE' },
    { nameAr: 'البتراء', nameEn: 'Petra', code: 'PET' },
  ]);
  const [newCityEn, setNewCityEn] = useState('');
  const [newCityAr, setNewCityAr] = useState('');

  // Coupon form
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState(15);
  const [isAddCoupon, setIsAddCoupon] = useState(false);

  // Platform statistics summaries
  const platformRevenue = bookings
    .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const totalRegisteredTravelers = 1420;

  const handleToggleOfficeStatus = (id: string) => {
    setOffices(
      offices.map(o => (o.id === id ? { ...o, isApproved: !o.isApproved } : o))
    );
  };

  const handleResolveComplaint = (id: string, resolution: string) => {
    setComplaints(
      complaints.map(c => (c.id === id ? { ...c, status: 'Resolved' as const, resolution } : c))
    );
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    const added: Coupon = {
      code: newCode.toUpperCase(),
      discountPercentage: newDiscount,
      maxDiscount: 30,
      isActive: true,
      minBookingValue: 50,
      expiryDate: '2026-12-31',
    };
    setCoupons([added, ...coupons]);
    setIsAddCoupon(false);
    setNewCode('');
  };

  const handleAddCity = () => {
    if (!newCityEn.trim() || !newCityAr.trim()) return;
    setCities([...cities, { nameEn: newCityEn, nameAr: newCityAr, code: newCityEn.substring(0, 3).toUpperCase() }]);
    setNewCityEn('');
    setNewCityAr('');
  };

  const handleToggleAdStatus = (id: string) => {
    setAds(
      ads.map(ad => (ad.id === id ? { ...ad, isActive: !ad.isActive } : ad))
    );
  };

  return (
    <div className="min-h-screen bg-[#0A211A] text-gray-100 flex flex-col font-sans relative" dir={dir}>
      <div className="lattice" />
      {/* Admin header */}
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
              {language === 'ar' ? 'سفرتك - لوحة التحكم الموحدة' : 'Safretak Control Core'}
            </h1>
            <p className="text-[10px] text-red-400 font-mono tracking-wider">
              {language === 'ar' ? 'مساحة العمل لإدارة العمليات والمنصة المعتمدة' : 'PLATFORM ADMINISTRATION WORKSPACE'}
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
            <Globe className="w-3.5 h-3.5" />
            <span>{t('role.traveler')}</span>
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6 md:gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-[#123329] border border-[#173B2F] rounded-2xl p-4 self-start space-y-4">
          <div>
            <span className="text-[10px] font-mono text-gray-400 block uppercase tracking-wider">System Director Controls</span>
            <span className="text-[10px] font-mono text-[#C9A227] block mt-1">ID: ADMN-A_ADMIN_789</span>
          </div>

          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1 pb-2 md:pb-0">
            <button
              onClick={() => setActiveSubTab('stats')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeSubTab === 'stats' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t('admin.stats')}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('offices')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition relative ${
                activeSubTab === 'offices' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>{t('admin.offices')}</span>
              {offices.filter(o => !o.isApproved).length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('complaints')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition relative ${
                activeSubTab === 'complaints' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t('admin.complaints')}</span>
              {complaints.filter(c => c.status === 'Open').length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-400 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('coupons')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeSubTab === 'coupons' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>{t('admin.coupons')}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('ads')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeSubTab === 'ads' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>{t('admin.ads')}</span>
            </button>
            <button
              onClick={() => setActiveSubTab('lists')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeSubTab === 'lists' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>{t('admin.cities')}</span>
            </button>
          </nav>

          <div className="pt-4 border-t border-[#173B2F] space-y-2">
            <span className="text-[10px] font-mono text-[#C9A227] block uppercase tracking-wider">Database Maintenance</span>
            <button
              onClick={async () => {
                if (window.confirm(language === 'ar' ? 'هل أنت متأكد من مسح جميع بيانات قاعدة البيانات؟' : 'Are you sure you want to completely clear the database?')) {
                  try {
                    await clearDatabase();
                    alert(language === 'ar' ? 'تم تنظيف قاعدة البيانات بنجاح!' : 'Database wiped successfully!');
                    window.location.reload();
                  } catch (e) {
                    alert('Error: ' + String(e));
                  }
                }
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 border border-red-900/30 transition"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>{language === 'ar' ? 'مسح قاعدة البيانات كاملة' : 'Wipe Clean Database'}</span>
            </button>

            <button
              onClick={() => {
                const res = runDataDiagnosticTests();
                setDiagnosticResults(res);
                setShowDiagnostics(true);
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/30 transition"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'تشغيل فحص سلامة البيانات' : 'Run Data Diagnostics'}</span>
            </button>
          </div>
        </aside>

        {/* Dynamic Display Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* SUB-TAB: GLOBAL STATS */}
            {activeSubTab === 'stats' && (
              <motion.div
                key="stats-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Global stats metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl">
                    <span className="text-[10px] text-gray-400 block font-mono">PLATFORM TRADING VALUE</span>
                    <h3 className="text-xl font-bold text-[#C9A227]/90 mt-1">{platformRevenue + 3120} JOD</h3>
                    <p className="text-[9px] text-emerald-400 mt-1">Live transaction aggregate</p>
                  </div>

                  <div className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl">
                    <span className="text-[10px] text-gray-400 block font-mono">PLATFORM COMMISSION SHARE</span>
                    <h3 className="text-xl font-bold text-emerald-400 mt-1">{((platformRevenue + 3120) * 0.05).toFixed(1)} JOD</h3>
                    <p className="text-[9px] text-gray-400 mt-1">5% retained profit margins</p>
                  </div>

                  <div className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl">
                    <span className="text-[10px] text-gray-400 block font-mono">LICENSED AGENCIES</span>
                    <h3 className="text-xl font-bold text-white mt-1">{offices.length} Offices</h3>
                    <p className="text-[9px] text-gray-400 mt-1">{offices.filter(o => o.isApproved).length} Approved partners</p>
                  </div>

                  <div className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl">
                    <span className="text-[10px] text-gray-400 block font-mono">REGISTERED TRAVELERS</span>
                    <h3 className="text-xl font-bold text-white mt-1">{totalRegisteredTravelers} Users</h3>
                    <p className="text-[9px] text-gray-400 mt-1">Jordanian telephone accounts</p>
                  </div>
                </div>

                {/* Simulated Platform Revenue Line chart */}
                <div className="bg-[#123329] border border-[#173B2F] rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Platform growth velocity</h4>
                  <div className="h-44 bg-[#0A211A] border border-[#173B2F] rounded-xl p-4 flex items-end justify-between relative">
                    {/* Simulated coordinates */}
                    <div className="absolute top-1/4 left-0 right-0 border-t border-dashed border-emerald-950" />
                    <div className="absolute top-2/4 left-0 right-0 border-t border-dashed border-emerald-950" />
                    <div className="absolute top-3/4 left-0 right-0 border-t border-dashed border-emerald-950" />

                    {[
                      { m: 'Jan', val: '12K JOD', h: 'h-1/5' },
                      { m: 'Feb', val: '18K JOD', h: 'h-2/5' },
                      { m: 'Mar', val: '24K JOD', h: 'h-3/5' },
                      { m: 'Apr', val: '31K JOD', h: 'h-4/5' },
                      { m: 'May', val: '45K JOD', h: 'h-full' },
                    ].map((pt, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 z-10">
                        <span className="text-[8px] text-emerald-300 font-mono">{pt.val}</span>
                        <div className={`w-3 ${pt.h} bg-[#C9A227] rounded-full`} />
                        <span className="text-[9px] text-gray-500 font-mono mt-1">{pt.m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: TRAVEL OFFICES MODERATION */}
            {activeSubTab === 'offices' && (
              <motion.div
                key="offices-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold font-mono tracking-wider text-emerald-400 uppercase">
                  Travel Offices Compliance & Licensure
                </h3>

                <div className="space-y-3">
                  {offices.map((o) => (
                    <div
                      key={o.id}
                      className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{tf(o.name)}</span>
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full font-mono text-[9px] font-bold uppercase">{o.subscriptionPlan}</span>
                        </div>
                        <p className="text-gray-400">📍 Location: {tf(o.location)}</p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {o.id}</p>
                        <p className="text-[11px] text-gray-500 font-mono">Current Escrow Balance: {o.balance} JOD</p>
                        <div className="flex items-center gap-1 text-[10px] text-red-400">
                          <span>Warnings / complaints registered:</span>
                          <strong>{o.complaintsCount}</strong>
                        </div>
                      </div>

                      <div className="flex gap-2 self-stretch sm:self-auto">
                        <button
                          onClick={() => handleToggleOfficeStatus(o.id)}
                          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition ${
                            o.isApproved
                              ? 'bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-950'
                              : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'
                          }`}
                        >
                          {o.isApproved ? tf('Suspend Agency / تجميد') : tf('Approve Agency / تفعيل الموثوقية')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: COMPLAINTS DESK */}
            {activeSubTab === 'complaints' && (
              <motion.div
                key="complaints-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold font-mono tracking-wider text-emerald-400 uppercase">
                  Complaints Desk & Escalations ({complaints.filter(c => c.status === 'Open').length} Open)
                </h3>

                <div className="space-y-3">
                  {complaints.map((c) => (
                    <div key={c.id} className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl space-y-4">
                      <div className="flex justify-between items-start text-xs">
                        <div>
                          <span className="font-mono text-[10px] text-[#C9A227]/90 font-bold">{c.id}</span>
                          <h4 className="font-bold text-white text-sm mt-1">{c.subject}</h4>
                          <p className="text-gray-400 mt-1">
                            By <span className="text-[#C9A227]/90">{c.travelerName}</span> ({c.travelerPhone}) against <strong>{c.officeName}</strong>
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                            c.status === 'Open' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed p-3 bg-[#0A211A] rounded-xl border border-emerald-950">
                        {c.details}
                      </p>

                      {c.status === 'Open' ? (
                        <div className="flex gap-2 justify-end text-xs">
                          <button
                            onClick={() => handleResolveComplaint(c.id, 'Warned office, priority response delivered.')}
                            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 font-bold rounded-lg text-emerald-100 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-950/20 text-[11px] text-emerald-400 border border-emerald-900 rounded-xl">
                          <strong>Resolution verdict:</strong> {c.resolution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: PLATFORM COUPONS */}
            {activeSubTab === 'coupons' && (
              <motion.div
                key="coupons-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold font-mono tracking-wider text-emerald-400 uppercase">
                    Platform Coupons & Marketing Promos
                  </h3>
                  <button
                    onClick={() => setIsAddCoupon(!isAddCoupon)}
                    className="px-3 py-1.5 bg-[#C9A227] hover:bg-[#C9A227]/90 text-black font-bold text-xs rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Coupon</span>
                  </button>
                </div>

                {isAddCoupon && (
                  <form onSubmit={handleAddCoupon} className="bg-[#123329] p-5 border border-[#C9A227]/30 rounded-2xl space-y-4">
                    <span className="text-xs font-bold text-[#C9A227]/90 block font-mono">Create new promotional code</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-gray-400 mb-1">Coupon Code (e.g. AMMAN15)</label>
                        <input
                          type="text"
                          required
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="AMMAN15"
                          className="w-full p-2.5 rounded bg-[#0A211A] border border-[#173B2F] text-white font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1">Discount percentage (%)</label>
                        <input
                          type="number"
                          required
                          value={newDiscount}
                          onChange={(e) => setNewDiscount(Number(e.target.value))}
                          placeholder="15"
                          className="w-full p-2.5 rounded bg-[#0A211A] border border-[#173B2F] text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsAddCoupon(false)}
                        className="px-3 py-2 bg-emerald-950 text-gray-300 rounded"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="px-4 py-2 bg-[#C9A227] text-black font-bold rounded">
                        Publish Coupon
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {coupons.map((c) => (
                    <div key={c.code} className="p-4 bg-[#123329] border border-[#173B2F] rounded-xl flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-mono font-bold text-sm text-[#C9A227]/90 uppercase tracking-wider">{c.code}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full font-bold">-{c.discountPercentage}%</span>
                      </div>
                      <div className="text-[11px] text-gray-400 space-y-1 font-mono">
                        <p>• Min Booking: {c.minBookingValue} JOD</p>
                        <p>• Max Discount cap: {c.maxDiscount} JOD</p>
                        <p>• Expiry: {c.expiryDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: ADS MANAGEMENTS */}
            {activeSubTab === 'ads' && (
              <motion.div
                key="ads-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-bold font-mono tracking-wider text-emerald-400 uppercase">
                  Manage Banners & Platform Advertisements
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ads.map((ad) => (
                    <div key={ad.id} className="p-4 bg-[#123329] border border-[#173B2F] rounded-xl space-y-3">
                      <img src={ad.image} className="w-full h-32 object-cover rounded-lg" alt="" />
                      <div>
                        <h4 className="text-xs font-bold text-white truncate">{ad.titleEn}</h4>
                        <p className="text-[10px] text-emerald-400 mt-0.5 truncate">{ad.titleAr}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-emerald-950">
                        <span className="text-[10px] font-mono text-gray-400">Target Listing ID: {ad.link}</span>
                        <button
                          onClick={() => handleToggleAdStatus(ad.id)}
                          className={`px-3 py-1 text-[10px] font-bold rounded ${
                            ad.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                          }`}
                        >
                          {ad.isActive ? 'Active Campaign' : 'Paused Campaign'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SUB-TAB: COUNTRIES & CITIES EDITOR */}
            {activeSubTab === 'lists' && (
              <motion.div
                key="lists-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="bg-[#123329] border border-[#173B2F] rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Jordanian Cities Registry</h3>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="City English Name (e.g. Jerash)"
                      value={newCityEn}
                      onChange={(e) => setNewCityEn(e.target.value)}
                      className="flex-1 p-2 bg-[#0A211A] border border-[#173B2F] text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="اسم المدينة بالعربية"
                      value={newCityAr}
                      onChange={(e) => setNewCityAr(e.target.value)}
                      className="flex-1 p-2 bg-[#0A211A] border border-[#173B2F] text-xs text-white"
                    />
                    <button
                      onClick={handleAddCity}
                      className="px-3 bg-[#C9A227] text-black text-xs font-bold rounded hover:bg-[#C9A227]/90 transition"
                    >
                      Add
                    </button>
                  </div>

                  <div className="divide-y divide-emerald-950 mt-4">
                    {cities.map((city, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-white">{city.nameEn}</span>
                          <span className="text-[10px] text-gray-400 block">{city.nameAr}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">{city.code}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#123329] border border-[#173B2F] rounded-2xl p-5 space-y-4 text-xs text-gray-300">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Service Categories Registry</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Categories are globally declared and synced across all traveler interfaces. The 14 platform-wide categories are locked to prevent service-structure breaking changes.
                  </p>
                  <ul className="space-y-1 font-mono text-[11px] text-[#C9A227]/90">
                    <li>✓ Trips (Domestic & International)</li>
                    <li>✓ Hajj & Umrah Program Bundles</li>
                    <li>✓ Hotels, Apartments, Resorts & Villas</li>
                    <li>✓ Flight tickets & airline codes</li>
                    <li>✓ Car rental, Buses and Trains</li>
                    <li>✓ Digital travel insurance policies</li>
                    <li>✓ Visa assistance processing</li>
                    <li>✓ Direct travel consultations & planning</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Diagnostics Modal Overlay */}
      <AnimatePresence>
        {showDiagnostics && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#05130e] border border-[#112d22] rounded-[28px] max-w-2xl w-full p-6 space-y-6 shadow-2xl relative text-left rtl:text-right"
              dir={dir}
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#173B2F]">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-[#C9A227]" />
                    <span>{language === 'ar' ? 'تقرير سلامة وفحص البيانات' : 'Platform Integrity & Diagnostics'}</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">TEST_SUITE_RUNNER v1.0.0 (Production Hardened)</p>
                </div>
                <button
                  onClick={() => setShowDiagnostics(false)}
                  className="p-1.5 rounded-full hover:bg-[#0E4B2E] text-gray-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {diagnosticResults.map((test) => (
                  <div
                    key={test.id}
                    className="p-4 bg-[#0A211A] border border-[#173B2F] rounded-xl flex items-start gap-3 justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono bg-[#173B2F] text-[#C9A227] px-1.5 py-0.5 rounded uppercase font-bold">
                          {test.category}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 font-bold">{test.id}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{test.name}</h4>
                      <p className="text-[11px] text-gray-400 leading-normal">{test.message}</p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase shrink-0 ${
                        test.passed
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900'
                          : 'bg-red-950/80 text-red-400 border border-red-900'
                      }`}
                    >
                      {test.passed ? 'PASSED ✓' : 'FAILED ✗'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#173B2F] flex justify-between items-center text-xs">
                <span className="text-gray-400">
                  {language === 'ar' ? 'حالة الاختبارات:' : 'Diagnostic Results:'}{' '}
                  <strong className="text-emerald-400">
                    {diagnosticResults.filter((r) => r.passed).length} / {diagnosticResults.length} Passed
                  </strong>
                </span>
                <button
                  onClick={() => setShowDiagnostics(false)}
                  className="px-5 py-2.5 bg-[#C9A227] text-black font-bold rounded-xl hover:bg-[#C9A227]/90 transition text-xs"
                >
                  {language === 'ar' ? 'إغلاق التقرير' : 'Close Report'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
