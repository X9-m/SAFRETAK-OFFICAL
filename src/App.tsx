import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Phone,
  Lock,
  User,
  Mail,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { TravelerPortal } from './components/TravelerPortal';
import { OfficePortal } from './components/OfficePortal';
import { AdminPortal } from './components/AdminPortal';
import { IntegrationPortal } from './components/IntegrationPortal';
import { Booking } from './types';
import { saveUserToDb, getUserFromDb, saveBookingToDb, getBookingsFromDb, ensureAuth, clearDatabase } from './firebase';
import { Globe, ArrowRight, Sparkles, Database, X } from 'lucide-react';
import { apiClient } from './services/apiClient';
import {
  cleanPhone,
  isValidJordanPhone,
  validateFullName,
  validateGmail,
  sanitizeInput,
  validateLength
} from './utils/security';

export default function App() {
  return (
    <LanguageProvider>
      <SafretakApp />
    </LanguageProvider>
  );
}

function SafretakApp() {
  const { t, tf, language, dir, setLanguage } = useLanguage();

  // Modern Pathname Router with strict language and login portal isolation
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('pushstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('pushstate', handleLocationChange);
    };
  }, []);

  // Parse path components: e.g. /en/login/user -> lang: 'en', portal: 'traveler', view: 'login'
  const parsePath = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    let lang: 'en' | 'ar' = 'ar';
    let portal: 'traveler' | 'office' | 'admin' | 'integration' | null = 'traveler';
    let view: 'login' | 'active' = 'login';

    let hasLang = false;
    if (parts[0] === 'en' || parts[0] === 'ar') {
      lang = parts[0];
      hasLang = true;
    }

    const remainingParts = hasLang ? parts.slice(1) : parts;

    if (remainingParts.length === 0) {
      portal = 'traveler';
      view = 'login';
    } else if (remainingParts[0] === 'login') {
      const roleName = remainingParts[1] || 'user';
      if (roleName === 'user' || roleName === 'traveler') portal = 'traveler';
      else if (roleName === 'office') portal = 'office';
      else if (roleName === 'admin') portal = 'admin';
      else if (roleName === 'integration') portal = 'integration';
      view = 'login';
    } else {
      const roleName = remainingParts[0];
      if (roleName === 'traveler' || roleName === 'user') {
        portal = 'traveler';
        view = 'active';
      } else if (roleName === 'office') {
        portal = 'office';
        view = 'active';
      } else if (roleName === 'admin') {
        portal = 'admin';
        view = 'active';
      } else if (roleName === 'integration') {
        portal = 'integration';
        view = 'active';
      } else {
        portal = 'traveler';
        view = 'login';
      }
    }

    return { lang, portal, view };
  };

  const { lang, portal: portalParam, view: pathView } = parsePath(currentPath);

  // Auto-redirect if path lacks language prefix
  useEffect(() => {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts[0] !== 'en' && parts[0] !== 'ar') {
      let role = 'user';
      if (path.includes('admin')) role = 'admin';
      else if (path.includes('office')) role = 'office';
      else if (path.includes('integration')) role = 'integration';
      
      const targetPath = `/ar/login/${role}`;
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new Event('pushstate'));
    }
  }, [currentPath]);

  // Sync role and view based on URL changes
  useEffect(() => {
    if (portalParam && portalParam !== 'integration') {
      setAuthRole(portalParam);
    }
  }, [portalParam]);

  const navigateToPortal = (role: 'traveler' | 'office' | 'admin' | 'integration') => {
    const roleName = role === 'traveler' ? 'user' : role;
    const targetPath = `/${language}/login/${roleName}`;
    window.history.pushState({}, '', targetPath);
    window.dispatchEvent(new Event('pushstate'));
    setAlertMsg('');
    setAuthStep('phone');
  };

  const resetToHub = () => {
    const targetPath = `/${language}`;
    window.history.pushState({}, '', targetPath);
    window.dispatchEvent(new Event('pushstate'));
    setAlertMsg('');
  };

  // App cycle: splash -> auth -> traveler/office/admin
  const [appState, setAppState] = useState<'splash' | 'auth' | 'traveler' | 'office' | 'admin'>('splash');
  
  // Auth view switcher
  const [authRole, setAuthRole] = useState<'traveler' | 'office' | 'admin'>('traveler');
  const [authStep, setAuthStep] = useState<'phone' | 'otp' | 'register'>('phone');

  // Input states
  const [phone, setPhone] = useState('0795432109'); // Default Jordanian phone number
  const [otpCode, setOtpCode] = useState('123456');
  const [fullName, setFullName] = useState('Samer Al-Nabulsi');
  const [email, setEmail] = useState('samer@jordan.jo');

  // Luxury login matching states
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
  const [travelerStep, setTravelerStep] = useState<'input' | 'otp' | 'email'>('input');
  const [otpChallengeId, setOtpChallengeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState('');
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportText, setSupportText] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Office credentials
  const [officeUser, setOfficeUser] = useState('dallas_agency');
  const [officePass, setOfficePass] = useState('dallas2026');

  // Admin credentials
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('safretak#admin');

  // Error/Success alerts
  const [alertMsg, setAlertMsg] = useState('');

  // Logged-in traveler profile by default for instant zero-barrier entry
  const [currentTraveler, setCurrentTraveler] = useState<{ fullName: string; phone: string; email?: string; id: string } | null>({
    id: 'USR-SMRNABULSI1',
    fullName: 'سامر النابلسي',
    phone: '0795432109',
    email: 'samer@gmail.com'
  });

  // Default bookings array used to seed database if empty
  const defaultBookings: Booking[] = [];

  // Global synchronized state
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Synced wrapper for state updates that saves any changed bookings to Firestore
  const syncAndSetBookings = (updatedBookingsOrFn: React.SetStateAction<Booking[]>) => {
    setBookings((prevBookings) => {
      const nextBookings = typeof updatedBookingsOrFn === 'function' ? (updatedBookingsOrFn as Function)(prevBookings) : updatedBookingsOrFn;
      
      nextBookings.forEach((b: Booking) => {
        const prevB = prevBookings.find(pb => pb.id === b.id);
        if (!prevB || JSON.stringify(prevB) !== JSON.stringify(b)) {
          saveBookingToDb(b).catch(err => console.error("Firestore sync error: ", err));
        }
      });
      
      return nextBookings;
    });
  };

  // Dynamic bookings load hook
  useEffect(() => {
    if (appState !== 'splash') {
      const syncBookings = async () => {
        try {
          await ensureAuth();
          const dbBookings = await getBookingsFromDb();
          if (dbBookings && dbBookings.length > 0) {
            setBookings(dbBookings);
          } else {
            setBookings([]);
          }
        } catch (err) {
          console.error("Failed to sync bookings: ", err);
        }
      };
      syncBookings();
    }
  }, [appState]);

  // Splash simulation with instant zero-barrier routing to active portals
  useEffect(() => {
    const timer = setTimeout(() => {
      const { portal } = parsePath(window.location.pathname);
      const targetPortal = portal || 'traveler';
      const l = window.location.pathname.startsWith('/en') ? 'en' : 'ar';
      
      // Auto update URL path directly to active view for frictionless client view
      window.history.pushState({}, '', `/${l}/${targetPortal}`);
      window.dispatchEvent(new Event('pushstate'));
      
      setAppState(targetPortal);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg('');
    setServerMsg('');

    const sName = sanitizeInput(fullName).substring(0, 100);
    const sPhone = cleanPhone(phone).substring(0, 15);

    setFullName(sName);
    setPhone(sPhone);

    if (authTab === 'register' && !validateFullName(sName)) {
      setAlertMsg(language === 'ar' 
        ? 'يرجى إدخال اسمك الكامل (الاسم الأول واسم العائلة على الأقل)' 
        : 'Please enter your full name (at least first name and last name)');
      return;
    }

    if (!isValidJordanPhone(sPhone)) {
      setAlertMsg(language === 'ar'
        ? 'يرجى إدخال رقم هاتف أردني صحيح يبدأ بـ 07 أو 7 ومؤلف من 9 أو 10 أرقام'
        : 'Please enter a valid Jordanian phone number starting with 07 or 7 (9 or 10 digits)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.requestOtp({ phone: sPhone, purpose: authTab });
      if (res.success) {
        setServerMsg(res.message || '');
        setTravelerStep('otp');
      }
    } catch (err: any) {
      setAlertMsg(err.message || 'حدث خطأ في النظام. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg('');
    setServerMsg('');

    const sPhone = cleanPhone(phone).substring(0, 15);
    const sOtp = sanitizeInput(otpCode).replace(/[^0-9]/g, '').substring(0, 6);
    setOtpCode(sOtp);

    if (!sOtp || sOtp.length !== 6) {
      setAlertMsg(language === 'ar' ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter the 6-digit verification code');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.verifyOtp({ phone: sPhone, purpose: authTab, otp: sOtp });
      if (res.success && res.otpChallengeId) {
        setOtpChallengeId(res.otpChallengeId);
        if (authTab === 'register') {
          setTravelerStep('email');
        } else {
          // It's a login
          const loginRes = await apiClient.login({ phone: sPhone, otpChallengeId: res.otpChallengeId });
          if (loginRes.success && loginRes.profile) {
            // Save to Firestore users collection to stay fully synced
            const p = loginRes.profile;
            await saveUserToDb(p.id, p.fullName, p.phone, 'traveler', p.email);
            
            setCurrentTraveler({
              fullName: p.fullName,
              phone: p.phone,
              email: p.email || undefined,
              id: p.id
            });
            const l = window.location.pathname.startsWith('/en') ? 'en' : 'ar';
            window.history.pushState({}, '', `/${l}/traveler`);
            window.dispatchEvent(new Event('pushstate'));
            setAppState('traveler');
          }
        }
      }
    } catch (err: any) {
      setAlertMsg(err.message || 'رمز التحقق غير صحيح، يرجى إدخال 123456 للتجربة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg('');

    const sName = sanitizeInput(fullName).substring(0, 100);
    const sPhone = cleanPhone(phone).substring(0, 15);
    const sEmail = sanitizeInput(email).substring(0, 100);
    setEmail(sEmail);

    if (sEmail && !validateGmail(sEmail)) {
      setAlertMsg(language === 'ar'
        ? 'يرجى إدخال بريد إلكتروني صحيح من نوع Gmail (ينتهي بـ @gmail.com) أو تركه فارغاً'
        : 'Please enter a valid Gmail address (ending with @gmail.com) or leave it empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.register({ fullName: sName, phone: sPhone, email: sEmail || undefined, otpChallengeId });
      if (res.success && res.profile) {
        // Save to Firestore to be totally integrated
        const p = res.profile;
        await saveUserToDb(p.id, p.fullName, p.phone, 'traveler', p.email);

        setCurrentTraveler({
          fullName: p.fullName,
          phone: p.phone,
          email: p.email || undefined,
          id: p.id
        });
        const l = window.location.pathname.startsWith('/en') ? 'en' : 'ar';
        window.history.pushState({}, '', `/${l}/traveler`);
        window.dispatchEvent(new Event('pushstate'));
        setAppState('traveler');
      }
    } catch (err: any) {
      setAlertMsg(err.message || 'فشل التسجيل. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfficeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const sUser = sanitizeInput(officeUser).substring(0, 50);
    const sPass = sanitizeInput(officePass).substring(0, 50);
    setOfficeUser(sUser);
    setOfficePass(sPass);

    if (sUser === 'dallas_agency' && sPass === 'dallas2026') {
      const l = window.location.pathname.startsWith('/en') ? 'en' : 'ar';
      window.history.pushState({}, '', `/${l}/office`);
      window.dispatchEvent(new Event('pushstate'));
      setAppState('office');
    } else {
      setAlertMsg(language === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid credentials');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const sUser = sanitizeInput(adminUser).substring(0, 50);
    const sPass = sanitizeInput(adminPass).substring(0, 50);
    setAdminUser(sUser);
    setAdminPass(sPass);

    if (sUser === 'admin' && sPass === 'safretak#admin') {
      const l = window.location.pathname.startsWith('/en') ? 'en' : 'ar';
      window.history.pushState({}, '', `/${l}/admin`);
      window.dispatchEvent(new Event('pushstate'));
      setAppState('admin');
    } else {
      setAlertMsg(language === 'ar' ? 'بيانات دخول المشرف غير صحيحة' : 'Invalid admin password');
    }
  };


  return (
    <div className="min-h-screen bg-[#0A211A] text-white flex flex-col font-sans relative" dir={dir}>
      <div className="lattice" />
      <AnimatePresence mode="wait">
        {/* SPLASH SCREEN */}
        {appState === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0A211A] text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              {/* Animated Glowing Logo icon */}
              <div className="relative w-24 h-24 bg-[#123329] border-2 border-[#C9A227] rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-[#0A211A] group">
                <div className="absolute inset-1.5 rounded-2xl overflow-hidden flex items-center justify-center">
                  <img
                    src="/safretak-logo.jpeg"
                    alt="Safretak Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 rounded-3xl border border-[#C9A227]/40 animate-pulse pointer-events-none" />
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#123329] border border-[#C9A227]/30 rounded-full flex items-center justify-center text-sm shadow-md select-none z-10">
                  🇯🇴
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#C9A227] via-yellow-400 to-[#C9A227]">
                  {language === 'ar' ? 'سفرتك' : 'SAFRETAK'}
                </h1>
                <p className="text-[#C9A227] font-mono text-xs tracking-widest uppercase">
                  {language === 'ar' ? 'البوابة المعتمدة لمكاتب السياحة والسفر الأردنية' : 'Approved Jordanian Travel Agencies Portal'}
                </p>
              </div>

              <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden relative">
                <motion.div
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="absolute top-0 bottom-0 w-2/3 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent"
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* AUTHENTICATION / PORTAL GATE */}
        {appState === 'auth' && (
          <motion.div
            key="auth-gateway"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 min-h-screen p-4 md:p-8 flex items-center justify-center relative bg-[#0A211A]"
          >
            {/* Background design accents */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-[#123329]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#C9A227]/5 rounded-full blur-3xl pointer-events-none" />

            {portalParam === 'integration' ? (
              <IntegrationPortal onBack={resetToHub} />
            ) : false ? (
              /* SECURITY GATEWAY HUB - BYPASSED AND HIDDEN */
              <div className="hidden" dir={dir}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#C9A227] font-mono tracking-widest">
                      <span>{language === 'ar' ? 'سفرتك - مركز الأمان الوطني المعتمد' : 'SAFRETAK NATIONAL SECURITY HUB'}</span>
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-white tracking-tight">
                      {language === 'ar' ? 'سفرتك — بوابة العبور المعتمدة' : 'Safretak — Security Gateway Hub'}
                    </h1>
                    <p className="text-sm text-white/60">
                      {language === 'ar' 
                        ? 'يرجى اختيار البوابة المخصصة لمتابعة الدخول الآمن والتحقق من التراخيص' 
                        : 'Choose your dedicated role portal below. Each portal runs on an isolated security context.'}
                    </p>
                  </div>

                  <button
                    onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <Globe className="w-4 h-4 text-[#C9A227]" />
                    <span>{language === 'en' ? 'عربي' : 'انجليزي'}</span>
                  </button>
                </div>

                {/* Grid of separated entrance channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Traveler Entrance */}
                  <div className="bg-[#123329]/40 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-[#C9A227]/40 transition group backdrop-blur-md">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-950/55 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                        <Compass className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#C9A227] transition">
                          {language === 'ar' ? 'بوابة المسافرين' : 'Traveler Portal'}
                        </h3>
                        <p className="text-xs text-white/50 leading-relaxed">
                          {language === 'ar' 
                            ? 'تصفح ومقارنة الرحلات، الفنادق، الطيران والفيزا مع الدفع الآمن وحل شكاوى العملاء.' 
                            : 'Browse tours, compare hotels, flights, visas, pay securely, and track your bookings.'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/5 p-2 rounded-xl text-[9px] font-mono text-white/40 break-all border border-white/5">
                        URL: ?portal=traveler
                      </div>
                      <button
                        onClick={() => navigateToPortal('traveler')}
                        className="w-full py-2.5 bg-[#C9A227] hover:bg-[#C9A227]/90 text-[#0A211A] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <span>{language === 'ar' ? 'دخول المسافرين' : 'Enter Portal'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Office Entrance */}
                  <div className="bg-[#123329]/40 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-[#C9A227]/40 transition group backdrop-blur-md">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-950/55 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#C9A227] transition">
                          {language === 'ar' ? 'مساحة عمل مكاتب السياحة' : 'Business Workspace'}
                        </h3>
                        <p className="text-xs text-white/50 leading-relaxed">
                          {language === 'ar' 
                            ? 'خاص بمكاتب السياحة المرخصة. إدارة الرحلات، الحجوزات، الموظفين، الاشتراكات والتقارير.' 
                            : 'Dedicated space for licensed agencies. Manage trips, hotel blocks, employee accounts, and plans.'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/5 p-2 rounded-xl text-[9px] font-mono text-white/40 break-all border border-white/5">
                        URL: ?portal=office
                      </div>
                      <button
                        onClick={() => navigateToPortal('office')}
                        className="w-full py-2.5 bg-[#C9A227] hover:bg-[#C9A227]/90 text-[#0A211A] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <span>{language === 'ar' ? 'دخول المكتب' : 'Enter Portal'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Admin Entrance */}
                  <div className="bg-[#123329]/40 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-[#C9A227]/40 transition group backdrop-blur-md">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-950/55 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#C9A227] transition">
                          {language === 'ar' ? 'لوحة تحكم المشرف' : 'Admin Control Center'}
                        </h3>
                        <p className="text-xs text-white/50 leading-relaxed">
                          {language === 'ar' 
                            ? 'بوابة سرية لإدارة المستخدمين، مكاتب السياحة، الاشتراكات، الإعلانات، الشكاوى والإحصائيات.' 
                            : 'Superuser dashboard to oversee platform-wide users, offices, subscription models, and ads.'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/5 p-2 rounded-xl text-[9px] font-mono text-white/40 break-all border border-white/5">
                        URL: ?portal=admin
                      </div>
                      <button
                        onClick={() => navigateToPortal('admin')}
                        className="w-full py-2.5 bg-[#C9A227] hover:bg-[#C9A227]/90 text-[#0A211A] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <span>{language === 'ar' ? 'دخول المشرف' : 'Enter Portal'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dev Setup Integration Entrance */}
                  <div className="bg-[#123329]/40 border border-[#C9A227]/20 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-[#C9A227] transition group backdrop-blur-md">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-950/55 border border-[#C9A227]/30 flex items-center justify-center text-[#C9A227]">
                        <Database className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#C9A227] transition">
                            {language === 'ar' ? 'الربط السحابي' : 'Cloud Setup'}
                          </h3>
                          <span className="text-[8px] font-mono bg-[#C9A227]/20 border border-[#C9A227]/30 text-[#C9A227] px-1 py-0.5 rounded">DEV</span>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed">
                          {language === 'ar' 
                            ? 'إعداد ومزامنة اتصال قاعدة بيانات Supabase، مستودع GitHub والرفع المباشر إلى Vercel.' 
                            : 'Configuration area for Supabase Database, Vercel deployments, and GitHub Sync status.'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/5 p-2 rounded-xl text-[9px] font-mono text-white/40 break-all border border-white/5">
                        URL: ?portal=integration
                      </div>
                      <button
                        onClick={() => navigateToPortal('integration')}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <span>{language === 'ar' ? 'بوابة الإعدادات' : 'Configure Integration'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <p className="text-xs text-white/40 font-mono">
                    SAFRETAK JORDAN SYSTEM VERSION 1.4.0 (STABLE)
                  </p>
                </div>
              </div>
            ) : (
              /* ISOLATED ZERO-BARRIER PORTAL GATEWAY - HIGHLY POLISHED & CLEAN */
              <div className="w-full max-w-md bg-gradient-to-b from-[#0A211A] to-[#0E2C22] border border-emerald-900/60 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                {/* Accent lights */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A227]/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-950/20 rounded-full blur-2xl pointer-events-none" />

                {/* App Logo */}
                <div className="text-center space-y-3">
                  <div className="relative w-16 h-16 bg-[#123329] border border-[#C9A227]/40 rounded-2xl mx-auto flex items-center justify-center shadow-lg group">
                    <div className="absolute inset-1 rounded-xl overflow-hidden flex items-center justify-center">
                      <img
                        src="/safretak-logo.jpeg"
                        alt="Safretak Logo"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-[#0E2C22] border border-[#C9A227]/30 rounded-full flex items-center justify-center text-[10px] shadow z-10 select-none">
                      🇯🇴
                    </div>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                    {language === 'ar' ? 'سفرتك — بوابات الوصول المباشر' : 'Safretak — Direct Access'}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {language === 'ar' 
                      ? 'اختر البوابة المطلوبة للولوج الفوري ومتابعة استعراض وتعديل نتائج العميل' 
                      : 'Select a portal to enter instantly with pre-verified credentials'}
                  </p>
                </div>

                {/* Grid of clean direct entrance buttons */}
                <div className="space-y-3 pt-2">
                  {/* Traveler Portal Button */}
                  <button
                    onClick={() => {
                      setCurrentTraveler({
                        id: 'USR-SMRNABULSI1',
                        fullName: 'سامر النابلسي',
                        phone: '0795432109',
                        email: 'samer@gmail.com'
                      });
                      const l = window.location.pathname.startsWith('/en') ? 'en' : 'ar';
                      window.history.pushState({}, '', `/${l}/traveler`);
                      window.dispatchEvent(new Event('pushstate'));
                      setAppState('traveler');
                    }}
                    className="w-full group p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-emerald-900/10 border border-emerald-950 hover:border-[#C9A227]/50 hover:from-[#123329]/40 hover:to-emerald-900/20 text-left rtl:text-right flex items-center justify-between transition-all duration-300"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-[#C9A227]">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#C9A227] transition-colors">
                          {language === 'ar' ? 'بوابة المسافرين (العميل)' : 'Traveler Portal (Client)'}
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          {language === 'ar' ? 'تصفح العروض، الفنادق، الطيران والرحلات' : 'Compare tours, flights, and bookings'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#C9A227]/70 font-semibold group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {language === 'ar' ? 'دخول ←' : 'Enter →'}
                    </span>
                  </button>

                  {/* Office Workspace Button */}
                  <button
                    onClick={() => {
                      const l = window.location.pathname.startsWith('/en') ? 'en' : 'ar';
                      window.history.pushState({}, '', `/${l}/office`);
                      window.dispatchEvent(new Event('pushstate'));
                      setAppState('office');
                    }}
                    className="w-full group p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-emerald-900/10 border border-emerald-950 hover:border-[#C9A227]/50 hover:from-[#123329]/40 hover:to-emerald-900/20 text-left rtl:text-right flex items-center justify-between transition-all duration-300"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-[#C9A227]">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#C9A227] transition-colors">
                          {language === 'ar' ? 'مساحة عمل مكاتب السياحة' : 'Approved Travel Offices'}
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          {language === 'ar' ? 'إدارة الرحلات والمسافرين والطلبات والاشتراكات' : 'Manage tours, bookings, and operations'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#C9A227]/70 font-semibold group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {language === 'ar' ? 'دخول ←' : 'Enter →'}
                    </span>
                  </button>

                  {/* Unified Admin Button */}
                  <button
                    onClick={() => {
                      const l = window.location.pathname.startsWith('/en') ? 'en' : 'ar';
                      window.history.pushState({}, '', `/${l}/admin`);
                      window.dispatchEvent(new Event('pushstate'));
                      setAppState('admin');
                    }}
                    className="w-full group p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-emerald-900/10 border border-emerald-950 hover:border-[#C9A227]/50 hover:from-[#123329]/40 hover:to-emerald-900/20 text-left rtl:text-right flex items-center justify-between transition-all duration-300"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-[#C9A227]">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#C9A227] transition-colors">
                          {language === 'ar' ? 'لوحة تحكم وإدارة المنصة' : 'Unified Platform Admin'}
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          {language === 'ar' ? 'التحكم بالتوثيق والمكاتب ومبيعات المنصة والشكاوى' : 'Manage travel offices, verification, and logs'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#C9A227]/70 font-semibold group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {language === 'ar' ? 'دخول ←' : 'Enter →'}
                    </span>
                  </button>
                </div>

                {/* Footer and Language switch */}
                <div className="flex justify-between items-center pt-4 border-t border-emerald-950/60 text-xs">
                  <div className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">
                    safretk@2026 V1.0.1
                  </div>
                  <button
                    onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                    className="text-[#C9A227] hover:underline font-semibold font-serif text-[11px]"
                  >
                    {language === 'en' ? 'عربي' : 'انجليزي'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ACTIVE TRAVELER PORTAL */}
        {appState === 'traveler' && currentTraveler && (
          <TravelerPortal
            traveler={currentTraveler}
            bookings={bookings}
            setBookings={syncAndSetBookings}
            onLogout={() => setAppState('auth')}
            onSwitchRole={(role) => setAppState(role)}
          />
        )}

        {/* ACTIVE OFFICE PORTAL */}
        {appState === 'office' && (
          <OfficePortal
            bookings={bookings}
            setBookings={syncAndSetBookings}
            onSwitchRole={(role) => setAppState(role)}
          />
        )}

        {/* ACTIVE ADMIN PORTAL */}
        {appState === 'admin' && (
          <AdminPortal
            bookings={bookings}
            onSwitchRole={(role) => setAppState(role)}
          />
        )}

        {/* SUPPORT MODAL OVERLAY */}
        {supportModalOpen && (
          <motion.div
            key="support-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A211A]/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#123329] border border-[#C9A227]/35 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative text-right"
              dir="rtl"
            >
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="absolute top-4 left-4 text-white/50 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-[#C9A227]">
                  {language === 'ar' ? 'الدعم الفني والشكاوى' : 'Technical Support & Complaints'}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {language === 'ar'
                    ? 'نحن هنا لخدمتكم على مدار الساعة. أرسل استفسارك أو مشكلتك وسيجيب عليك مهندس الدعم الفني فوراً.'
                    : 'We are here to help you 24/7. Send your inquiry or issue and our engineer will respond shortly.'
                  }
                </p>
              </div>

              {supportSuccess ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto" />
                  <p className="font-bold">{language === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Your request has been sent!'}</p>
                  <p className="opacity-80 text-[11px]">
                    {language === 'ar'
                      ? 'تم تسجيل الشكوى برقم تذكرة #JordanSupport2026. سنتواصل معك عبر الهاتف.'
                      : 'Complaint recorded under #JordanSupport2026. We will contact you.'
                    }
                  </p>
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(false)}
                    className="mt-2 px-4 py-1.5 bg-[#C9A227] text-[#0A211A] font-bold rounded-lg text-[11px]"
                  >
                    {language === 'ar' ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!supportText.trim()) return;
                    setSupportSuccess(true);
                  }}
                  className="space-y-4 text-xs text-right"
                >
                  <div className="space-y-1.5">
                    <label className="block text-white/70 font-semibold">
                      {language === 'ar' ? 'رقم الهاتف للتواصل' : 'Contact Phone Number'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={phone ? `+962 ${phone}` : '—'}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/5 text-white/40 font-mono text-left"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-white/70 font-semibold">
                      {language === 'ar' ? 'تفاصيل المشكلة أو الرسالة' : 'Message Details'}
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder={language === 'ar' ? 'اكتب تفاصيل مشكلتك هنا بالتفصيل...' : 'Write your issue or inquiry in detail...'}
                      value={supportText}
                      onChange={(e) => setSupportText(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#C9A227] text-sm leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#C9A227] hover:bg-[#C9A227]/90 text-[#0A211A] font-bold rounded-xl text-xs transition"
                  >
                    {language === 'ar' ? 'إرسال طلب الدعم' : 'Submit Support Request'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
