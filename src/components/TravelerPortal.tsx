import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Calendar,
  Users,
  CreditCard,
  CheckCircle2,
  Share2,
  Download,
  MessageSquare,
  FileText,
  Upload,
  User,
  Phone,
  Wallet,
  Heart,
  Globe,
  Compass,
  ArrowRight,
  Send,
  X,
  Filter,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Plane,
  Car,
  Briefcase,
  HelpCircle,
  Percent,
  Check,
  AlertCircle,
  Bell,
  Settings,
  Shuffle,
  RefreshCw,
  Award,
  Zap,
  Sparkles,
  Moon,
  Map
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import {
  TripService,
  HotelService,
  CarService,
  FlightService,
  BusTrainService,
  HajjUmrahService,
  InsuranceService,
  VisaService,
  ConsultationService,
  Booking,
  ServiceType,
  Review,
  TravelOffice
} from '../types';
import {
  mockTrips,
  mockHotels,
  mockCars,
  mockFlights,
  mockBusesTrains,
  mockHajjUmrah,
  mockInsurance,
  mockVisa,
  mockConsultations,
  mockOffices,
  mockCoupons,
  mockReviews
} from '../data/mockData';
import { bookServiceSeats, getAllServiceSeats } from '../firebase';

const officeUsernames: Record<string, string> = {
  'OFC-Dallas_Amman': '@DallasTravel',
  'OFC-JETT_Amman': '@JETTAgency',
  'OFC-Plaza_Amman': '@PlazaTours',
  'OFC-AlBarakah_Amman': '@AlBarakah',
  'OFC-JordanHorizons_Aqaba': '@JordanHorizons',
};

const getArabicInitials = (name: string) => {
  if (!name) return 'أ.خ';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const firstLetter = parts[0].charAt(0);
    const lastLetter = parts[parts.length - 1].charAt(0);
    return `${firstLetter}.${lastLetter}`;
  }
  return name.slice(0, 2);
};

const getTravelerAvatarTheme = (nameOrId: string) => {
  const palettes = [
    {
      name: 'Luxury Gold',
      gradient: 'from-[#4d3621] via-[#2d2014] to-[#120c08]',
      miniBg: 'bg-gradient-to-br from-[#aa8343] to-[#4d3621]',
      border: 'border-[#C9A227]/40',
      text: 'text-white',
      miniText: 'text-[#fceb92]',
    },
    {
      name: 'Deep Emerald',
      gradient: 'from-[#0b291d] via-[#05130e] to-[#010504]',
      miniBg: 'bg-gradient-to-br from-[#10b981] to-[#065f46]',
      border: 'border-[#10b981]/40',
      text: 'text-emerald-100',
      miniText: 'text-emerald-200',
    },
    {
      name: 'Royal Bronze',
      gradient: 'from-[#4e2715] via-[#2d140a] to-[#120502]',
      miniBg: 'bg-gradient-to-br from-[#b45309] to-[#78350f]',
      border: 'border-[#b45309]/40',
      text: 'text-white',
      miniText: 'text-[#fcd34d]',
    },
    {
      name: 'Imperial Rose',
      gradient: 'from-[#501c2a] via-[#2a0e16] to-[#110508]',
      miniBg: 'bg-gradient-to-br from-[#ec4899] to-[#be185d]',
      border: 'border-[#ec4899]/40',
      text: 'text-white',
      miniText: 'text-pink-200',
    },
    {
      name: 'Midnight Blue',
      gradient: 'from-[#172554] via-[#0f172a] to-[#020617]',
      miniBg: 'bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8]',
      border: 'border-[#3b82f6]/40',
      text: 'text-blue-100',
      miniText: 'text-blue-200',
    },
    {
      name: 'Mystic Amethyst',
      gradient: 'from-[#3b0764] via-[#1e1b4b] to-[#030712]',
      miniBg: 'bg-gradient-to-br from-[#a855f7] to-[#6b21a8]',
      border: 'border-[#a855f7]/40',
      text: 'text-purple-100',
      miniText: 'text-purple-200',
    },
    {
      name: 'Warm Copper',
      gradient: 'from-[#451a03] via-[#1c1917] to-[#0c0a09]',
      miniBg: 'bg-gradient-to-br from-[#ea580c] to-[#9a3412]',
      border: 'border-[#ea580c]/40',
      text: 'text-white',
      miniText: 'text-orange-200',
    }
  ];

  let hash = 0;
  const str = nameOrId || 'user';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
};

const officeBios: Record<string, { ar: string, en: string }> = {
  'OFC-Dallas_Amman': {
    ar: 'نأخذكم في رحلات العمر إلى أجمل بقاع الأردن والعالم بأفضل الأسعار وبخدمات متميزة.',
    en: 'Taking you on lifetime journeys to Jordan and the worlds most beautiful spots with premium service.'
  },
  'OFC-JETT_Amman': {
    ar: 'رحلات يومية منتظمة وسياحية لكافة المعالم الأثرية في الأردن بأعلى درجات الراحة والأمان.',
    en: 'Regular daily tourist trips to all archaeological landmarks in Jordan with comfort.'
  },
  'OFC-Plaza_Amman': {
    ar: 'استكشف وجهات جديدة وتجربة سفر متكاملة ومصممة خصيصاً لتناسب كافة تطلعاتك.',
    en: 'Explore new destinations with a fully integrated travel experience tailored to your needs.'
  },
  'OFC-AlBarakah_Amman': {
    ar: 'تنظيم رحلات الحج والعمرة ببرامج متكاملة وسكن فاخر بالقرب من الحرمين الشريفين.',
    en: 'Organizing Hajj & Umrah trips with integrated programs and luxury lodging near the Haram.'
  },
  'OFC-JordanHorizons_Aqaba': {
    ar: 'رحلات سياحية خاصة واستشارات لتخطيط أجمل المغامرات والمسارات الاستكشافية في الأردن.',
    en: 'Private tour packages and expert consultation to plan the best adventure paths in Jordan.'
  }
};

interface TravelerPortalProps {
  traveler: { fullName: string; phone: string; email?: string; id: string };
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  onLogout: () => void;
  onSwitchRole: (role: 'traveler' | 'office' | 'admin') => void;
}

export const TravelerPortal: React.FC<TravelerPortalProps> = ({
  traveler,
  bookings,
  setBookings,
  onLogout,
  onSwitchRole
}) => {
  const { t, tf, language, dir, setLanguage } = useLanguage();
  
  const translatePolicyOrTerms = (val: string): string => {
    if (language !== 'ar') return val;
    const dict: Record<string, string> = {
      'Free cancellation up to 24 hours before departure.': 'إلغاء مجاني حتى 24 ساعة قبل المغادرة.',
      'Refundable up to 7 days before flight, subject to ticket processing fee.': 'قابل للاسترداد حتى 7 أيام قبل الرحلة، يخضع لرسوم معالجة التذكرة.',
      'Free cancellation 48 hours prior to check-in date.': 'إلغاء مجاني قبل 48 ساعة من تاريخ تسجيل الوصول.',
      'Non-refundable booking during weekends and public holidays.': 'حجز غير قابل للاسترداد خلال عطلات نهاية الأسبوع والعطلات الرسمية.',
      'Free cancellation up to 12 hours before pick-up.': 'إلغاء مجاني حتى 12 ساعة قبل موعد الاستلام.',
      'No refund for cancellations within 24 hours of rental start.': 'لا يوجد استرداد للإلغاء خلال 24 ساعة من بدء الإيجار.',
      'Refundable only up to 14 days before departure.': 'قابل للاسترداد فقط حتى 14 يوماً قبل المغادرة.',
      'Non-refundable.': 'غير قابل للاسترداد.',
      'Full refund if cancelled prior to the policy start date.': 'استرداد كامل في حال الإلغاء قبل تاريخ بدء وثيقة التأمين.',
      'Fee is non-refundable once documents have been prepared and submitted.': 'الرسوم غير قابلة للاسترداد بمجرد إعداد المستندات وتقديمها.',
      'Subject to travel office approvals.': 'تخضع لموافقات مكتب السفر.',
      'Valid Jordanian National ID or Passport matching booking names required upon pickup/boarding.': 'يجب تقديم هوية شخصية أردنية سارية المفعول أو جواز سفر يطابق أسماء الحجز عند الاستلام/الصعود.'
    };
    return dict[val] || val;
  };

  const translateSpec = (val: string | null | undefined): string => {
    if (!val) return '';
    if (language !== 'ar') {
      return tf(val);
    }
    
    const tfResult = tf(val);
    if (tfResult !== val) {
      return tfResult;
    }

    const dict: Record<string, string> = {
      // Transmission
      'Automatic': 'أوتوماتيك',
      'Manual': 'عادي (مانيوال)',
      
      // Car Type
      'SUV': 'عائلية رياضية (SUV)',
      'Luxury': 'سيارة فاخرة',
      'Sedan': 'سيارة سيدان',
      'Economy': 'اقتصادية / الدرجة السياحية',
      
      // Car Brand
      'Kia': 'كيا',
      'Ford': 'فورد',
      'Hyundai': 'هيونداي',
      
      // Hotel Amenities
      'Private Beach': 'شاطئ خاص',
      'Infinity Pools': 'برك سباحة إنفينيتي',
      'Zara Spa': 'سبا زارا الشهير',
      'Gym': 'صالة رياضية (جيم)',
      'Free WiFi': 'إنترنت لاسلكي مجاني',
      'Buffet Restaurant': 'مطعم بوفيه مفتوح',
      'Valet Parking': 'خدمة اصطفاف السيارات (فاليت)',
      'Private Lagoon Beach': 'شاطئ لاغون خاص',
      'Kids Club': 'نادي للأطفال',
      'Multiple Outdoor Pools': 'حمامات سباحة خارجية متعددة',
      'Luxury Spa': 'سبا فاخر متكامل',
      'Seafood Restaurants': 'مطاعم مأكولات بحرية',
      
      // Room Types
      'Classic Superior Room': 'غرفة كلاسيكية سوبيريور',
      'Luxury Sea View Suite': 'جناح فاخر مطل على البحر',
      'Deluxe Lagoon View Room': 'غرفة ديلوكس مطلة على البحيرة',
      'Royal Beachfront Villa': 'فيلا شاطئية ملكية',
      
      // Room Amenities
      'King Bed': 'سرير كينج كبير',
      'Balcony': 'شرفة (بلكونة)',
      'Garden View': 'إطلالة على الحديقة',
      'Minibar': 'ثلاجة صغيرة',
      'Full Sea View': 'إطلالة كاملة على البحر',
      'Jacuzzi': 'جاكوزي خاص',
      'VIP lounge access': 'دخول صالة كبار الشخصيات',
      'Two Double Beds': 'سريرين مزدوجين',
      'Pool view': 'إطلالة على المسبح',
      'Nespresso Machine': 'آلة قهوة نسبريسو',
      'Private Pool': 'مسبح خاص',
      '3 Bedrooms': '3 غرف نوم',
      'Personal Butler': 'خادم شخصي خاص',

      // Flights
      'Amman (AMM)': 'عمان (AMM)',
      'Dubai (DXB)': 'دبي (DXB)',
      'Istanbul (IST)': 'اسطنبول (IST)',
      'Cairo (CAI)': 'القاهرة (CAI)',
      'Royal Jordanian': 'الملكية الأردنية',
      'Turkish Airlines': 'الخطوط التركية',
      'Fly Jordan': 'طيران الأردن (فلاي جوردن)',
      'Business': 'درجة رجال الأعمال',

      // Embassy Requirements
      'Jordanian Passport valid for 6 months': 'جواز سفر أردني ساري المفعول لمدة 6 أشهر',
      'HR Letter from employer with salary details': 'خطاب من جهة العمل (HR Letter) يوضح تفاصيل الراتب',
      'Bank statement of last 3 months with healthy balance': 'كشف حساب بنكي لآخر 3 أشهر برصيد كافٍ',
      '2 Passport size biometric photos with white background': 'صورتين شخصيتين مقاس جواز السفر بخلفية بيضاء'
    };

    return dict[val.trim()] || val;
  };

  const officesTrackRef = React.useRef<HTMLDivElement>(null);
  const destinationsTrackRef = React.useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'bookings' | 'account'>('home');

  // Synchronized trips catalog state
  const [tripsCatalog, setTripsCatalog] = useState<TripService[]>(() => {
    const saved = localStorage.getItem('safretak_trips_catalog');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const synced = parsed.map((item: any) => {
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
        localStorage.setItem('safretak_trips_catalog', JSON.stringify(synced));
        return synced;
      } catch (e) {
        console.error(e);
      }
    }
    const initial = mockTrips.map(t => ({
      ...t,
      availableDates: t.availableDates || [
        '2026-07-20',
        '2026-07-22',
        '2026-07-25',
        '2026-08-01',
        '2026-08-15'
      ]
    }));
    localStorage.setItem('safretak_trips_catalog', JSON.stringify(initial));
    return initial;
  });

  // Re-load from localStorage when component mounts or activeTab changes (to pick up any edits from the Office Portal)
  useEffect(() => {
    const saved = localStorage.getItem('safretak_trips_catalog');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const synced = parsed.map((item: any) => {
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
        setTripsCatalog(synced);
      } catch (e) {}
    }
  }, [activeTab]);

  // Synchronized Hajj & Umrah catalog state
  const [hajjUmrahCatalog, setHajjUmrahCatalog] = useState<HajjUmrahService[]>(() => {
    const saved = localStorage.getItem('safretak_hajj_umrah_catalog');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => {
          const mock = mockHajjUmrah.find(h => h.id === item.id);
          if (mock) {
            return { ...mock, ...item };
          }
          return item;
        });
      } catch (e) {
        console.error(e);
      }
    }
    return mockHajjUmrah;
  });

  // Re-load Hajj & Umrah catalog from localStorage on activeTab change
  useEffect(() => {
    const saved = localStorage.getItem('safretak_hajj_umrah_catalog');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const synced = parsed.map((item: any) => {
          const mock = mockHajjUmrah.find(h => h.id === item.id);
          if (mock) {
            return { ...mock, ...item };
          }
          return item;
        });
        setHajjUmrahCatalog(synced);
      } catch (e) {}
    }
  }, [activeTab]);

  // Persist Hajj & Umrah catalog to localStorage
  useEffect(() => {
    localStorage.setItem('safretak_hajj_umrah_catalog', JSON.stringify(hajjUmrahCatalog));
  }, [hajjUmrahCatalog]);

  // Real-time capacity sync from Firestore
  useEffect(() => {
    const syncRealTimeSeats = async () => {
      try {
        const liveSeats = await getAllServiceSeats();
        
        // Sync trips catalog with live seats
        setTripsCatalog(prev => prev.map(trip => {
          if (typeof liveSeats[trip.id] === 'number') {
            return { ...trip, seatsRemaining: liveSeats[trip.id] };
          }
          return trip;
        }));

        // Sync Hajj & Umrah catalog with live seats
        setHajjUmrahCatalog(prev => prev.map(hu => {
          if (typeof liveSeats[hu.id] === 'number') {
            return { ...hu, seatsRemaining: liveSeats[hu.id] };
          }
          return hu;
        }));
      } catch (e) {
        console.error("Error syncing real-time seats: ", e);
      }
    };

    syncRealTimeSeats();
    const interval = setInterval(syncRealTimeSeats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Promoted / Trending Trips State
  const [maxPromotedLimit, setMaxPromotedLimit] = useState(10);
  const [limitPerOffice, setLimitPerOffice] = useState(1);
  const [promotedOffices, setPromotedOffices] = useState<string[]>(['OFC-Dallas_Amman', 'OFC-JETT_Amman', 'OFC-AlBarakah_Amman']);
  const [promotedTrips, setPromotedTrips] = useState<any[]>([]);
  const [showPromoterSettings, setShowPromoterSettings] = useState(false);

  const generatePromotedTrips = (maxLimit: number, perOffice: number, officeIds: string[]) => {
    const groupedTrips: Record<string, typeof tripsCatalog> = {};
    officeIds.forEach(id => {
      groupedTrips[id] = tripsCatalog.filter(t => t.officeId === id);
    });

    const selectedPool: typeof tripsCatalog = [];
    officeIds.forEach(id => {
      const trips = [...(groupedTrips[id] || [])];
      const shuffled = [...trips].sort(() => 0.5 - Math.random());
      const taken = shuffled.slice(0, perOffice);
      selectedPool.push(...taken);
    });

    const finalShuffled = [...selectedPool].sort(() => 0.5 - Math.random());
    return finalShuffled.slice(0, maxLimit);
  };

  useEffect(() => {
    const pool = generatePromotedTrips(maxPromotedLimit, limitPerOffice, promotedOffices);
    setPromotedTrips(pool);
  }, [maxPromotedLimit, limitPerOffice, promotedOffices, tripsCatalog]);

  const handleReshuffle = () => {
    const pool = generatePromotedTrips(maxPromotedLimit, limitPerOffice, promotedOffices);
    setPromotedTrips(pool);
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotificationModal, setActiveNotificationModal] = useState<any>(null);
  
  const handleNotificationClick = (notification: any) => {
    // Mark as read specifically if it was unread
    if (!notification.read) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    }

    if (notification.type === 'BOOKING_CONFIRMED' || notification.type === 'UPLOAD_DOCUMENTS' || notification.type === 'PAYMENT_RECEIPT' || notification.type === 'BOOKING_CANCELLED') {
      const booking = bookings.find(b => b.id === notification.bookingId);
      if (booking) {
        setActiveNotificationModal({ notification, booking });
      } else {
        // Fallback if booking is not found locally
        setActiveNotificationModal({ notification });
      }
    } else if (notification.type === 'TRIP_TIME_CHANGED' || notification.type === 'TRIP_CANCELLED') {
      const booking = bookings.find(b => b.id === notification.bookingId);
      if (booking) {
        setActiveNotificationModal({ notification, booking, requiresAction: true });
      } else {
        setActiveNotificationModal({ notification, requiresAction: true });
      }
    } else {
      setActiveNotificationModal({ notification });
    }
    
    // Close dropdowns
    setShowNotifications(false);
  };

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'BOOKING_CONFIRMED',
      bookingId: 'BKG-001',
      titleAr: 'تم تأكيد حجزك بنجاح!',
      titleEn: 'Your booking has been confirmed!',
      descAr: 'تم تأكيد حجزك لفندق البحر الميت من قبل مكتب النخبة للسياحة.',
      descEn: 'Your Dead Sea hotel booking was confirmed by Al-Nokhbeh Agency.',
      timeAr: 'منذ ١٠ دقائق',
      timeEn: '10m ago',
      read: false
    },
    {
      id: 4,
      type: 'TRIP_TIME_CHANGED',
      bookingId: 'BKG-001',
      titleAr: 'تغيير في موعد الرحلة!',
      titleEn: 'Trip schedule changed!',
      descAr: 'تم تأخير موعد انطلاق رحلة وادي رم لمدة ساعة، يرجى تأكيد استلام التنبيه.',
      descEn: 'Wadi Rum trip departure delayed by 1 hour, please confirm receipt.',
      timeAr: 'منذ ١٢ دقيقة',
      timeEn: '12m ago',
      read: false,
      requiresAction: true
    },
    {
      id: 3,
      type: 'UPLOAD_DOCUMENTS',
      bookingId: 'BKG-002',
      titleAr: 'تنبيه: مطلوب إعادة رفع الهوية/الجواز',
      titleEn: 'Action required: Re-upload ID/Passport',
      descAr: 'يرجى إعادة رفع صورة الهوية أو جواز السفر للحجز BKG-002، الصورة السابقة غير واضحة.',
      descEn: 'Please re-upload your ID or Passport for booking BKG-002 as the previous one was unclear.',
      timeAr: 'منذ يومين',
      timeEn: '2d ago',
      read: true
    },
    {
      id: 2,
      type: 'PROMO',
      titleAr: 'خصم خاص بقيمة ١٥٪!',
      titleEn: 'Special 15% discount!',
      descAr: 'استخدم كوبون SAFAR26 للحصول على خصم فوري على رحلتك القادمة.',
      descEn: 'Use coupon SAFAR26 to get instant discount on your next trip.',
      timeAr: 'منذ ساعتين',
      timeEn: '2h ago',
      read: false
    }
  ]);

  useEffect(() => {
    const handleNewNotification = (e: any) => {
      if (e.detail) {
        setNotifications(prev => [e.detail, ...prev]);
      }
    };
    window.addEventListener('addNotification', handleNewNotification);
    return () => window.removeEventListener('addNotification', handleNewNotification);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceType | 'all' | 'offers'>('all');
  const [selectedItem, setSelectedItem] = useState<{ type: ServiceType; item: any } | null>(null);
  const [selectedOfficeProfile, setSelectedOfficeProfile] = useState<TravelOffice | null>(null);
  const [activeOfficeTab, setActiveOfficeTab] = useState<'news' | 'services' | 'trips'>('trips');
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);

  // States for the premium Account tab matching the screenshot
  const [travelerPoints, setTravelerPoints] = useState(240);
  const [activeProfileSubView, setActiveProfileSubView] = useState<'favorites' | 'payments' | 'addresses' | 'notifications' | 'edit_profile' | 'settings' | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [accountAddresses, setAccountAddresses] = useState<string[]>([
    'عمان، الأردن - شارع مكة',
    'إربد، الأردن - شارع الجامعة'
  ]);
  const [tempTravelerName, setTempTravelerName] = useState(traveler.fullName);
  const [tempTravelerPhone, setTempTravelerPhone] = useState(traveler.phone);
  const [tempTravelerEmail, setTempTravelerEmail] = useState(traveler.email || 'ahmad.safar@gmail.com');
  const [prefSeat, setPrefSeat] = useState('Window / بجانب النافذة');
  const [prefFood, setPrefFood] = useState('Halal / حلال');
  const [prefCategory, setPrefCategory] = useState('Adventure / مغامرات وركوب الخيل');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailPromoEnabled, setEmailPromoEnabled] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccessToast, setSupportSuccessToast] = useState<string | null>(null);
  const [activeAccountSection, setActiveAccountSection] = useState<'profile' | 'addresses' | 'notifications' | 'support'>('profile');
  const [newAddressInput, setNewAddressInput] = useState('');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);

  useEffect(() => {
    const officesTrack = officesTrackRef.current;
    const destinationsTrack = destinationsTrackRef.current;
    if (activeTab !== 'home' || selectedItem || selectedOfficeProfile) return;

    const cleanupFns: (() => void)[] = [];

    const initTrack = (track: HTMLDivElement | null) => {
      if (!track) return;
      let autoScrollTimer: NodeJS.Timeout | null = null;
      let scrollEndTimeout: NodeJS.Timeout | null = null;
      let isUserInteracting = false;

      const getCardWidth = () => {
        const firstCard = track.querySelector('.profile-card') as HTMLElement;
        return firstCard ? firstCard.offsetWidth + 20 : 200;
      };

      const startAutoScroll = () => {
        if (autoScrollTimer) clearInterval(autoScrollTimer);
        autoScrollTimer = setInterval(() => {
          if (isUserInteracting) return;
          const cardWidth = getCardWidth();
          const maxScroll = track.scrollWidth - track.clientWidth;
          const currentScroll = Math.abs(track.scrollLeft);

          if (currentScroll >= maxScroll - 15) {
            track.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            const scrollDir = dir === 'rtl' ? -1 : 1;
            track.scrollBy({ left: scrollDir * cardWidth, behavior: 'smooth' });
          }
        }, 2200);
      };

      const stopAutoScroll = () => {
        if (autoScrollTimer) {
          clearInterval(autoScrollTimer);
          autoScrollTimer = null;
        }
      };

      const handleScroll = () => {
        isUserInteracting = true;
        stopAutoScroll();
        if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
        scrollEndTimeout = setTimeout(() => {
          isUserInteracting = false;
          startAutoScroll();
        }, 3000);
      };

      const handleTouchStart = () => {
        isUserInteracting = true;
        stopAutoScroll();
      };

      const handleTouchEnd = () => {
        if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
        scrollEndTimeout = setTimeout(() => {
          isUserInteracting = false;
          startAutoScroll();
        }, 3000);
      };

      track.addEventListener('scroll', handleScroll, { passive: true });
      track.addEventListener('mouseenter', stopAutoScroll);
      track.addEventListener('mouseleave', startAutoScroll);
      track.addEventListener('touchstart', handleTouchStart, { passive: true });
      track.addEventListener('touchend', handleTouchEnd, { passive: true });

      startAutoScroll();

      cleanupFns.push(() => {
        stopAutoScroll();
        if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
        track.removeEventListener('scroll', handleScroll);
        track.removeEventListener('mouseenter', stopAutoScroll);
        track.removeEventListener('mouseleave', startAutoScroll);
        track.removeEventListener('touchstart', handleTouchStart);
        track.removeEventListener('touchend', handleTouchEnd);
      });
    };

    initTrack(officesTrack);
    initTrack(destinationsTrack);

    return () => {
      cleanupFns.forEach(fn => fn());
    };
  }, [activeTab, selectedItem, selectedOfficeProfile, dir]);

  // Filters State
  const [cityFilter, setCityFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState(500);
  const [ratingFilter, setRatingFilter] = useState(0);

  // Booking Flow State
  const [bookingDate, setBookingDate] = useState('2026-07-20');

  useEffect(() => {
    if (selectedItem && (selectedItem.type === 'trip' || selectedItem.type === 'intl_trip')) {
      const dates = selectedItem.item.availableDates || [];
      if (dates.length > 0) {
        setBookingDate(dates[0]);
      }
    }
  }, [selectedItem]);
  const [bookingQuantity, setBookingQuantity] = useState(1);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [flightCabinClass, setFlightCabinClass] = useState<'Economy' | 'Business'>('Economy');
  const [visaUploadedDocs, setVisaUploadedDocs] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // const [couponCode, setCouponCode] = useState('');
  // const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number; discount: number } | null>(null);
  // const [couponError, setCouponError] = useState('');

  const getServicesForItem = (item: any) => {
    if (!item) return [];
    return [
      { id: 'transport', nameAr: 'المواصلات المؤمنة (حافلة سياحية)', nameEn: 'Secured Transportation (Luxury Bus)', price: 0, isPrimary: true, icon: 'bus' },
      { id: 'accommodation', nameAr: 'الإقامة الفندقية / المخيم الفاخر', nameEn: 'Hotel / Luxury Camp Accommodation', price: 0, isPrimary: true, icon: 'hotel' },
      { id: 'meals', nameAr: 'وجبة الإفطار (بوفيه مفتوح)', nameEn: 'Breakfast Buffet', price: 0, isPrimary: true, icon: 'meals' },
      { id: 'lunch', nameAr: 'وجبة الغداء الإضافية', nameEn: 'Extra Lunch Meal', price: 5, isPrimary: false, icon: 'lunch' },
      { id: 'jeep', nameAr: 'جولة سيارات الدفع الرباعي 4x4', nameEn: '4x4 Jeep Tour', price: 3, isPrimary: false, icon: 'jeep' },
      { id: 'guide', nameAr: 'دليل سياحي مرافق', nameEn: 'Accompanying Tour Guide', price: 3, isPrimary: false, icon: 'guide', perBooking: true },
    ];
  };

  const [selectedServices, setSelectedServices] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (selectedItem) {
      const services = getServicesForItem(selectedItem.item);
      const initial: { [key: string]: boolean } = {};
      services.forEach(s => {
        if (s.isPrimary) {
          initial[s.id] = true;
        } else {
          initial[s.id] = false;
        }
      });
      setSelectedServices(initial);
    }
  }, [selectedItem]);

  // Payment Flow State
  const [paymentMethod, setPaymentMethod] = useState<'CliQ' | 'eFAWATEERcom' | 'Visa' | 'MasterCard' | 'Cash at Office'>('CliQ');
  const [cliqAlias, setCliqAlias] = useState('');
  const [efawateerNo, setEfawateerNo] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'documents' | 'payment' | 'success'>('details');
  const [travelerDocs, setTravelerDocs] = useState<{
    fullName: string;
    tripType: 'domestic' | 'international';
    nationalId: string;
    idPhoto: string;
    idPhotoName: string;
    idPhotoBack?: string;
    idPhotoBackName?: string;
    passportNumber: string;
    passportExpiry: string;
    nationality: string;
    passportPhoto: string;
    passportPhotoName: string;
    customAnswer: string;
    showPassport?: boolean;
  }[]>([]);
  const [docUploadProgress, setDocUploadProgress] = useState<{ [key: string]: boolean }>({});

  const handleTravelerDocUpload = (index: number, field: 'idPhoto' | 'idPhotoBack' | 'passportPhoto', file: File | null) => {
    if (!file) return;
    const progressKey = `${index}-${field}`;
    setDocUploadProgress(prev => ({ ...prev, [progressKey]: true }));
    
    // Simulate upload delay
    setTimeout(() => {
      setTravelerDocs(prev => {
        const copy = [...prev];
        if (copy[index]) {
          if (field === 'idPhoto') {
            copy[index].idPhoto = '#';
            copy[index].idPhotoName = file.name;
          } else if (field === 'idPhotoBack') {
            copy[index].idPhotoBack = '#';
            copy[index].idPhotoBackName = file.name;
          } else {
            copy[index].passportPhoto = '#';
            copy[index].passportPhotoName = file.name;
          }
        }
        return copy;
      });
      setDocUploadProgress(prev => ({ ...prev, [progressKey]: false }));
    }, 850);
  };

  const handleProceedToDocuments = () => {
    // Determine default tripType based on selectedItem
    let defaultType: 'domestic' | 'international' = 'domestic';
    if (selectedItem) {
      if (selectedItem.type === 'intl_trip' || selectedItem.type === 'visa') {
        defaultType = 'international';
      } else if (selectedItem.type === 'trip' && selectedItem.item.type === 'international') {
        defaultType = 'international';
      }
    }

    const list = [];
    for (let i = 0; i < bookingQuantity; i++) {
      list.push({
        fullName: i === 0 ? (tempTravelerName || traveler.fullName) : '',
        tripType: defaultType,
        nationalId: '',
        idPhoto: '',
        idPhotoName: '',
        idPhotoBack: '',
        idPhotoBackName: '',
        passportNumber: '',
        passportExpiry: '',
        nationality: language === 'ar' ? 'أردني' : 'Jordanian',
        passportPhoto: '',
        passportPhotoName: '',
        customAnswer: '',
        showPassport: false,
      });
    }
    setTravelerDocs(list);
    setCheckoutStep('documents');
  };
  const [activeBookingSuccess, setActiveBookingSuccess] = useState<Booking | null>(null);

  // Chat State
  const [chatMessage, setChatMessage] = useState('');

  // Category Icon & Details Map
  const categories: { id: ServiceType | 'offers'; labelKey: string; icon: any; descEn: string; descAr: string }[] = [
    { id: 'trip', labelKey: 'cat.domestic_trips', icon: Compass, descEn: 'Tours in Jordan', descAr: 'رحلات سياحية أردنية' },
    { id: 'intl_trip', labelKey: 'cat.intl_trips', icon: Globe, descEn: 'International tours', descAr: 'رحلات سياحية خارجية' },
    { id: 'hotel', labelKey: 'cat.hotels', icon: MapPin, descEn: 'Luxury hotels & resorts', descAr: 'حجز فنادق ومنتجعات' },
    { id: 'car', labelKey: 'cat.car_rental', icon: Car, descEn: 'Car rental services', descAr: 'تأجير سيارات سياحية' },
    { id: 'flight', labelKey: 'cat.flights', icon: Plane, descEn: 'Cheap flight booking', descAr: 'تذاكر طيران دولية' },
    { id: 'hajj_umrah', labelKey: 'cat.hajj_umrah', icon: ShieldCheck, descEn: 'Hajj & Umrah programs', descAr: 'حملات الحج والعمرة المعتمدة' },
    { id: 'bus_train', labelKey: 'cat.buses', icon: Ticket, descEn: 'Bus & train transportation', descAr: 'حافلات جت وقطارات سياحية' },
    { id: 'insurance', labelKey: 'cat.insurance', icon: Briefcase, descEn: 'Worldwide insurance policy', descAr: 'وثائق تأمين سفر سريعة' },
    { id: 'visa', labelKey: 'cat.visa_services', icon: Globe, descEn: 'Embassy visa support', descAr: 'استخراج تأشيرات سفر' },
    { id: 'consultation', labelKey: 'cat.consultation', icon: HelpCircle, descEn: 'Travel planning consult', descAr: 'استشارات وجداول سياحية' },
  ];

  // Fetch all listings for browsing
  const getFilteredItems = () => {
    let list: { type: ServiceType; item: any }[] = [];

    if (selectedCategory === 'all' || selectedCategory === 'trip') {
      tripsCatalog.forEach(t => {
        if (t.type === 'domestic') {
          list.push({ type: 'trip', item: t });
        }
      });
    }
    if (selectedCategory === 'all' || selectedCategory === 'intl_trip') {
      tripsCatalog.forEach(t => {
        if (t.type === 'international') {
          list.push({ type: 'intl_trip', item: t });
        }
      });
    }
    if (selectedCategory === 'all' || selectedCategory === 'hotel') {
      mockHotels.forEach(h => list.push({ type: 'hotel', item: h }));
    }
    if (selectedCategory === 'all' || selectedCategory === 'car') {
      mockCars.forEach(c => list.push({ type: 'car', item: c }));
    }
    if (selectedCategory === 'all' || selectedCategory === 'flight') {
      mockFlights.forEach(f => list.push({ type: 'flight', item: f }));
    }
    if (selectedCategory === 'all' || selectedCategory === 'bus_train') {
      mockBusesTrains.forEach(b => list.push({ type: 'bus_train', item: b }));
    }
    if (selectedCategory === 'all' || selectedCategory === 'hajj_umrah') {
      hajjUmrahCatalog.forEach(hu => list.push({ type: 'hajj_umrah', item: hu }));
    }
    if (selectedCategory === 'all' || selectedCategory === 'insurance') {
      mockInsurance.forEach(i => list.push({ type: 'insurance', item: i }));
    }
    if (selectedCategory === 'all' || selectedCategory === 'visa') {
      mockVisa.forEach(v => list.push({ type: 'visa', item: v }));
    }
    if (selectedCategory === 'all' || selectedCategory === 'consultation') {
      mockConsultations.forEach(c => list.push({ type: 'consultation', item: c }));
    }

    // Apply Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        i =>
          i.item.title.toLowerCase().includes(q) ||
          (i.item.location && i.item.location.toLowerCase().includes(q)) ||
          i.item.description.toLowerCase().includes(q) ||
          i.item.officeName.toLowerCase().includes(q)
      );
    }

    // Apply Filters
    if (cityFilter.trim() !== '') {
      const cityQ = cityFilter.toLowerCase();
      list = list.filter(
        i =>
          (i.item.location && i.item.location.toLowerCase().includes(cityQ)) ||
          (i.item.city && i.item.city.toLowerCase().includes(cityQ))
      );
    }

    list = list.filter(i => i.item.price <= priceFilter);

    if (ratingFilter > 0) {
      list = list.filter(i => i.item.rating >= ratingFilter);
    }

    return list;
  };

  /*
  const handleApplyCoupon = () => {
    setCouponError('');
    const found = mockCoupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (!found) {
      setCouponError(language === 'ar' ? 'الكود غير صحيح أو منتهي الصلاحية' : 'Invalid or expired coupon code');
      setAppliedCoupon(null);
      return;
    }
    if (!found.isActive) {
      setCouponError(language === 'ar' ? 'هذا الكوبون غير نشط حالياً' : 'This coupon is inactive');
      setAppliedCoupon(null);
      return;
    }

    const currentPrice = calculateSubtotal();
    if (currentPrice < found.minBookingValue) {
      setCouponError(
        language === 'ar'
          ? `الحد الأدنى لاستخدام الكود هو ${found.minBookingValue} د.أ`
          : `Minimum booking value is ${found.minBookingValue} JOD`
      );
      setAppliedCoupon(null);
      return;
    }

    const discountAmount = Math.min((currentPrice * found.discountPercentage) / 100, found.maxDiscount);
    setAppliedCoupon({
      code: found.code,
      percent: found.discountPercentage,
      discount: discountAmount,
    });
  };
  */

  const calculateSubtotal = () => {
    if (!selectedItem) return 0;
    const item = selectedItem.item;
    let basePrice = item.price;

    if (selectedItem.type === 'hotel' && selectedRoomType) {
      const room = item.rooms.find((r: any) => r.type === selectedRoomType);
      if (room) basePrice = room.price;
    }

    let extraPricePerPerson = 0;
    let extraPriceFixed = 0;
    if (selectedItem.type === 'trip' || selectedItem.type === 'intl_trip' || selectedItem.type === 'hajj_umrah') {
      const services = getServicesForItem(item);
      services.forEach(srv => {
        if (!srv.isPrimary && selectedServices[srv.id]) {
          if (srv.perBooking) {
            extraPriceFixed += srv.price;
          } else {
            extraPricePerPerson += srv.price;
          }
        }
      });
    }

    return (basePrice + extraPricePerPerson) * bookingQuantity + extraPriceFixed;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = 0; // appliedCoupon ? appliedCoupon.discount : 0;
    return Math.max(subtotal - discount, 0);
  };

  // Document Upload Mock
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      setTimeout(() => {
        setVisaUploadedDocs([...visaUploadedDocs, { name: file.name, url: '#' }]);
        setIsUploading(false);
      }, 1000);
    }
  };

  // Submit Booking
  const handleConfirmBooking = async () => {
    if (!selectedItem) return;

    // Quota validation checks to prevent double booking
    const item = selectedItem.item;
    if ((selectedItem.type === 'trip' || selectedItem.type === 'intl_trip') && item.seatsRemaining < bookingQuantity) {
      alert(language === 'ar' ? 'المقاعد المتبقية غير كافية لطلبك!' : 'Not enough seats remaining!');
      return;
    }
    if (selectedItem.type === 'hajj_umrah' && item.seatsRemaining < bookingQuantity) {
      alert(language === 'ar' ? 'المقاعد المتبقية لحصة وزارة الأوقاف غير كافية!' : 'Official quota limit reached!');
      return;
    }

    // Prepare booking details
    const finalPrice = calculateTotal();
    const bookingDetailsRecord: Record<string, any> = {
      quantity: bookingQuantity,
      date: bookingDate,
      travelerDocs: travelerDocs, // Save the traveler documents entered in the new step
      selectedServices: selectedServices, // Save user selected options
    };

    if (selectedItem.type === 'hotel') {
      bookingDetailsRecord.roomType = selectedRoomType || item.rooms[0].type;
    }
    if (selectedItem.type === 'flight') {
      bookingDetailsRecord.cabinClass = flightCabinClass;
    }
    if (selectedItem.type === 'visa') {
      bookingDetailsRecord.uploadedDocuments = visaUploadedDocs;
    }

    // Combine documents for the booking object representation
    const docList = selectedItem.type === 'visa' ? [...visaUploadedDocs] : [];
    travelerDocs.forEach(tDoc => {
      if (tDoc.idPhotoName && tDoc.idPhoto) {
        docList.push({ name: `${tDoc.fullName} - ID Front: ${tDoc.idPhotoName}`, url: tDoc.idPhoto });
      }
      if (tDoc.idPhotoBackName && tDoc.idPhotoBack) {
        docList.push({ name: `${tDoc.fullName} - ID Back: ${tDoc.idPhotoBackName}`, url: tDoc.idPhotoBack });
      }
      if (tDoc.passportPhotoName && tDoc.passportPhoto) {
        docList.push({ name: `${tDoc.fullName} - Passport: ${tDoc.passportPhotoName}`, url: tDoc.passportPhoto });
      }
    });

    const newBooking: Booking = {
      id: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
      serviceType: selectedItem.type,
      serviceId: item.id,
      serviceName: item.title,
      officeId: item.officeId,
      officeName: item.officeName,
      travelerId: traveler.id,
      travelerName: traveler.fullName,
      travelerPhone: traveler.phone,
      bookingDetails: bookingDetailsRecord,
      totalPrice: finalPrice,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'Cash at Office' ? 'unpaid' : 'paid',
      status: paymentMethod === 'Cash at Office' ? 'Pending' : 'Confirmed',
      qrCode: `SAFR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      chatHistory: [
        {
          sender: 'office',
          message:
            language === 'ar'
              ? `أهلاً بك يا ${traveler.fullName}. لقد تم استلام طلب الحجز الخاص بك لخدمة (${item.title}) وسنقوم بمراجعته فوراً.`
              : `Hello ${traveler.fullName}, we have received your booking request for (${item.title}) and are processing it.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      documents: docList,
    };

    setIsUploading(true);
    try {
      // Execute transaction to prevent race conditions on seats
      await bookServiceSeats(
        newBooking,
        item.id,
        selectedItem.type,
        bookingQuantity,
        item.seatsRemaining,
        item.title
      );

      // Deduct remaining seats locally to update state and catalogs
      if (selectedItem.type === 'trip' || selectedItem.type === 'intl_trip') {
        item.seatsRemaining -= bookingQuantity;
        setTripsCatalog(prev => prev.map(t => t.id === item.id ? { ...t, seatsRemaining: t.seatsRemaining - bookingQuantity } : t));
      }
      if (selectedItem.type === 'hajj_umrah') {
        item.seatsRemaining -= bookingQuantity;
        setHajjUmrahCatalog(prev => prev.map(hu => hu.id === item.id ? { ...hu, seatsRemaining: hu.seatsRemaining - bookingQuantity } : hu));
      }

      // Sync local bookings state
      const updatedBookings = [newBooking, ...bookings];
      setBookings(updatedBookings);
      
      // Dispatch notification for new booking
      window.dispatchEvent(new CustomEvent('addNotification', {
        detail: {
          id: Date.now(),
          type: 'BOOKING_CONFIRMED',
          bookingId: newBooking.id,
          titleAr: 'تم تسجيل طلب الحجز بنجاح',
          titleEn: 'Booking Request Registered',
          descAr: paymentMethod === 'Cash at Office' 
            ? `لقد تم تسجيل طلب الحجز للخدمة (${newBooking.serviceName}) وهو بانتظار الدفع النقدي في مكتب ${newBooking.officeName}.` 
            : `تهانينا! تم تأكيد حجزك للخدمة (${newBooking.serviceName}) عبر البطاقة.`,
          descEn: paymentMethod === 'Cash at Office'
            ? `Your booking for (${newBooking.serviceName}) is registered and waiting for cash payment at ${newBooking.officeName}.`
            : `Congratulations! Your booking for (${newBooking.serviceName}) is confirmed via Card.`,
          timeAr: 'الآن',
          timeEn: 'Just now',
          read: false,
          requiresAction: false
        }
      }));

      setActiveBookingSuccess(newBooking);
      setCheckoutStep('success');
    } catch (error: any) {
      if (error && error.message === 'NOT_ENOUGH_SEATS') {
        alert(language === 'ar'
          ? 'عذراً، لقد نفدت المقاعد المتاحة لهذه الرحلة للتو بسبب حجز آخر متزامن!'
          : 'Sorry, the seats for this trip have just run out due to a simultaneous booking!'
        );
      } else {
        console.error("Booking transaction error: ", error);
        alert(language === 'ar' ? 'فشل إتمام الحجز، الرجاء المحاولة مرة أخرى.' : 'Booking failed, please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim() || !activeChatBooking) return;

    const updatedBooking = { ...activeChatBooking };
    const userMsg = {
      sender: 'traveler' as const,
      message: chatMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    updatedBooking.chatHistory = [...updatedBooking.chatHistory, userMsg];

    // Update global state
    setBookings(bookings.map(b => (b.id === updatedBooking.id ? updatedBooking : b)));
    setActiveChatBooking(updatedBooking);
    setChatMessage('');

    // Trigger dynamic simulation of travel agency responding
    setTimeout(() => {
      const repliesEn = [
        "Thank you! Your inquiry is being handled by our ticketing officer.",
        "We have verified your details, everything looks excellent.",
        "An official agent will reach out to you via phone in a few minutes.",
        "Documents received. The digital policy or visa draft is being processed.",
      ];
      const repliesAr = [
        "شكراً لك! تم استلام رسالتك وجاري مراجعة طلبك من قبل موظف الحجوزات المختص.",
        "تم تدقيق المستندات المرفقة، جميع البيانات صحيحة ومطابقة.",
        "سيقوم أحد وكلائنا السياحيين بالاتصال بك هاتفياً للتنسيق النهائي خلال دقائق.",
        "وصلتنا رسالتك، تم تأكيد إصدار وثيقتك الرقمية وستظهر في صفحة الحجز.",
      ];
      const randomReply =
        language === 'ar'
          ? repliesAr[Math.floor(Math.random() * repliesAr.length)]
          : repliesEn[Math.floor(Math.random() * repliesEn.length)];

      const officeMsg = {
        sender: 'office' as const,
        message: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalBooking = {
        ...updatedBooking,
        chatHistory: [...updatedBooking.chatHistory, officeMsg],
      };

      setBookings(bookings.map(b => (b.id === finalBooking.id ? finalBooking : b)));
      if (activeChatBooking && activeChatBooking.id === finalBooking.id) {
        setActiveChatBooking(finalBooking);
      }
    }, 2000);
  };

  const officeTrips = selectedOfficeProfile ? tripsCatalog.filter(t => t.officeId === selectedOfficeProfile.id) : [];

  const officeServices: { type: ServiceType; item: any }[] = [];
  if (selectedOfficeProfile) {
    mockHotels.filter(h => h.officeId === selectedOfficeProfile.id).forEach(item => officeServices.push({ type: 'hotel', item }));
    mockCars.filter(c => c.officeId === selectedOfficeProfile.id).forEach(item => officeServices.push({ type: 'car', item }));
    mockFlights.filter(f => f.officeId === selectedOfficeProfile.id).forEach(item => officeServices.push({ type: 'flight', item }));
  }

  const bio = selectedOfficeProfile ? (language === 'ar' ? officeBios[selectedOfficeProfile.id]?.ar : officeBios[selectedOfficeProfile.id]?.en) : '';
  const username = selectedOfficeProfile ? (officeUsernames[selectedOfficeProfile.id] || `@office_${selectedOfficeProfile.id}`) : '';

  const getOfficeLogo = (officeId: string) => {
    switch (officeId) {
      case 'OFC-Dallas_Amman': return <Award className="w-4 h-4 text-amber-400" />;
      case 'OFC-JETT_Amman': return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'OFC-Plaza_Amman': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'OFC-AlBarakah_Amman': return <Moon className="w-4 h-4 text-yellow-400" />;
      case 'OFC-JordanHorizons_Aqaba': return <Map className="w-4 h-4 text-blue-400" />;
      default: return <Briefcase className="w-4 h-4 text-gray-400" />;
    }
  };

  const officeLogoImages: Record<string, string> = {
    'OFC-Dallas_Amman': 'https://images.unsplash.com/photo-1599740831146-818456b2af32?auto=format&fit=crop&w=400&h=400&q=80', // Premium Royal Gold Crown on dark black background
    'OFC-JETT_Amman': 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=400&h=400&q=80', // Emerald luxury abstract brand design
    'OFC-Plaza_Amman': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&h=400&q=80', // Stunning tropical paradise oasis palm logo
    'OFC-AlBarakah_Amman': 'https://images.unsplash.com/photo-1580974852861-718151304914?auto=format&fit=crop&w=400&h=400&q=80', // Islamic/Barakah elegant gold patterns
    'OFC-JordanHorizons_Aqaba': 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=400&h=400&q=80', // Global Horizons travel compass logo
  };

  const renderOfficeProfilePic = (office: TravelOffice) => {
    const logoUrl = officeLogoImages[office.id] || 'https://images.unsplash.com/photo-1599740831146-818456b2af32?auto=format&fit=crop&w=400&h=400&q=80';
    
    // Choose high-end borders matching each brand theme
    let borderStyle = "border-[#dcb33b]/40";
    if (office.id === 'OFC-JETT_Amman') borderStyle = "border-emerald-500/40";
    if (office.id === 'OFC-Plaza_Amman') borderStyle = "border-purple-500/40";
    if (office.id === 'OFC-AlBarakah_Amman') borderStyle = "border-amber-600/40";
    if (office.id === 'OFC-JordanHorizons_Aqaba') borderStyle = "border-blue-500/40";

    return (
      <div className={`w-[130px] h-[130px] rounded-[28px] border-4 ${borderStyle} bg-[#0b1d16] flex items-center justify-center shadow-2xl relative overflow-hidden group`}>
        <img 
          src={logoUrl} 
          alt={office.name} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        {/* Sleek luxury gradient overlay and inner premium border */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />
        <div className="absolute inset-1.5 border border-white/15 rounded-[22px] pointer-events-none" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A211A] text-gray-100 flex flex-col font-sans relative" dir={dir}>
      <div className="lattice" />
      {/* Traveler Header */}
      <header className="sticky top-0 z-50 bg-[#123329] border-b border-[#173B2F] px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between">
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
            <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-[#123329] border border-[#C9A227]/30 rounded-full flex items-center justify-center shadow-md select-none z-10">
              <span className="text-[7px] font-bold text-[#C9A227] leading-none select-none">JO</span>
            </div>
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-[#C9A227]">
              {t('app.name')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#173B2F] hover:bg-[#0E4B2E] text-xs transition font-medium"
            id="lang-toggle-btn"
          >
            <Globe className="w-3.5 h-3.5 text-[#C9A227]/90" />
            <span>{language === 'en' ? 'عربي' : 'انجليزي'}</span>
          </button>

          {/* Golden Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  // Mark notifications as read when opening
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }
              }}
              className="relative p-2 rounded-lg border border-[#173B2F] hover:bg-[#0E4B2E] text-xs transition font-medium text-[#C9A227] flex items-center justify-center cursor-pointer"
              title={language === 'ar' ? 'الإشعارات' : 'Notifications'}
            >
              <Bell className="w-4 h-4 text-[#C9A227]" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed md:absolute top-16 left-4 right-4 md:top-auto md:left-auto md:right-0 md:rtl:right-auto md:rtl:left-0 md:w-80 mt-2 bg-[#123329] border border-[#C9A227]/30 rounded-2xl p-4 shadow-2xl z-50 text-left rtl:text-right"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#173B2F] mb-3">
                      <h4 className="text-xs font-bold text-[#C9A227] flex items-center gap-1">
                        <Bell className="w-3.5 h-3.5 text-[#C9A227]" />
                        <span>{language === 'ar' ? 'مركز الإشعارات' : 'Notifications'}</span>
                      </h4>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">
                          {language === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
                        </p>
                      ) : (
                        notifications.map(n => {
                          const nBooking = n.bookingId ? bookings.find(b => b.id === n.bookingId) : null;
                          return (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-2.5 rounded-xl border cursor-pointer hover:bg-[#1A4234] transition-colors ${n.read ? 'border-[#173B2F] bg-[#0A211A]/40' : 'border-[#C9A227]/50 bg-[#123329] hover:border-[#C9A227]'} text-xs`}
                            >
                              {nBooking && (
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#173B2F]/50">
                                  <img 
                                    src={officeLogoImages[nBooking.officeId] || 'https://images.unsplash.com/photo-1599740831146-818456b2af32?auto=format&fit=crop&w=100&h=100&q=80'} 
                                    className="w-6 h-6 rounded-full object-cover border border-[#C9A227]/30"
                                    alt={nBooking.officeName}
                                  />
                                  <span className="font-bold text-[10px] text-[#C9A227]">{nBooking.officeName}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`font-bold ${n.read ? 'text-gray-100' : 'text-white'}`}>
                                  {language === 'ar' ? n.titleAr : n.titleEn}
                                  {!n.read && <span className="ml-2 inline-block w-1.5 h-1.5 bg-[#C9A227] rounded-full"></span>}
                                </span>
                                <span className="text-[10px] text-[#9DB3A8] font-mono whitespace-nowrap">
                                  {language === 'ar' ? n.timeAr : n.timeEn}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-300 leading-relaxed">
                                {language === 'ar' ? n.descAr : n.descEn}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div
            onClick={() => {
              setActiveTab('account');
              setSelectedItem(null);
              setIsBookingMode(false);
            }}
            className="flex items-center gap-2 border-l border-[#173B2F] pl-3 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-3 cursor-pointer hover:opacity-85 transition"
            title={language === 'ar' ? 'حسابي' : 'My Account'}
          >
            {(() => {
              const theme = getTravelerAvatarTheme(traveler.fullName);
              return (
                <div className={`w-8 h-8 rounded-full ${theme.miniBg} border ${theme.border} flex items-center justify-center font-bold text-xs ${theme.miniText}`}>
                  {traveler.fullName.charAt(0)}
                </div>
              );
            })()}
            <span className="text-xs font-semibold hidden md:inline text-emerald-100">{traveler.fullName}</span>
          </div>
        </div>
      </header>

      {/* Main Content & Sidebar Router */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6 md:gap-8 pb-24 md:pb-8">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col gap-2 w-64 shrink-0 bg-[#123329] border border-[#173B2F] rounded-2xl p-4 self-start">
          <div className="pb-3 border-b border-[#173B2F]">
            <span className="text-xs font-mono text-emerald-400 tracking-wider">WORKSPACE</span>
            <h2 className="text-sm font-bold text-[#C9A227]/90">{t('role.traveler')}</h2>
          </div>
          <nav className="flex flex-col gap-1 mt-4">
            <button
              onClick={() => {
                setActiveTab('home');
                setSelectedItem(null);
                setIsBookingMode(false);
                setSelectedOfficeProfile(null);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'home' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{t('nav.home')}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('services');
                setSelectedItem(null);
                setIsBookingMode(false);
                setSelectedOfficeProfile(null);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'services' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{t('nav.services')}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('bookings');
                setSelectedItem(null);
                setIsBookingMode(false);
                setSelectedOfficeProfile(null);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'bookings' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>{t('nav.bookings')}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('account');
                setSelectedItem(null);
                setIsBookingMode(false);
                setSelectedOfficeProfile(null);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'account' ? 'bg-[#C9A227] text-[#0A211A]' : 'text-gray-300 hover:bg-[#0E4B2E]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('nav.account')}</span>
            </button>
          </nav>

          <div className="mt-8 border-t border-[#173B2F] pt-4 flex flex-col gap-2">
            <div className="text-xs text-gray-400 p-2 bg-[#0E4B2E]/40 rounded-lg">
              <p className="font-semibold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Local Currency</span>
              </p>
              <p className="text-[11px] mt-0.5">Jordanian Dinar (JOD) is the primary trading currency.</p>
            </div>
            <button
              onClick={onLogout}
              className="mt-4 w-full text-center py-2 bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-950/80 rounded-xl text-xs transition"
            >
              {t('btn.logout')}
            </button>
          </div>
        </aside>

        {/* Dynamic Display Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* ITEM DETAILS PAGE */}
            {selectedItem && !isBookingMode && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-[#123329] border border-[#173B2F] rounded-3xl p-6 sm:p-8 md:p-10"
              >
                {/* Back button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="mb-4 inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-white"
                >
                  <ArrowRight className="w-4 h-4 rotate-180 rtl:rotate-0" />
                  <span>{t('btn.back')}</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Photo & Fav */}
                  <div className="relative">
                    <img
                      src={selectedItem.item.image}
                      alt={selectedItem.item.title}
                      className="w-full h-80 object-cover rounded-2xl border border-[#173B2F]"
                    />

                    <div className="absolute bottom-4 left-4 bg-[#C9A227] text-black px-3 py-1 rounded-lg text-xs font-bold shadow">
                      {selectedItem.item.price} {t('common.jod')}
                    </div>
                  </div>

                  {/* Core details info */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#C9A227]/20 text-[#C9A227]/90 border border-[#C9A227]/30 font-medium">
                          {selectedItem.type.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-[#C9A227] text-[#C9A227]" />
                          <span className="text-xs font-semibold">{selectedItem.item.rating}</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold font-serif mt-3 text-white">{tf(selectedItem.item.title)}</h3>

                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{tf(selectedItem.item.location || selectedItem.item.city || 'Jordan')}</span>
                      </p>

                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                        <span>{language === 'ar' ? 'الوكالة:' : 'Agency:'} <span className="text-[#C9A227]/90 font-semibold">{tf(selectedItem.item.officeName)}</span></span>
                        <span className="text-[10px] font-mono text-gray-400 ml-2 bg-[#173B2F]/40 px-1.5 py-0.5 rounded border border-[#173B2F]/60">ID: {selectedItem.item.officeId}</span>
                      </p>

                      <p className="text-sm text-gray-300 mt-4 leading-relaxed">{tf(selectedItem.item.description)}</p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-[#173B2F]">
                      {/* Booking Actions */}
                      <button
                        onClick={() => {
                          setIsBookingMode(true);
                          setCheckoutStep('details');
                          // setAppliedCoupon(null);
                          // setCouponCode('');
                        }}
                        className="w-full py-4 bg-gradient-to-r from-[#C9A227] to-yellow-600 hover:from-[#C9A227]/90 hover:to-[#C9A227] text-[#0A211A] font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{t('btn.book_now')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Specific features depending on service type */}
                <div className="mt-8 border-t border-[#173B2F] pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-[#C9A227]/90 text-sm mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#C9A227]" />
                      <span>{language === 'ar' ? 'المواصفات والمشمولات' : 'Specifications & Inclusions'}</span>
                    </h4>
                    {(selectedItem.type === 'trip' || selectedItem.type === 'intl_trip') && (
                      <ul className="space-y-2 text-xs text-gray-300">
                        {selectedItem.item.included.map((inc: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{translateSpec(inc)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {selectedItem.type === 'hotel' && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {selectedItem.item.amenities.map((am: string, idx: number) => (
                            <span key={idx} className="text-[10px] px-2 py-1 bg-[#0E4B2E] border border-[#173B2F] rounded text-emerald-300 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current text-amber-400" />
                              <span>{translateSpec(am)}</span>
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 italic flex items-center gap-1">
                          <span>{language === 'ar' ? 'تصنيف الفندق:' : 'Stars:'} {selectedItem.item.stars}</span>
                          <Star className="w-3.5 h-3.5 fill-[#C9A227] text-[#C9A227]" />
                          <span>{language === 'ar' ? 'نجوم' : 'Rating'}</span>
                        </p>
                      </div>
                    )}
                    {selectedItem.type === 'car' && (
                      <ul className="space-y-1.5 text-xs text-gray-300">
                        <li>• {language === 'ar' ? 'ناقل الحركة:' : 'Transmission:'} {translateSpec(selectedItem.item.transmission)}</li>
                        <li>• {language === 'ar' ? 'نوع السيارة:' : 'Car Type:'} {translateSpec(selectedItem.item.carType)}</li>
                        <li>• {language === 'ar' ? 'سعة المقاعد:' : 'Seats Capacity:'} {selectedItem.item.capacity} {language === 'ar' ? 'أشخاص' : 'Persons'}</li>
                        <li>• {language === 'ar' ? 'الشركة المصنعة:' : 'Brand:'} {translateSpec(selectedItem.item.company)}</li>
                      </ul>
                    )}
                    {selectedItem.type === 'hajj_umrah' && (
                      <div className="space-y-2 text-xs text-gray-300">
                        <p className="flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
                          <span><strong>{language === 'ar' ? 'فندق مكة:' : 'Makkah Hotel:'}</strong> {translateSpec(selectedItem.item.hotelMakkah)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
                          <span><strong>{language === 'ar' ? 'فندق المدينة:' : 'Madinah Hotel:'}</strong> {translateSpec(selectedItem.item.hotelMadinah)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span><strong>{language === 'ar' ? 'تفاصيل السفر:' : 'Travel info:'}</strong> {translateSpec(selectedItem.item.includedFlights)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span><strong>{language === 'ar' ? 'المرشد / المشرف:' : 'Guide/Supervisor:'}</strong> {translateSpec(selectedItem.item.supervisorName)}</span>
                        </p>
                      </div>
                    )}
                    {selectedItem.type === 'flight' && (
                      <div className="space-y-2 text-xs text-gray-300">
                        <p className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-emerald-400 shrink-0 rotate-45" />
                          <span><strong>{language === 'ar' ? 'من:' : 'Origin:'}</strong> {translateSpec(selectedItem.item.from)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-emerald-400 shrink-0 -rotate-45" />
                          <span><strong>{language === 'ar' ? 'إلى:' : 'Destination:'}</strong> {translateSpec(selectedItem.item.to)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span><strong>{language === 'ar' ? 'طيران:' : 'Airline:'}</strong> {translateSpec(selectedItem.item.airline)}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span><strong>{language === 'ar' ? 'درجة السفر:' : 'Cabin Class:'}</strong> {translateSpec(selectedItem.item.cabinClass)}</span>
                        </p>
                      </div>
                    )}
                    {selectedItem.type === 'visa' && (
                      <div className="space-y-2 text-xs text-gray-300">
                        <p className="font-semibold text-emerald-400">
                          {language === 'ar' ? 'متطلبات السفارة:' : 'Embassy Requirements:'}
                        </p>
                        {selectedItem.item.requirements.map((req: string, idx: number) => (
                          <p key={idx}>- {translateSpec(req)}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Terms & Policies */}
                  <div>
                    <h4 className="font-bold text-[#C9A227]/90 text-sm mb-3 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-[#C9A227]" />
                      <span>{language === 'ar' ? 'الشروط والإلغاء' : 'Terms & Cancellation'}</span>
                    </h4>
                    <div className="p-4 bg-[#0E4B2E]/40 border border-[#173B2F] rounded-xl text-xs text-gray-300 space-y-2">
                      <p><strong>{language === 'ar' ? 'سياسة الإلغاء:' : 'Policy:'}</strong> {translatePolicyOrTerms(selectedItem.item.cancellationPolicy || 'Subject to travel office approvals.')}</p>
                      <p><strong>{language === 'ar' ? 'الإرشادات والتعليمات:' : 'Guideline:'}</strong> {translatePolicyOrTerms(selectedItem.item.terms || 'Valid Jordanian National ID or Passport matching booking names required upon pickup/boarding.')}</p>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-8 border-t border-[#173B2F] pt-6">
                  <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-[#C9A227] text-[#C9A227]" />
                    <span>{language === 'ar' ? 'تقييمات المسافرين' : 'Traveler Reviews'} ({mockReviews.filter(r => r.serviceId === selectedItem.item.id).length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockReviews.filter(r => r.serviceId === selectedItem.item.id).map(r => (
                      <div key={r.id} className="p-4 bg-[#0E4B2E]/30 border border-[#173B2F] rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-[#C9A227]/90">{r.travelerName}</span>
                          <span className="text-[10px] text-gray-400">{r.date}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-[#C9A227] text-[#C9A227]' : 'text-gray-600'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{r.comment}</p>
                      </div>
                    ))}
                    {mockReviews.filter(r => r.serviceId === selectedItem.item.id).length === 0 && (
                      <p className="text-xs text-gray-400 italic">
                        {language === 'ar' 
                          ? 'لا توجد تقييمات لهذا العرض بعد. كن أول من يحجز ويقيم!' 
                          : 'No reviews yet for this listing. Be the first to book and rate!'}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* BOOKING FLOW CONTAINER */}
            {selectedItem && isBookingMode && (
              <motion.div
                key="booking-flow"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#123329] border border-[#173B2F] rounded-3xl p-6 sm:p-8 md:p-10"
              >
                {/* Steps Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#173B2F]">
                  <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                    <Ticket className="text-[#C9A227]/90 w-5 h-5" />
                    <span>Secure Reservation Process</span>
                  </h3>
                  <button
                    onClick={() => setIsBookingMode(false)}
                    className="p-1.5 rounded-lg bg-[#0E4B2E] border border-[#173B2F] text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {checkoutStep === 'details' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-[#0E4B2E]/40 border border-[#173B2F] rounded-xl flex gap-4">
                      <img src={selectedItem.item.image} className="w-20 h-20 object-cover rounded-lg" alt="" />
                      <div>
                        <h4 className="font-bold text-sm text-white">{tf(selectedItem.item.title)}</h4>
                        <p className="text-xs text-[#C9A227]/90 mt-1">{selectedItem.item.price} JOD / person</p>
                        <p className="text-xs text-gray-400 mt-0.5">{tf(selectedItem.item.officeName)} • <span className="font-mono text-[10px]">ID: {selectedItem.item.officeId}</span></p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Booking specifics */}
                      <div className="space-y-4">
                        {/* Trip Details Box (shown above available dates) */}
                        {(selectedItem.type === 'trip' || selectedItem.type === 'intl_trip' || selectedItem.type === 'hajj_umrah') && (
                          <div className="p-4 bg-[#0A211A] border border-[#173B2F] rounded-xl space-y-3.5">
                            <div>
                              <span className="text-[10px] font-bold tracking-wider text-[#C9A227] uppercase">
                                {language === 'ar' ? 'تفاصيل وبرنامج الرحلة' : 'Trip Details & Program'}
                              </span>
                              <p className="text-xs text-gray-200 leading-relaxed font-sans mt-1">
                                {tf(selectedItem.item.description)}
                              </p>
                              {selectedItem.item.duration && (
                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-1.5">
                                  <span>⏱️</span>
                                  <span>{language === 'ar' ? 'المدة:' : 'Duration:'} {tf(selectedItem.item.duration)}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="pt-2 border-t border-[#173B2F]/60">
                              <span className="text-[10px] text-gray-400 font-semibold block mb-1.5">
                                {language === 'ar' 
                                  ? 'مشتملات الرحلة / حدد الخدمات الإضافية التي تريدها:' 
                                  : 'Trip Inclusions / Select additional services you want:'}
                              </span>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {getServicesForItem(selectedItem.item).map((srv) => {
                                  const isSelected = srv.isPrimary || selectedServices[srv.id];
                                  return (
                                    <div
                                      key={srv.id}
                                      onClick={() => {
                                        if (srv.isPrimary) return;
                                        setSelectedServices(prev => ({
                                          ...prev,
                                          [srv.id]: !prev[srv.id]
                                        }));
                                      }}
                                      className={`p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                                        srv.isPrimary ? 'cursor-default' : 'cursor-pointer'
                                      } ${
                                        isSelected 
                                          ? 'bg-[#0E4B2E] border-[#C9A227]/40 text-white shadow-sm' 
                                          : 'bg-[#0E4B2E]/5 border-[#173B2F]/30 text-gray-400 opacity-40 hover:opacity-70'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="min-w-0">
                                          <p className={`text-[11px] font-semibold truncate ${isSelected ? 'text-gray-100' : 'text-gray-400'}`}>
                                            {language === 'ar' ? srv.nameAr : srv.nameEn}
                                          </p>
                                          <p className="text-[8.5px] text-gray-400 mt-0.5 leading-none">
                                            {srv.isPrimary 
                                              ? (language === 'ar' ? 'أساسي (مشمول)' : 'Primary (Core)') 
                                              : srv.perBooking
                                                ? `+${srv.price} JOD / ${language === 'ar' ? 'سعر ثابت للرحلة' : 'fixed for group'}`
                                                : `+${srv.price} JOD / ${language === 'ar' ? 'شخص' : 'person'}`}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="shrink-0 pl-1">
                                        {srv.isPrimary ? (
                                          <div className="w-3.5 h-3.5 rounded bg-[#C9A227] border border-[#C9A227] text-[#0A211A] flex items-center justify-center cursor-not-allowed" title={language === 'ar' ? 'أساسي لا يمكن إزالته' : 'Core service'}>
                                            <span className="text-[8px] font-extrabold">✓</span>
                                          </div>
                                        ) : (
                                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                            isSelected ? 'bg-[#C9A227] border-[#C9A227] text-[#0A211A]' : 'border-gray-600'
                                          }`}>
                                            {isSelected && <span className="text-[8px] font-extrabold">✓</span>}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        <label className="block text-xs font-semibold text-emerald-300">
                          {selectedItem.type === 'trip' || selectedItem.type === 'intl_trip' 
                            ? (language === 'ar' ? 'اختر تاريخ الرحلة المتاح' : 'Select Available Trip Date') 
                            : tf('Select Start Date / تاريخ البدء')}
                        </label>
                        {(selectedItem.type === 'trip' || selectedItem.type === 'intl_trip') ? (
                          <select
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full p-3 rounded-xl bg-[#0A211A] border border-[#173B2F] text-sm text-gray-100"
                          >
                            {selectedItem.item.availableDates && selectedItem.item.availableDates.length > 0 ? (
                              selectedItem.item.availableDates.map((dateStr: string) => (
                                <option key={dateStr} value={dateStr}>
                                  {dateStr}
                                </option>
                              ))
                            ) : (
                              <option value="2026-07-20">2026-07-20</option>
                            )}
                          </select>
                        ) : (
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full p-3 rounded-xl bg-[#0A211A] border border-[#173B2F] text-sm text-gray-100"
                          />
                        )}

                        {selectedItem.type === 'hotel' && (
                          <>
                            <label className="block text-xs font-semibold text-emerald-300">{tf('Room Type / فئة الغرفة')}</label>
                            <select
                              value={selectedRoomType}
                              onChange={(e) => setSelectedRoomType(e.target.value)}
                              className="w-full p-3 rounded-xl bg-[#0A211A] border border-[#173B2F] text-sm text-gray-100"
                            >
                              <option value="">{language === 'ar' ? '-- اختر فئة الغرفة --' : '-- Choose Room Type --'}</option>
                              {selectedItem.item.rooms.map((room: any, idx: number) => (
                                <option key={idx} value={room.type}>
                                  {tf(room.type)} ({room.price} JOD)
                                </option>
                              ))}
                            </select>
                          </>
                        )}

                        {selectedItem.type === 'flight' && (
                          <>
                            <label className="block text-xs font-semibold text-emerald-300">{tf('Cabin Class / درجة المقصورة')}</label>
                            <select
                              value={flightCabinClass}
                              onChange={(e) => setFlightCabinClass(e.target.value as any)}
                              className="w-full p-3 rounded-xl bg-[#0A211A] border border-[#173B2F] text-sm text-gray-100"
                            >
                              <option value="Economy">{tf('Economy / الدرجة السياحية')}</option>
                              <option value="Business">{tf('Business / درجة الأعمال')}</option>
                            </select>
                          </>
                        )}

                        {selectedItem.type === 'visa' && (
                          <div className="space-y-3 bg-[#0E4B2E]/30 p-4 border border-[#173B2F] rounded-xl">
                            <span className="text-xs font-bold text-[#C9A227]/90 flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'بوابة رفع المستندات' : 'Document Upload Area'}</span>
                            </span>
                            <p className="text-[10px] text-gray-400">{tf('Required: Passport scan + HR Letter / كشف راتب')}</p>
                            <div className="flex items-center gap-3">
                              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded bg-[#C9A227] text-[#0A211A] text-xs font-bold">
                                <Upload className="w-3.5 h-3.5" />
                                <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
                                <input type="file" onChange={handleDocUpload} className="hidden" disabled={isUploading} />
                              </label>
                            </div>
                            <div className="space-y-1.5 mt-2">
                              {visaUploadedDocs.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-[#0A211A] rounded border border-emerald-900">
                                  <span className="truncate max-w-[180px]">{doc.name}</span>
                                  <span className="text-[10px] text-emerald-400">Ready ✓</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-emerald-300 mb-1.5">
                            {tf('Number of Guests or Seats / العدد المطلوب')}
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setBookingQuantity(Math.max(1, bookingQuantity - 1))}
                              className="w-10 h-10 rounded-lg bg-[#0E4B2E] border border-[#173B2F] flex items-center justify-center text-lg font-bold"
                            >
                              -
                            </button>
                            <span className="text-base font-bold text-white w-8 text-center">{bookingQuantity}</span>
                            <button
                              onClick={() => setBookingQuantity(bookingQuantity + 1)}
                              className="w-10 h-10 rounded-lg bg-[#0E4B2E] border border-[#173B2F] flex items-center justify-center text-lg font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Pricing Summary */}
                      <div className="bg-[#0A211A] p-5 border border-[#173B2F] rounded-2xl flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-widest mb-4">
                            {t('book.summary')}
                          </h4>
                          <div className="space-y-3.5 text-xs text-gray-300">
                            <div className="flex justify-between">
                              <span>Unit Price</span>
                              <span>
                                {selectedItem.type === 'hotel' && selectedRoomType
                                  ? selectedItem.item.rooms.find((r: any) => r.type === selectedRoomType)?.price || selectedItem.item.price
                                  : selectedItem.item.price}{' '}
                                JOD
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Quantity</span>
                              <span>× {bookingQuantity}</span>
                            </div>

                            {/* Extra paid services additions */}
                            {(selectedItem.type === 'trip' || selectedItem.type === 'intl_trip' || selectedItem.type === 'hajj_umrah') && 
                              getServicesForItem(selectedItem.item).filter(s => !s.isPrimary && selectedServices[s.id]).map(s => (
                                <div key={s.id} className="flex justify-between text-[11px] text-[#C9A227] pl-2 border-l border-[#C9A227]/40">
                                  <span>+ {language === 'ar' ? s.nameAr : s.nameEn}</span>
                                  <span>
                                    {s.perBooking 
                                      ? `${s.price} JOD (${language === 'ar' ? 'سعر ثابت للرحلة' : 'Fixed group price'})` 
                                      : `${s.price * bookingQuantity} JOD (+${s.price} × {bookingQuantity})`
                                    }
                                  </span>
                                </div>
                              ))
                            }

                            <div className="flex justify-between pt-2 border-t border-emerald-950">
                              <span>Subtotal</span>
                              <span className="font-bold text-white">{calculateSubtotal()} JOD</span>
                            </div>

                            {/* Coupon field
                            <div className="pt-3">
                              <label className="block text-[10px] text-gray-400 mb-1">{tf('Coupon / كود خصم سياحي')}</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. SAFRETAK10"
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value)}
                                  className="flex-1 px-3 py-1.5 rounded bg-[#123329] border border-[#173B2F] text-xs font-mono uppercase text-white"
                                />
                                <button
                                  onClick={handleApplyCoupon}
                                  className="px-3 bg-emerald-800 text-xs font-bold rounded hover:bg-emerald-700 transition text-yellow-300"
                                >
                                  {t('btn.apply')}
                                </button>
                              </div>
                              {couponError && <p className="text-[10px] text-red-400 mt-1 font-mono">{couponError}</p>}
                              {appliedCoupon && (
                                <div className="flex items-center gap-1.5 mt-2 p-2 bg-emerald-950/80 rounded border border-emerald-900 text-[11px] text-emerald-300">
                                  <Percent className="w-3.5 h-3.5 text-[#C9A227]/90" />
                                  <span>
                                    Applied: <strong>{appliedCoupon.code}</strong> (-{appliedCoupon.percent}%) - Save {appliedCoupon.discount} JOD
                                  </span>
                                </div>
                              )}
                            </div>
                            */}
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[#173B2F]">
                          <div className="flex justify-between text-sm font-bold text-white mb-4">
                            <span>{t('book.total')}</span>
                            <span className="text-[#C9A227]/90 text-lg font-serif">
                              {calculateTotal()} {t('common.jod')}
                            </span>
                          </div>

                          <div className="flex items-start gap-2 text-[10px] text-gray-400 mb-4">
                            <input type="checkbox" defaultChecked className="mt-0.5" />
                            <span>{t('book.terms')}</span>
                          </div>

                          <button
                            onClick={handleProceedToDocuments}
                            className="w-full py-3.5 bg-[#C9A227] text-[#0A211A] hover:bg-[#C9A227]/90 font-bold rounded-xl transition text-xs"
                          >
                            {language === 'ar' ? 'إدخال وثائق وبيانات المسافرين ➔' : 'Enter Traveler Docs & Info ➔'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'documents' && (
                  <div className="space-y-6">
                    {/* Stepper Progress */}
                    <div className="flex items-center justify-between bg-[#0E4B2E]/30 p-3 rounded-xl border border-[#173B2F] text-xs">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-[#C9A227]" />
                        <span className="line-clamp-1">{language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}</span>
                      </div>
                      <div className="w-8 h-[1px] bg-emerald-900 shrink-0" />
                      <div className="flex items-center gap-1.5 text-[#C9A227] font-bold">
                        <div className="w-4 h-4 rounded-full bg-[#C9A227] text-[#0A211A] flex items-center justify-center font-bold text-[10px]">2</div>
                        <span className="line-clamp-1">{language === 'ar' ? 'وثائق المسافرين' : 'Traveler Docs'}</span>
                      </div>
                      <div className="w-8 h-[1px] bg-emerald-900 shrink-0" />
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-900 text-gray-500 flex items-center justify-center font-bold text-[10px]">3</div>
                        <span className="line-clamp-1">{language === 'ar' ? 'الدفع الآمن' : 'Secure Payment'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="text-[#C9A227]/90 w-4 h-4" />
                        <span>{language === 'ar' ? 'الوثائق والمعلومات المطلوبة للمكتب' : 'Required Documents & Traveler Info'}</span>
                      </h4>
                      <p className="text-xs text-gray-400">
                        {language === 'ar' 
                          ? 'يرجى تزويد المكتب بالبيانات والوثائق التالية لتأكيد حجزك وتجهيز تذاكرك/تأشيراتك.' 
                          : 'Please provide the office with the following details and documents to confirm your booking and issue tickets.'}
                      </p>
                    </div>

                    <div className="space-y-5 max-h-[480px] overflow-y-auto pr-1">
                      {travelerDocs.map((td, index) => {
                        const idUploadKey = `${index}-idPhoto`;
                        const idBackUploadKey = `${index}-idPhotoBack`;
                        const passportUploadKey = `${index}-passportPhoto`;
                        
                        return (
                          <div 
                            key={index} 
                            className="p-5 bg-[#0A211A]/60 border border-[#173B2F] rounded-2xl space-y-4 relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C9A227]/40 to-transparent" />
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
                              <span className="text-xs font-bold text-[#C9A227] flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                <span>{language === 'ar' ? `بيانات المسافر ${index + 1}` : `Traveler ${index + 1} Details`}</span>
                              </span>
                              <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900 text-emerald-400 font-mono">
                                Required / مطلوب
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Full Name */}
                              <div>
                                <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                  {language === 'ar' ? 'الاسم الكامل (كما في الوثيقة)' : 'Full Name (as in Document)'}
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder={language === 'ar' ? 'مثال: محمد أحمد علي' : 'e.g. John Doe'}
                                  value={td.fullName}
                                  onChange={(e) => {
                                    const copy = [...travelerDocs];
                                    copy[index].fullName = e.target.value;
                                    setTravelerDocs(copy);
                                  }}
                                  className="w-full px-3 py-2.5 rounded-xl bg-[#123329]/80 border border-[#173B2F] text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#C9A227]/40"
                                />
                              </div>

                              {/* Trip Type Selector */}
                              <div>
                                <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                  {language === 'ar' ? 'نوع الرحلة' : 'Trip Type'}
                                </label>
                                <select
                                  value={td.tripType}
                                  disabled
                                  className="w-full px-3 py-2.5 rounded-xl bg-[#123329]/80 border border-[#173B2F] text-xs text-gray-100 cursor-not-allowed opacity-75 focus:outline-none"
                                >
                                  <option value="domestic">{language === 'ar' ? 'رحلة داخلية' : 'Domestic Trip'}</option>
                                  <option value="international">{language === 'ar' ? 'رحلة خارجية / دولية' : 'International Trip'}</option>
                                </select>
                              </div>

                              {/* Transportation Method */}
                              <div>
                                <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                  {language === 'ar' ? 'طريقة النقل المعتمدة' : 'Approved Transportation Method'}
                                </label>
                                <select
                                  value={td.tripType === 'domestic' ? 'bus' : 'flight'}
                                  disabled
                                  className="w-full px-3 py-2.5 rounded-xl bg-[#123329]/80 border border-[#173B2F] text-xs text-gray-100 cursor-not-allowed opacity-75 focus:outline-none"
                                >
                                  <option value="bus">{language === 'ar' ? 'حافلة سياحية فاخرة (برّي)' : 'Luxury Tourist Bus (Land)'}</option>
                                  <option value="flight">{language === 'ar' ? 'طيران دولي (جوّي)' : 'International Flight (Air)'}</option>
                                </select>
                              </div>
                            </div>

                            {/* Conditionally render form fields based on tripType */}
                            {td.tripType === 'domestic' ? (
                              <div className="space-y-4 pt-1">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                  {/* National ID Number */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                      {language === 'ar' ? 'الرقم الوطني (10 خانات)' : 'National ID Number (10 digits)'}
                                    </label>
                                    <input
                                      type="text"
                                      maxLength={10}
                                      placeholder="99XXXXXXXX"
                                      value={td.nationalId}
                                      onChange={(e) => {
                                        const copy = [...travelerDocs];
                                        copy[index].nationalId = e.target.value.replace(/\D/g, '');
                                        setTravelerDocs(copy);
                                      }}
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#123329]/80 border border-[#173B2F] text-xs text-gray-100 placeholder:text-gray-600 font-mono tracking-wider focus:outline-none focus:border-[#C9A227]/40"
                                    />
                                  </div>

                                  {/* ID Photo Upload (Supports Two Files: Front & Back) */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                      {language === 'ar' ? 'صورة الهوية الشخصية (وجهين)' : 'ID Card Photo Scan (Both Sides)'}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                      {/* Front Side Upload */}
                                      <div className="flex items-center gap-2">
                                        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0E4B2E] border border-[#173B2F] text-gray-300 hover:text-white transition text-[11px] font-semibold flex-shrink-0">
                                          <Upload className="w-3.5 h-3.5 text-[#C9A227]" />
                                          <span>
                                            {docUploadProgress[idUploadKey] 
                                              ? (language === 'ar' ? 'جاري...' : 'Uploading...') 
                                              : (language === 'ar' ? 'الوجه الأمامي' : 'Front Side')}
                                          </span>
                                          <input 
                                            type="file" 
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleTravelerDocUpload(index, 'idPhoto', e.target.files?.[0] || null)}
                                            className="hidden" 
                                            disabled={docUploadProgress[idUploadKey]} 
                                          />
                                        </label>
                                        {td.idPhotoName && (
                                          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium truncate max-w-[120px]">
                                            <Check className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{td.idPhotoName}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Back Side Upload */}
                                      <div className="flex items-center gap-2">
                                        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0E4B2E] border border-[#173B2F] text-gray-300 hover:text-white transition text-[11px] font-semibold flex-shrink-0">
                                          <Upload className="w-3.5 h-3.5 text-[#C9A227]" />
                                          <span>
                                            {docUploadProgress[idBackUploadKey] 
                                              ? (language === 'ar' ? 'جاري...' : 'Uploading...') 
                                              : (language === 'ar' ? 'الوجه الخلفي' : 'Back Side')}
                                          </span>
                                          <input 
                                            type="file" 
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleTravelerDocUpload(index, 'idPhotoBack', e.target.files?.[0] || null)}
                                            className="hidden" 
                                            disabled={docUploadProgress[idBackUploadKey]} 
                                          />
                                        </label>
                                        {td.idPhotoBackName && (
                                          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium truncate max-w-[120px]">
                                            <Check className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{td.idPhotoBackName}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Passport Add Button for Residents (Now placed next to ID Photo scan) */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                      {language === 'ar' ? 'جواز السفر (للمقيمين)' : 'Passport (for Residents)'}
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = [...travelerDocs];
                                        copy[index].showPassport = !copy[index].showPassport;
                                        setTravelerDocs(copy);
                                      }}
                                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                                        td.showPassport
                                          ? 'bg-[#C9A227] text-[#0A211A] border-[#C9A227] font-bold'
                                          : 'bg-[#0E4B2E]/50 text-emerald-300 border-[#173B2F] hover:bg-[#0E4B2E] hover:text-white'
                                      }`}
                                    >
                                      <span className="flex items-center gap-1">
                                        <Plane className="w-3.5 h-3.5" />
                                        <span>{td.showPassport ? (language === 'ar' ? 'إزالة خيار الجواز' : 'Remove Passport') : (language === 'ar' ? 'إضافة جواز سفر' : 'Add Passport')}</span>
                                      </span>
                                    </button>
                                    
                                    {/* Warning text under the button */}
                                    <div className="text-[10px] text-gray-400 italic mt-1.5 leading-normal">
                                      {language === 'ar'
                                        ? '* للمقيمين: يجب رفع الهوية الشخصية أو جواز السفر على الأقل.'
                                        : '* For Residents: Must upload either National ID or Passport.'}
                                    </div>
                                  </div>
                                </div>

                                  {td.showPassport && (
                                    <div className="mt-3.5 p-4 rounded-xl bg-[#0E4B2E]/20 border border-[#173B2F]/60 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Passport Number */}
                                        <div>
                                          <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                            {language === 'ar' ? 'رقم جواز السفر' : 'Passport Number'}
                                          </label>
                                          <input
                                            type="text"
                                            placeholder="PXXXXXX"
                                            value={td.passportNumber}
                                            onChange={(e) => {
                                              const copy = [...travelerDocs];
                                              copy[index].passportNumber = e.target.value.toUpperCase();
                                              setTravelerDocs(copy);
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#123329]/80 border border-[#173B2F] text-xs text-gray-100 placeholder:text-gray-600 font-mono focus:outline-none focus:border-[#C9A227]/40"
                                          />
                                        </div>

                                        {/* Passport Expiry Date */}
                                        <div>
                                          <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                            {language === 'ar' ? 'تاريخ انتهاء الجواز' : 'Passport Expiry Date'}
                                          </label>
                                          <input
                                            type="date"
                                            value={td.passportExpiry}
                                            onChange={(e) => {
                                              const copy = [...travelerDocs];
                                              copy[index].passportExpiry = e.target.value;
                                              setTravelerDocs(copy);
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#123329]/80 border border-[#173B2F] text-xs text-gray-100 focus:outline-none focus:border-[#C9A227]/40"
                                          />
                                        </div>

                                        {/* Nationality */}
                                        <div>
                                          <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                            {language === 'ar' ? 'الجنسية' : 'Nationality'}
                                          </label>
                                          <input
                                            type="text"
                                            placeholder={language === 'ar' ? 'مثال: مصري، سوري' : 'e.g. Egyptian, Syrian'}
                                            value={td.nationality === 'أردني' || td.nationality === 'Jordanian' ? '' : td.nationality}
                                            onChange={(e) => {
                                              const copy = [...travelerDocs];
                                              copy[index].nationality = e.target.value;
                                              setTravelerDocs(copy);
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#123329]/80 border border-[#173B2F] text-xs text-gray-100 focus:outline-none focus:border-[#C9A227]/40"
                                          />
                                        </div>
                                      </div>

                                      {/* Passport Photo Upload */}
                                      <div>
                                        <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                          {language === 'ar' ? 'صورة/مسح جواز السفر' : 'Passport Scan / Photo'}
                                        </label>
                                        <div className="flex items-center gap-3">
                                          <label className="cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#0E4B2E] border border-[#173B2F] text-gray-300 hover:text-white transition text-xs font-semibold">
                                            <Upload className="w-3.5 h-3.5 text-[#C9A227]" />
                                            <span>
                                              {docUploadProgress[passportUploadKey] 
                                                ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') 
                                                : (language === 'ar' ? 'اختر ملف جواز السفر' : 'Upload Passport Scan')}
                                            </span>
                                            <input 
                                              type="file" 
                                              accept="image/*,.pdf"
                                              onChange={(e) => handleTravelerDocUpload(index, 'passportPhoto', e.target.files?.[0] || null)}
                                              className="hidden" 
                                              disabled={docUploadProgress[passportUploadKey]} 
                                            />
                                          </label>
                                          {td.passportPhotoName && (
                                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                                              <Check className="w-3.5 h-3.5" />
                                              <span className="truncate max-w-[120px]">{td.passportPhotoName}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                            ) : (
                              <div className="space-y-4 pt-1">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {/* Passport Number */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                      {language === 'ar' ? 'رقم جواز السفر' : 'Passport Number'}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="PXXXXXX"
                                      value={td.passportNumber}
                                      onChange={(e) => {
                                        const copy = [...travelerDocs];
                                        copy[index].passportNumber = e.target.value.toUpperCase();
                                        setTravelerDocs(copy);
                                      }}
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#123329]/80 border border-[#173B2F] text-xs text-gray-100 placeholder:text-gray-600 font-mono focus:outline-none focus:border-[#C9A227]/40"
                                    />
                                  </div>

                                  {/* Passport Expiry Date */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                      {language === 'ar' ? 'تاريخ انتهاء الجواز' : 'Passport Expiry Date'}
                                    </label>
                                    <input
                                      type="date"
                                      value={td.passportExpiry}
                                      onChange={(e) => {
                                        const copy = [...travelerDocs];
                                        copy[index].passportExpiry = e.target.value;
                                        setTravelerDocs(copy);
                                      }}
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#123329]/80 border border-[#173B2F] text-xs text-gray-100 focus:outline-none focus:border-[#C9A227]/40"
                                    />
                                  </div>

                                  {/* Nationality */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                      {language === 'ar' ? 'الجنسية' : 'Nationality'}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={language === 'ar' ? 'مثال: أردني' : 'e.g. Jordanian'}
                                      value={td.nationality}
                                      onChange={(e) => {
                                        const copy = [...travelerDocs];
                                        copy[index].nationality = e.target.value;
                                        setTravelerDocs(copy);
                                      }}
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#123329]/80 border border-[#173B2F] text-xs text-gray-100 focus:outline-none focus:border-[#C9A227]/40"
                                    />
                                  </div>
                                </div>

                                {/* Passport photo upload */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-emerald-300 mb-1.5">
                                    {language === 'ar' ? 'صورة/مسح جواز السفر' : 'Passport Scan / Photo'}
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#0E4B2E] border border-[#173B2F] text-gray-300 hover:text-white transition text-xs font-semibold">
                                      <Upload className="w-3.5 h-3.5 text-[#C9A227]" />
                                      <span>
                                        {docUploadProgress[passportUploadKey] 
                                          ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') 
                                          : (language === 'ar' ? 'اختر ملف جواز السفر' : 'Upload Passport Scan')}
                                      </span>
                                      <input 
                                        type="file" 
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleTravelerDocUpload(index, 'passportPhoto', e.target.files?.[0] || null)}
                                        className="hidden" 
                                        disabled={docUploadProgress[passportUploadKey]} 
                                      />
                                    </label>
                                    {td.passportPhotoName && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                                        <Check className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[120px]">{td.passportPhotoName}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}


                          </div>
                        );
                      })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-4 pt-4 border-t border-[#173B2F]">
                      <button
                        onClick={() => setCheckoutStep('details')}
                        className="flex-1 py-3 bg-[#0A211A] border border-[#173B2F] text-gray-300 hover:text-white font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>{language === 'ar' ? 'رجوع لتفاصيل الحجز' : 'Back to Details'}</span>
                      </button>

                      <button
                        onClick={() => {
                          // Validate traveler names
                          const isInvalidName = travelerDocs.some(t => !t.fullName.trim());
                          if (isInvalidName) {
                            alert(language === 'ar' ? 'يرجى إدخال أسماء جميع المسافرين قبل المتابعة!' : 'Please enter names for all travelers before proceeding!');
                            return;
                          }

                          // Validate traveler documents
                          for (let i = 0; i < travelerDocs.length; i++) {
                            const t = travelerDocs[i];
                            if (t.tripType === 'domestic') {
                              const hasValidID = t.nationalId.trim().length >= 10 && t.idPhoto;
                              const hasValidPassport = t.passportNumber.trim() && t.passportExpiry.trim() && t.passportPhoto;
                              
                              if (!hasValidID && !hasValidPassport) {
                                if (language === 'ar') {
                                  alert(`المسافر رقم ${i + 1}: يرجى تزويدنا بوثيقة سفر سارية المفعول. يجب إما إدخال الرقم الوطني ورفع صورة الهوية، أو إدخال تفاصيل جواز السفر ورفع صورته (للمقيمين)!`);
                                } else {
                                  alert(`Traveler ${i + 1}: Please provide a valid document. You must either enter a National ID and upload its scan, or enter Passport details and upload its scan (for residents)!`);
                                }
                                return;
                              }
                            } else {
                              // International: passport is mandatory
                              const hasValidPassport = t.passportNumber.trim() && t.passportExpiry.trim() && t.passportPhoto;
                              if (!hasValidPassport) {
                                if (language === 'ar') {
                                  alert(`المسافر رقم ${i + 1}: يرجى إدخال تفاصيل جواز السفر (الرقم وتاريخ الانتهاء) ورفع صورته (مطلوب للرحلات الدولية)!`);
                                } else {
                                  alert(`Traveler ${i + 1}: Please enter Passport details (number and expiry) and upload its scan (required for international trips)!`);
                                }
                                return;
                              }
                            }
                          }

                          setCheckoutStep('payment');
                        }}
                        className="flex-1 py-3 bg-[#C9A227] text-[#0A211A] hover:bg-[#C9A227]/90 font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5"
                      >
                        <span>{language === 'ar' ? 'الانتقال إلى خيارات الدفع ➔' : 'Proceed to Payment ➔'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {checkoutStep === 'payment' && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-white font-serif">{t('pay.title')}</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Select Option */}
                      <div className="space-y-3">
                        <button
                          onClick={() => setPaymentMethod('CliQ')}
                          className={`w-full p-4 rounded-xl border text-left rtl:text-right flex items-center justify-between transition ${
                            paymentMethod === 'CliQ'
                              ? 'bg-[#0E4B2E] border-[#C9A227] text-white'
                              : 'bg-[#0A211A] border-emerald-950 text-gray-400 hover:border-emerald-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-[#C9A227]" />
                            <div>
                              <span className="block text-xs font-bold text-white">{t('pay.cliq')}</span>
                              <span className="text-[10px] text-emerald-400 font-semibold">Jordan instant payment alias</span>
                            </div>
                          </div>
                          <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">
                            {paymentMethod === 'CliQ' && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A227]/90" />}
                          </div>
                        </button>

                        <button
                          onClick={() => setPaymentMethod('eFAWATEERcom')}
                          className={`w-full p-4 rounded-xl border text-left rtl:text-right flex items-center justify-between transition ${
                            paymentMethod === 'eFAWATEERcom'
                              ? 'bg-[#0E4B2E] border-[#C9A227] text-white'
                              : 'bg-[#0A211A] border-emerald-950 text-gray-400 hover:border-emerald-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[#C9A227]" />
                            <div>
                              <span className="block text-xs font-bold text-white">{t('pay.efawateer')}</span>
                              <span className="text-[10px] text-emerald-400 font-semibold">Jordan central billing portal</span>
                            </div>
                          </div>
                          <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">
                            {paymentMethod === 'eFAWATEERcom' && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A227]/90" />}
                          </div>
                        </button>

                        <button
                          onClick={() => setPaymentMethod('Visa')}
                          className={`w-full p-4 rounded-xl border text-left rtl:text-right flex items-center justify-between transition ${
                            paymentMethod === 'Visa'
                              ? 'bg-[#0E4B2E] border-[#C9A227] text-white'
                              : 'bg-[#0A211A] border-emerald-950 text-gray-400 hover:border-emerald-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-[#C9A227]" />
                            <div>
                              <span className="block text-xs font-bold text-white">{t('pay.card')}</span>
                              <span className="text-[10px] text-gray-400">Visa / MasterCard secure gateway</span>
                            </div>
                          </div>
                          <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">
                            {paymentMethod === 'Visa' && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A227]/90" />}
                          </div>
                        </button>

                        <button
                          onClick={() => setPaymentMethod('Cash at Office')}
                          className={`w-full p-4 rounded-xl border text-left rtl:text-right flex items-center justify-between transition ${
                            paymentMethod === 'Cash at Office'
                              ? 'bg-[#0E4B2E] border-[#C9A227] text-white'
                              : 'bg-[#0A211A] border-emerald-950 text-gray-400 hover:border-emerald-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Wallet className="w-5 h-5 text-[#C9A227]" />
                            <div>
                              <span className="block text-xs font-bold text-white">{t('pay.cash')}</span>
                              <span className="text-[10px] text-red-400 font-semibold">Requires physical office visit to confirm</span>
                            </div>
                          </div>
                          <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center">
                            {paymentMethod === 'Cash at Office' && <div className="w-2.5 h-2.5 rounded-full bg-[#C9A227]/90" />}
                          </div>
                        </button>
                      </div>

                      {/* Details Fields for Methods */}
                      <div className="bg-[#0A211A] p-5 border border-[#173B2F] rounded-2xl flex flex-col justify-between">
                        <div>
                          {paymentMethod === 'CliQ' && (
                            <div className="space-y-4">
                              <span className="text-xs font-bold text-emerald-400">CliQ Instant Payment details</span>
                              <p className="text-[11px] text-gray-400">Enter your Jordan CliQ Alias ID or linked phone number below to trigger safe webhook transfer.</p>
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1">{tf('CliQ Alias ID / الاسم المستعار')}</label>
                                <input
                                  type="text"
                                  placeholder="e.g. samer@jo"
                                  value={cliqAlias}
                                  onChange={(e) => setCliqAlias(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-[#123329] border border-[#173B2F] text-xs text-white"
                                />
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'eFAWATEERcom' && (
                            <div className="space-y-4">
                              <span className="text-xs font-bold text-emerald-400">eFAWATEERcom Direct Billing details</span>
                              <p className="text-[11px] text-gray-400">A digital invoice will be pushed to your Jordan banking app under Safretak Code 410.</p>
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1">National ID or Billing Number</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 9961023456"
                                  value={efawateerNo}
                                  onChange={(e) => setEfawateerNo(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-[#123329] border border-[#173B2F] text-xs text-white"
                                />
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'Visa' && (
                            <div className="space-y-3">
                              <span className="text-xs font-bold text-emerald-400">Card Payment Security Gate</span>
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1">Credit Card Number</label>
                                <input
                                  type="text"
                                  placeholder="4000 1234 5678 9010"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-[#123329] border border-[#173B2F] text-xs text-white"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-gray-400 mb-1">Expiry Date</label>
                                  <input
                                    type="text"
                                    placeholder="MM/YY"
                                    value={cardExpiry}
                                    onChange={(e) => setCardExpiry(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#123329] border border-[#173B2F] text-xs text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-400 mb-1">CVV</label>
                                  <input
                                    type="text"
                                    placeholder="123"
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#123329] border border-[#173B2F] text-xs text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'Cash at Office' && (
                            <div className="space-y-3 text-xs text-gray-300">
                              <span className="text-xs font-bold text-[#C9A227] flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>Cash payment guidelines</span>
                              </span>
                              <p>Your booking is put into <strong>"Pending Confirmation"</strong> status for a maximum of 24 hours.</p>
                              <p>Please visit the agency office in Shmeisani or Abdali with your booking ID to make cash settlement and issue print vouchers.</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-6 border-t border-[#173B2F] mt-8">
                          <div className="flex justify-between text-xs text-gray-300 mb-4">
                            <span>Amount to Charge</span>
                            <span className="font-bold text-[#C9A227]/90 text-sm">{calculateTotal()} JOD</span>
                          </div>
                          <button
                            onClick={handleConfirmBooking}
                            className="w-full py-3.5 bg-gradient-to-tr from-[#C9A227] to-[#E8CD7A] hover:scale-[1.01] transition text-[#0A211A] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>{t('pay.now')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'success' && activeBookingSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-6"
                  >
                    <div className="w-16 h-16 bg-emerald-950/80 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xl font-serif font-bold text-white">{t('pay.success_title')}</h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto">{t('pay.success_desc')}</p>
                    </div>

                    {/* Booking Card */}
                    <div className="bg-[#0A211A] p-6 rounded-2xl border border-[#173B2F] max-w-sm mx-auto text-left rtl:text-right space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">{t('pay.booking_no')}</span>
                        <span className="font-mono font-bold text-[#C9A227]/90 text-sm">{activeBookingSuccess.id}</span>
                      </div>

                      <div className="border-t border-dashed border-emerald-950 my-2" />

                      <div className="text-xs space-y-1.5">
                        <p className="text-gray-400">Service: <span className="text-white font-semibold">{tf(activeBookingSuccess.serviceName)}</span></p>
                        <p className="text-gray-400">Total Price: <span className="text-emerald-400 font-bold">{activeBookingSuccess.totalPrice} JOD</span></p>
                        <p className="text-gray-400">Payment: <span className="text-[#C9A227]/90 font-semibold">{activeBookingSuccess.paymentMethod}</span></p>
                        <p className="text-gray-400">Office: <span className="text-white font-medium">{tf(activeBookingSuccess.officeName)}</span></p>
                      </div>

                      {/* SVG Simulated QR code */}
                      <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl w-36 h-36 mx-auto">
                        <svg className="w-28 h-28 text-black" viewBox="0 0 100 100">
                          <rect width="100" height="100" fill="white" />
                          <rect x="10" y="10" width="20" height="20" fill="black" />
                          <rect x="15" y="15" width="10" height="10" fill="white" />
                          <rect x="70" y="10" width="20" height="20" fill="black" />
                          <rect x="75" y="15" width="10" height="10" fill="white" />
                          <rect x="10" y="70" width="20" height="20" fill="black" />
                          <rect x="15" y="75" width="10" height="10" fill="white" />
                          {/* Random noise squares representing digital signature QR code */}
                          <rect x="40" y="20" width="5" height="5" fill="black" />
                          <rect x="50" y="35" width="10" height="5" fill="black" />
                          <rect x="25" y="50" width="5" height="10" fill="black" />
                          <rect x="45" y="60" width="15" height="5" fill="black" />
                          <rect x="80" y="80" width="10" height="10" fill="black" />
                          <rect x="70" y="70" width="5" height="5" fill="black" />
                        </svg>
                        <span className="text-[9px] text-gray-500 font-mono mt-1">{activeBookingSuccess.qrCode}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                      {/* Simulated Download */}
                      <button
                        onClick={() => {
                          const element = document.createElement("a");
                          const file = new Blob([`SAFRETAK TRAVEL INVOICE\n=======================\nBooking ID: ${activeBookingSuccess.id}\nService: ${activeBookingSuccess.serviceName}\nOffice: ${activeBookingSuccess.officeName}\nPrice: ${activeBookingSuccess.totalPrice} JOD\nPayment Method: ${activeBookingSuccess.paymentMethod}\nQR Reference: ${activeBookingSuccess.qrCode}\nGenerated Date: ${new Date().toLocaleDateString()}\nThank you for booking with Safretak!`], {type: 'text/plain'});
                          element.href = URL.createObjectURL(file);
                          element.download = `Invoice_${activeBookingSuccess.id}.txt`;
                          document.body.appendChild(element);
                          element.click();
                        }}
                        className="px-4 py-2 bg-[#0E4B2E] border border-[#173B2F] hover:bg-[#173B2F] text-xs font-bold rounded-lg text-emerald-300 flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('pay.invoice')}</span>
                      </button>

                      <button
                        onClick={() => {
                          alert(`Share Link copied: safretak.com/voucher/${activeBookingSuccess.id}`);
                        }}
                        className="px-4 py-2 bg-[#0E4B2E] border border-[#173B2F] hover:bg-[#173B2F] text-xs font-bold rounded-lg text-emerald-300 flex items-center justify-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{t('pay.share')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedItem(null);
                          setIsBookingMode(false);
                          setActiveTab('bookings');
                        }}
                        className="px-5 py-2 bg-[#C9A227] text-[#0A211A] text-xs font-bold rounded-lg"
                      >
                        {tf('Go to My Bookings / حجوزاتي')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* OFFICE PROFILE PAGE */}
            {selectedOfficeProfile && !selectedItem && (
              <motion.div
                key="office-profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Back button */}
                <button
                  onClick={() => setSelectedOfficeProfile(null)}
                  className="mb-2 inline-flex items-center gap-2 text-xs text-[#dcb33b] hover:text-white transition"
                >
                  <ArrowRight className="w-4 h-4 rotate-180 rtl:rotate-0" />
                  <span>{language === 'ar' ? 'رجوع إلى الرئيسية' : 'Back to Home'}</span>
                </button>

                {/* Unified Profile Header Panel */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0E2C22] shadow-2xl">
                  {/* Light grey-green cover gradient with high-end travel image behind it */}
                  <div className="absolute top-0 left-0 right-0 h-[220px] overflow-hidden select-none">
                    <img 
                      src="https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1200&q=80" 
                      alt="Cover Background"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-25 filter grayscale scale-105" 
                    />
                    {/* The light greyish silver/white top gradient of the screenshot */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#e5eae7]/95 via-[#cbd4cf]/80 to-transparent" />
                  </div>

                  {/* Header Content */}
                  <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-8">
                    {/* Centered Profile Logo */}
                    <div className="mb-4 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
                      {renderOfficeProfilePic(selectedOfficeProfile)}
                    </div>
                    
                    {/* Verified Name */}
                    <h1 className="text-white text-xl md:text-3xl font-extrabold flex items-center gap-2 justify-center mt-2 drop-shadow-sm">
                      <span>{tf(selectedOfficeProfile.name)}</span>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#1d9bf0] fill-current inline-block shrink-0 drop-shadow">
                        <g>
                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.74 2.746 1.867 3.4-.132.423-.2.865-.2 1.333 0 2.21 1.71 4 3.918 4 .504 0 .99-.092 1.442-.26C9.07 22.56 10.45 23.5 12 23.5s2.93-.94 3.48-2.31c.45.17.938.26 1.442.26 2.21 0 3.918-1.79 3.918-4 0-.468-.068-.91-.2-1.333 1.127-.654 1.867-1.94 1.867-3.4z" />
                          <path d="M11.44 16.51c-.24 0-.48-.09-.67-.27l-3.35-3.35c-.37-.37-.37-.97 0-1.34s.97-.37 1.34 0l2.68 2.68 5.67-6.52c.34-.39.94-.43 1.33-.09s.43.94.09 1.33l-6.42 7.39c-.17.2-.42.31-.67.31z" fill="#fff" />
                        </g>
                      </svg>
                    </h1>
                    
                    {/* Office ID */}
                    <div className="text-gray-400 text-[11px] font-mono mt-1" dir="ltr">
                      ID: {selectedOfficeProfile.id}
                    </div>
                    
                    {/* Bio description centered */}
                    <p className="text-gray-300 text-xs md:text-sm mt-4 leading-relaxed max-w-2xl mx-auto font-medium">
                      {bio}
                    </p>

                    <div className="text-[#8c7326] text-[10px] mt-2 block opacity-70">
                      {language === 'ar' 
                        ? '(وصف المكتب يتم تعديله من قبل المكتب او الادمن)' 
                        : '(Office description can be edited by the office or admin)'}
                    </div>
                  </div>
                </div>

                {/* Central Horizontal Tab Switcher */}
                <div className="flex justify-between bg-[#122b21]/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 max-w-lg mx-auto select-none">
                  <button 
                    onClick={() => setActiveOfficeTab('trips')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-center transition-all duration-300 ${
                      activeOfficeTab === 'trips' 
                        ? 'bg-[#dcb33b] text-black shadow-lg shadow-[#dcb33b]/20' 
                        : 'text-[#9ba8a2] hover:text-[#dcb33b] hover:bg-[#122b21]/40'
                    }`}
                  >
                    {language === 'ar' ? 'الرحلات المميزة' : 'Featured Trips'}
                  </button>
                  
                  <button 
                    onClick={() => setActiveOfficeTab('services')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-center transition-all duration-300 ${
                      activeOfficeTab === 'services' 
                        ? 'bg-[#dcb33b] text-black shadow-lg shadow-[#dcb33b]/20' 
                        : 'text-[#9ba8a2] hover:text-[#dcb33b] hover:bg-[#122b21]/40'
                    }`}
                  >
                    {language === 'ar' ? 'الخدمات المتاحة' : 'Available Services'}
                  </button>

                  <button 
                    onClick={() => setActiveOfficeTab('news')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-center transition-all duration-300 ${
                      activeOfficeTab === 'news' 
                        ? 'bg-[#dcb33b] text-black shadow-lg shadow-[#dcb33b]/20' 
                        : 'text-[#9ba8a2] hover:text-[#dcb33b] hover:bg-[#122b21]/40'
                    }`}
                  >
                    {language === 'ar' ? 'آخر الأخبار' : 'Latest News'}
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="pt-2">
                  {activeOfficeTab === 'trips' && (
                    <div className="space-y-4">
                      {/* Section Title */}
                      <div className="flex justify-between items-center px-1">
                        <h2 className="text-white text-[17px] font-bold border-r-4 border-[#dcb33b] pr-2.5">
                          {language === 'ar' ? 'الرحلات الرائجة' : 'Trending Trips'}
                        </h2>
                        <button 
                          onClick={() => {
                            setCityFilter(selectedOfficeProfile.name);
                            setSelectedCategory('trip');
                            setActiveTab('services');
                            setSelectedOfficeProfile(null);
                          }} 
                          className="text-[#dcb33b] text-xs hover:underline"
                        >
                          {language === 'ar' ? 'المزيد من الرحلات <' : 'More Trips >'}
                        </button>
                      </div>

                      {/* Responsive Grid/List */}
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {officeTrips.length === 0 ? (
                          <div className="text-center py-12 text-gray-400 text-xs w-full col-span-full">
                            {language === 'ar' ? 'لا توجد رحلات حالياً من هذا المكتب' : 'No trips available from this office yet.'}
                          </div>
                        ) : (
                          officeTrips.map(trip => (
                            <div 
                              key={trip.id} 
                              className="bg-[#122b21] hover:bg-[#1b3e30] rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-[#dcb33b]/40 border border-white/5 transition-all duration-300 shadow-lg group text-right"
                              onClick={() => setSelectedItem({ type: 'trip', item: trip })}
                            >
                              <div className="relative h-40 w-full rounded-xl overflow-hidden mb-3.5 border border-white/5">
                                <img 
                                  src={trip.image} 
                                  alt={trip.title} 
                                  referrerPolicy="no-referrer" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                                <div className="absolute top-2 left-2 bg-[#dcb33b] text-black text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                                  {trip.price} JOD
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-[#dcb33b] text-sm font-bold mb-1.5 group-hover:text-yellow-300 transition-colors">{tf(trip.title)}</h3>
                                  <p className="text-white/80 text-[11px] leading-relaxed line-clamp-3">
                                    {tf(trip.description)}
                                  </p>
                                </div>
                                <div>
                                  <div className="border-t border-dashed border-white/10 my-3" />
                                  <div className="text-[#dcb33b] text-[10px] flex items-center gap-1 justify-end">
                                    <MapPin className="w-3.5 h-3.5 text-[#f9354c]" />
                                    <span>مواقع الانطلاق : اربد,عمان,عجلون</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeOfficeTab === 'services' && (
                    <div className="space-y-4">
                      {/* Section Title */}
                      <div className="px-1">
                        <h2 className="text-white text-[17px] font-bold border-r-4 border-[#dcb33b] pr-2.5">
                          {language === 'ar' ? 'الخدمات المتاحة' : 'Available Services'}
                        </h2>
                      </div>

                      {/* Services Grid list - responsive columns */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {officeServices.length === 0 ? (
                          <div className="text-center py-12 text-gray-400 text-xs col-span-full">
                            {language === 'ar' ? 'لا توجد خدمات أخرى متاحة حالياً' : 'No other services available currently.'}
                          </div>
                        ) : (
                          officeServices.map(srv => (
                            <div 
                              key={srv.item.id} 
                              className="bg-[#122b21] hover:bg-[#1b3e30] rounded-xl p-3 flex flex-col justify-between hover:border-[#dcb33b]/40 border border-transparent transition-all duration-300 cursor-pointer shadow-md text-right group"
                              onClick={() => setSelectedItem({ type: srv.type, item: srv.item })}
                            >
                              <div className="relative w-full h-24 rounded-lg overflow-hidden mb-2.5 border border-white/5">
                                <img 
                                  src={srv.item.image} 
                                  alt={srv.item.title} 
                                  referrerPolicy="no-referrer" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                              </div>
                              <div>
                                <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono font-bold">
                                  {srv.type === 'hotel' ? (language === 'ar' ? 'فندق' : 'Hotel') : srv.type === 'car' ? (language === 'ar' ? 'سيارة' : 'Car') : (language === 'ar' ? 'طيران' : 'Flight')}
                                </span>
                                <h3 className="text-white text-[12px] font-bold line-clamp-1 mt-0.5 group-hover:text-yellow-300 transition-colors">{tf(srv.item.title)}</h3>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-[#dcb33b] text-xs font-bold">{srv.item.price} JOD</span>
                                  <div className="flex items-center gap-0.5 text-[10px] text-[#C9A227]">
                                    <Star className="w-3 h-3 fill-[#C9A227] text-[#C9A227]" />
                                    <span>{srv.item.rating}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {activeOfficeTab === 'news' && (
                    <div className="space-y-4">
                      {/* Section Title */}
                      <div className="px-1">
                        <h2 className="text-white text-[17px] font-bold border-r-4 border-[#dcb33b] pr-2.5">
                          {language === 'ar' ? 'آخر الأخبار' : 'Latest News'}
                        </h2>
                      </div>

                      {/* News cards: grid on tablets/desktops */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[
                          {
                            id: 1,
                            date: language === 'ar' ? 'اليوم' : 'Today',
                            textAr: 'حملة التوفير الكبرى لنهاية الأسبوع! خصم 20% على الرحلات الجماعية إلى البترا ووادي رم. استخدم كود SAFAR26 عند الحجز الإلكتروني لتأكيد مقعدك.',
                            textEn: 'Weekend Mega Sale! 20% off on group trips to Petra and Wadi Rum. Use code SAFAR26 during electronic booking to secure your spots.',
                            img: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=400&q=80'
                          },
                          {
                            id: 2,
                            date: language === 'ar' ? 'أمس' : 'Yesterday',
                            textAr: 'ترقبوا تفاصيل عروض رحلات الصيف المباشرة إلى إسطنبول مع برامج عائلية متكاملة تشمل سكن فاخر وتذاكر طيران جيت بأفضل الأسعار المتاحة.',
                            textEn: 'Stay tuned for our summer direct flights to Istanbul with fully comprehensive family programs including premium stays at great rates.',
                            img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=400&q=80'
                          }
                        ].map(post => (
                          <div key={post.id} className="bg-[#122b21] rounded-2xl p-5 border border-white/5 shadow-md flex flex-col justify-between text-right">
                            <div>
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-[#1b3a2d] to-[#0b1d16] border border-[#dcb33b]/30 flex items-center justify-center text-xs">
                                  {getOfficeLogo(selectedOfficeProfile.id)}
                                </div>
                                <div>
                                  <h4 className="text-white text-[12px] font-bold leading-none">{tf(selectedOfficeProfile.name)}</h4>
                                  <span className="text-[9px] text-[#C9A227] font-mono mt-0.5 block" dir="ltr">{selectedOfficeProfile.id}</span>
                                  <span className="text-[10px] text-[#9ba8a2] font-mono mt-0.5 block">{post.date}</span>
                                </div>
                              </div>
                              <p className="text-white/90 text-xs leading-relaxed mb-3">
                                {language === 'ar' ? post.textAr : post.textEn}
                              </p>
                            </div>
                            <div className="h-40 rounded-xl overflow-hidden border border-white/5 mt-2">
                              <img src={post.img} alt="Post asset" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: HOME */}
            {activeTab === 'home' && !selectedItem && !selectedOfficeProfile && (
              <motion.div
                key="home-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Popular Travel Offices Slider */}
                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-1 h-5 bg-[#C9A227] rounded-full"></span>
                      {language === 'ar' ? 'المكاتب السياحية الرائجة' : 'Popular Travel Offices'}
                    </h3>
                  </div>
                  <div className="banner-card">
                    <div className="decorative-glow"></div>
                    
                    <div className="marquee-container">
                      <div className="marquee-track" id="offices-slider-track" ref={officesTrackRef}>
                        {mockOffices.map((office) => {
                          const username = officeUsernames[office.id] || `@Office_${office.id}`;
                          const bio = language === 'ar' ? officeBios[office.id]?.ar : officeBios[office.id]?.en;
                          const name = tf(office.name);
                          const location = tf(office.location);

                          return (
                            <div 
                              key={office.id} 
                              className="profile-card cursor-pointer hover:border-[#C9A227]/70 transition-all duration-300" 
                              onClick={() => {
                                setSelectedOfficeProfile(office);
                              }}
                            >
                              <div className="card-top">
                                <div className="avatar flex items-center justify-center bg-gradient-to-br from-[#173B2F] to-[#0A211A] border-2 border-[#C9A227]/40 shadow-inner overflow-hidden">
                                  <img 
                                    src={officeLogoImages[office.id] || 'https://images.unsplash.com/photo-1599740831146-818456b2af32?auto=format&fit=crop&w=400&h=400&q=80'} 
                                    alt={office.name} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="name-info">
                                  <div className="name-badge-row">
                                    <h4>{name}</h4>
                                    {office.isApproved && (
                                      <svg viewBox="0 0 24 24" className="verified-icon"><g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.74 2.746 1.867 3.4-.132.423-.2.865-.2 1.333 0 2.21 1.71 4 3.918 4 .504 0 .99-.092 1.442-.26C9.07 22.56 10.45 23.5 12 23.5s2.93-.94 3.48-2.31c.45.17.938.26 1.442.26 2.21 0 3.918-1.79 3.918-4 0-.468-.068-.91-.2-1.333 1.127-.654 1.867-1.94 1.867-3.4z" fill="#1D9BF0"></path><path d="M11.44 16.51c-.24 0-.48-.09-.67-.27l-3.35-3.35c-.37-.37-.37-.97 0-1.34s.97-.37 1.34 0l2.68 2.68 5.67-6.52c.34-.39.94-.43 1.33-.09s.43.94.09 1.33l-6.42 7.39c-.17.2-.42.31-.67.31z" fill="#fff"></path></g></svg>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono mt-0.5" dir="ltr">
                                    ID: {office.id}
                                  </div>
                                </div>
                              </div>
                              <div className="card-body">
                                <p className="bio-text min-h-[34px] line-clamp-2">{bio}</p>
                                <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#173B2F]/40">
                                  <p className="sub-bio flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-[#C9A227]" />
                                    <span>{location}</span>
                                  </p>
                                  <div className="flex items-center gap-1 text-[10px] text-[#C9A227]">
                                    <Star className="w-3 h-3 fill-[#C9A227] text-[#C9A227]" />
                                    <span className="font-bold text-white">{office.rating}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promoted Destinations Slider */}
                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-1 h-5 bg-[#C9A227] rounded-full"></span>
                      {language === 'ar' ? 'الرحلات الرائجة' : 'Trending Promoted Trips'}
                    </h3>
                  </div>

                  <div className="banner-card">
                    <div className="decorative-glow"></div>
                    
                    <div className="marquee-container">
                      <div className="marquee-track" id="destinations-slider-track" ref={destinationsTrackRef}>
                        {promotedTrips.length === 0 ? (
                          <div className="text-center py-12 text-gray-400 text-xs w-full col-span-full">
                            {language === 'ar' ? 'لا توجد رحلات مروجة حالياً وفقاً للمعايير والحدود المحددة.' : 'No promoted trips available under current criteria.'}
                          </div>
                        ) : (
                          promotedTrips.map((trip) => {
                            return (
                              <div 
                                key={trip.id} 
                                className="profile-card cursor-pointer hover:border-[#C9A227]/70 transition-all duration-300 flex flex-col justify-between text-right" 
                                onClick={() => setSelectedItem({ type: 'trip', item: trip })}
                              >
                                <div className="card-top">
                                  <div 
                                    className="avatar shrink-0 rounded-lg border border-[#C9A227]/30" 
                                    style={{ backgroundImage: `url('${trip.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                  />
                                  <div className="name-info min-w-0">
                                    <div className="name-badge-row flex items-center justify-between">
                                      <h4 className="truncate max-w-[150px] font-bold text-white">{tf(trip.title)}</h4>
                                      <span className="text-[10px] text-[#C9A227] font-bold shrink-0">⭐ {trip.rating}</span>
                                    </div>
                                    <span className="username text-emerald-400 truncate block">{tf(trip.officeName)}</span>
                                  </div>
                                </div>
                                <div className="card-body mt-2 flex flex-col justify-between flex-1">
                                  <p className="text-space bio-text line-clamp-2 text-xs text-gray-300">
                                    {tf(trip.description)}
                                  </p>
                                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#173B2F]/40 text-[11px]">
                                    <p className="text-[#C9A227] font-mono font-bold">{trip.price} JOD</p>
                                    <span className="bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/30 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                      {language === 'ar' ? 'مروّجة رائجة' : 'Promoted'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: EXPLORE / SERVICES WITH DETAILED FILTERS */}
            {activeTab === 'services' && !selectedItem && !selectedOfficeProfile && (
              <motion.div
                key="services-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Filters Row */}
                <div className="bg-[#123329] border border-[#173B2F] rounded-2xl p-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        selectedCategory === 'all'
                          ? 'bg-[#C9A227] text-black'
                          : 'bg-[#0A211A] text-gray-300 border border-[#173B2F]'
                      }`}
                    >
                      {t('filter.all')}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          selectedCategory === cat.id
                            ? 'bg-[#C9A227] text-black'
                            : 'bg-[#0A211A] text-gray-300 border border-[#173B2F]'
                        }`}
                      >
                        {t(cat.labelKey)}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-emerald-950 text-xs">
                    <div>
                      <label className="block text-gray-400 mb-1">Filter by City / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Amman, Aqaba, Dead Sea"
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-[#0A211A] border border-emerald-950 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Maximum Price: {priceFilter} JOD</label>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        value={priceFilter}
                        onChange={(e) => setPriceFilter(Number(e.target.value))}
                        className="w-full accent-[#C9A227]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Minimum Rating</label>
                      <select
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded bg-[#0A211A] border border-emerald-950 text-white"
                      >
                        <option value="0">All Ratings</option>
                        <option value="4.5">4.5+ Stars</option>
                        <option value="4.8">4.8+ Stars</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Browse grid items list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredItems().map(({ type, item }) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem({ type, item })}
                      className="cursor-pointer bg-[#123329] border border-[#173B2F] hover:border-[#C9A227] rounded-2xl overflow-hidden transition flex flex-col justify-between"
                    >
                      <div className="relative h-40">
                        <img src={item.image} className="w-full h-full object-cover" alt="" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-[#C9A227]/90">
                          {type.toUpperCase()}
                        </span>
                      </div>

                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start text-[10px] text-gray-400">
                            <div className="flex flex-col min-w-0">
                              <span className="truncate max-w-[130px] flex items-center gap-1">
                                <Briefcase className="w-3 h-3 shrink-0 text-[#C9A227]/90" />
                                <span>{tf(item.officeName)}</span>
                              </span>
                              <span className="text-[9px] text-[#C9A227]/80 font-mono tracking-tighter truncate max-w-[130px]" dir="ltr">{item.officeId}</span>
                            </div>
                            <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                              <Star className="w-3 h-3 fill-[#C9A227] text-[#C9A227]" />
                              <span className="text-white font-bold">{item.rating}</span>
                            </div>
                          </div>
                          <h4 className="text-xs font-bold text-white mt-1.5">{tf(item.title)}</h4>
                          <p className="text-[10px] text-gray-400 line-clamp-2 mt-1">{tf(item.description)}</p>
                        </div>

                        <div className="pt-3 border-t border-emerald-950 flex justify-between items-center">
                          <span className="text-xs text-[#C9A227]/90 font-bold">{item.price} JOD</span>
                          <span className="text-[10px] text-emerald-300 font-medium hover:underline flex items-center gap-1">
                            <span>Details</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {getFilteredItems().length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 space-y-2">
                      <AlertCircle className="w-10 h-10 mx-auto text-emerald-900" />
                      <p>{t('status.empty')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: MY BOOKINGS LIST */}
            {activeTab === 'bookings' && !selectedItem && !selectedOfficeProfile && (
              <motion.div
                key="bookings-tab"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Active Chat Popup / Row overlay if selected */}
                {activeChatBooking ? (
                  <div className="bg-[#123329] border border-[#173B2F] rounded-3xl p-4 flex flex-col h-[500px]">
                    <div className="flex justify-between items-center pb-3 border-b border-[#173B2F] mb-4">
                      <div>
                        <h3 className="text-xs font-bold text-white">Chat with {activeChatBooking.officeName}</h3>
                        <p className="text-[10px] text-gray-400">Ref: {activeChatBooking.id}</p>
                      </div>
                      <button
                        onClick={() => setActiveChatBooking(null)}
                        className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                      {activeChatBooking.chatHistory.map((chat, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col max-w-[75%] rounded-xl p-3 text-xs ${
                            chat.sender === 'traveler'
                              ? 'bg-[#C9A227] text-black ml-auto rounded-tr-none'
                              : 'bg-[#0A211A] text-gray-300 mr-auto rounded-tl-none border border-[#173B2F]'
                          }`}
                        >
                          <p className="leading-relaxed">{chat.message}</p>
                          <span className="text-[9px] text-gray-400 mt-1 block text-right font-mono">{chat.timestamp}</span>
                        </div>
                      ))}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          alert(language === 'ar' ? 'تم رفع المستند بنجاح' : 'Document uploaded successfully');
                        }}
                        className="p-3 bg-[#0A211A] text-[#C9A227] border border-[#173B2F] rounded-xl hover:bg-[#173B2F] transition"
                        title={language === 'ar' ? 'رفع مستند' : 'Upload Document'}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        placeholder="Type message to agency..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') sendChatMessage();
                        }}
                        className="flex-1 p-3 rounded-xl bg-[#0A211A] border border-[#173B2F] text-xs text-white"
                      />
                      <button
                        onClick={sendChatMessage}
                        className="p-3 bg-[#C9A227] text-black rounded-xl hover:bg-[#C9A227]/90 transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-bold font-mono tracking-wider text-emerald-400 uppercase">
                      {tf('My Booking History / سجل حجوزاتي')}
                    </h3>

                    <div className="space-y-3">
                      {bookings
                        .filter(b => b.travelerId === traveler.id)
                        .map((b) => (
                          <div
                            key={b.id}
                            className="p-5 bg-[#123329] border border-[#173B2F] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#C9A227]/30 transition"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-[#C9A227]/90 font-bold">{b.id}</span>
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                    b.status === 'Confirmed'
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                                      : b.status === 'Pending'
                                      ? 'bg-yellow-950 text-[#C9A227]/90 border border-yellow-900'
                                      : 'bg-red-950 text-red-400 border border-red-900'
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-2">{tf(b.serviceName)}</h4>
                              <p className="text-xs text-gray-400 mt-1">
                                {tf('Office / مكتب')}: {b.officeName} <span className="font-mono text-[10px]">({b.officeId})</span> • {b.totalPrice} JOD
                              </p>
                            </div>
                            <button
                              onClick={() => setActiveChatBooking(b)}
                              className="px-4 py-2 bg-[#0A211A] hover:bg-[#C9A227] hover:text-black border border-[#173B2F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-end sm:self-center shrink-0"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'المحادثة' : 'Chat'}</span>
                            </button>
                          </div>
                        ))}
                      
                      {bookings.filter(b => b.travelerId === traveler.id).length === 0 && (
                        <div className="py-12 text-center text-gray-500 space-y-2">
                          <AlertCircle className="w-10 h-10 mx-auto text-emerald-900" />
                          <p>{t('status.empty')}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* TAB: ACCOUNT / PROFILE */}
            {activeTab === 'account' && !selectedItem && !selectedOfficeProfile && (
              <motion.div
                key="account-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-6xl mx-auto space-y-6 px-2 md:px-4 text-right"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {/* Modern Grid Layout: Sidebar and Content Pane */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* SIDEBAR PANEL (Col Span 4) */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Main Profile Canvas Card */}
                    <div className="bg-[#05130e] border border-[#112d22] rounded-[32px] overflow-hidden relative shadow-xl flex flex-col">
                      {/* Premium Oriental-Modern Header Background Block */}
                      <div className="h-[120px] relative w-full bg-gradient-to-tr from-[#0f2e24] via-[#61451f] to-[#aa8343] flex items-start justify-between px-6 pt-5 overflow-hidden">
                        <div className="absolute inset-0 bg-radial from-transparent to-black/20 pointer-events-none" />
                        
                        <span className="font-extrabold text-[14px] tracking-widest text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] font-sans">
                          SAFRETK
                        </span>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#fceb92] to-[#cba332] flex items-center justify-center shadow-lg border border-white/20">
                          <Award className="w-3.5 h-3.5 text-[#0A211A]" />
                        </div>
                      </div>

                      {/* Body Content shifted up using negative margin to overlap the header */}
                      <div className="px-6 pb-6 -mt-[50px] relative z-10 flex flex-col space-y-5">
                        
                        {/* Arch-shaped avatar centered */}
                        <div className="flex flex-col items-center">
                          {(() => {
                            const theme = getTravelerAvatarTheme(tempTravelerName || traveler.fullName);
                            return (
                              <div className={`relative w-[95px] h-[115px] rounded-t-[48px] rounded-b-[14px] bg-gradient-to-b ${theme.gradient} border-2 ${theme.border} shadow-[0_8px_20px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden group`}>
                                <span className={`text-2xl font-black ${theme.text} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans`}>
                                  {getArabicInitials(tempTravelerName || traveler.fullName)}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                                <div className="absolute inset-1 border border-white/10 rounded-t-[44px] rounded-b-[10px] pointer-events-none" />
                              </div>
                            );
                          })()}

                          {/* Name and Phone */}
                          <h3 className="text-lg font-bold text-white mt-3 text-center tracking-tight">
                            {tempTravelerName || traveler.fullName}
                          </h3>
                          <p className="text-xs text-gray-400 font-mono mt-1 text-center" dir="ltr">
                            {tempTravelerPhone || traveler.phone}
                          </p>
                          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[10px] font-bold text-[#C9A227] font-mono">
                            <span>ID:</span>
                            <span>{traveler.id}</span>
                          </div>
                        </div>

                        {/* Stats Blocks Row (Bookings) */}
                        <div className="w-full">
                          <div className="bg-[#0b1d16] border border-emerald-900/35 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                            <span className="text-lg font-extrabold text-white font-mono">
                              {bookings.filter(b => b.travelerId === traveler.id).length || 12}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold mt-1">
                              {language === 'ar' ? 'الحجوزات' : 'Bookings'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Responsive Vertical Navigation Menu */}
                    <div className="bg-[#05130e] border border-[#112d22] rounded-[28px] p-2 shadow-lg flex flex-col space-y-1">
                      {[
                        { id: 'profile', labelAr: 'الملف الشخصي', labelEn: 'Personal Profile', icon: User },
                        { id: 'addresses', labelAr: 'العناوين المسجلة', labelEn: 'Saved Addresses', icon: MapPin },
                        { id: 'notifications', labelAr: 'مركز التنبيهات', labelEn: 'Notifications Hub', icon: Bell, hasDot: true },
                        { id: 'support', labelAr: 'الدعم والمساعدة (FAQs)', labelEn: 'Support & FAQs', icon: HelpCircle },
                        { id: 'settings', labelAr: 'الإعدادات واللغة', labelEn: 'Settings & Language', icon: Settings },
                      ].map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeAccountSection === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveAccountSection(item.id as any);
                              // Smooth scroll to content on mobile
                              if (window.innerWidth < 1024) {
                                document.getElementById('account-content-pane')?.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-sm font-bold text-right cursor-pointer ${
                              isActive 
                                ? 'bg-[#122b21] text-[#C9A227] border-r-4 border-[#C9A227]' 
                                : 'text-gray-300 hover:bg-[#0b1d16] hover:text-white'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'text-[#C9A227]' : 'text-gray-400'}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <span className="flex-1">
                              {language === 'ar' ? item.labelAr : item.labelEn}
                            </span>
                            {item.hasDot && item.id === 'notifications' && (
                              <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                            )}
                            <ChevronRight className={`w-4 h-4 transition-transform shrink-0 ${language === 'ar' ? 'rotate-180' : ''}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* MAIN CONTENT PANE (Col Span 8) */}
                  <div id="account-content-pane" className="lg:col-span-8 w-full">
                    <div className="bg-[#05130e] border border-[#112d22] rounded-[32px] p-6 shadow-xl min-h-[450px] relative overflow-hidden flex flex-col justify-between">
                      
                      {/* Section Content */}
                      <div className="space-y-6">
                        
                        {/* SUB-VIEW 1: PERSONAL PROFILE */}
                        {activeAccountSection === 'profile' && (
                          <div className="space-y-5 animate-none">
                            <div className="border-b border-[#112d22] pb-3">
                              <h3 className="text-lg font-bold text-[#C9A227]">
                                {language === 'ar' ? 'الملف الشخصي والبيانات الشخصية' : 'Personal Profile Settings'}
                              </h3>
                              <p className="text-xs text-gray-400 mt-1">
                                {language === 'ar' ? 'تعديل بيانات حسابك الشخصي لتسهيل عمليات الحجز والاتصال' : 'Keep your details up-to-date for fast booking and confirmation'}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 block">
                                  {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                                </label>
                                <input
                                  type="text"
                                  value={tempTravelerName}
                                  onChange={e => setTempTravelerName(e.target.value)}
                                  className="w-full bg-[#0b1d16] border border-[#112d22] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-all"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 block">
                                  {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                                </label>
                                <input
                                  type="text"
                                  value={tempTravelerPhone}
                                  onChange={e => setTempTravelerPhone(e.target.value)}
                                  className="w-full bg-[#0b1d16] border border-[#112d22] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A227] font-mono transition-all"
                                  dir="ltr"
                                />
                              </div>

                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-gray-400 block">
                                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                                </label>
                                <input
                                  type="email"
                                  value={tempTravelerEmail}
                                  onChange={e => setTempTravelerEmail(e.target.value)}
                                  className="w-full bg-[#0b1d16] border border-[#112d22] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A227] font-mono transition-all"
                                />
                              </div>
                            </div>

                            <div className="pt-4">
                              <button
                                onClick={() => {
                                  traveler.fullName = tempTravelerName;
                                  traveler.phone = tempTravelerPhone;
                                  traveler.email = tempTravelerEmail;
                                  setProfileSavedSuccess(true);
                                  setTimeout(() => setProfileSavedSuccess(false), 3000);
                                  
                                  window.dispatchEvent(new CustomEvent('addNotification', {
                                    detail: {
                                      id: Date.now(),
                                      type: 'INFO_UPDATE',
                                      titleAr: 'تحديث بيانات الحساب',
                                      titleEn: 'Profile Info Updated',
                                      descAr: 'تم تحديث بيانات ملفك الشخصي بنجاح. قد تتطلب بعض المكاتب تأكيد البيانات الجديدة لحجوزاتك القادمة.',
                                      descEn: 'Your profile information has been successfully updated.',
                                      timeAr: 'الآن',
                                      timeEn: 'Just now',
                                      read: false,
                                      requiresAction: false
                                    }
                                  }));
                                }}
                                className="w-full md:w-auto px-8 py-3.5 bg-[#C9A227] hover:bg-[#C9A227]/90 text-black rounded-xl text-xs font-black transition duration-300 shadow-md cursor-pointer flex items-center justify-center gap-2"
                              >
                                {profileSavedSuccess ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{language === 'ar' ? 'تم حفظ التغييرات بنجاح!' : 'Changes Saved Successfully!'}</span>
                                  </>
                                ) : (
                                  <span>{language === 'ar' ? 'حفظ تعديلات الملف الشخصي' : 'Save Profile Changes'}</span>
                                )}
                              </button>
                            </div>
                          </div>
                        )}



                        {/* SUB-VIEW 3: SAVED ADDRESSES */}
                        {activeAccountSection === 'addresses' && (
                          <div className="space-y-5 animate-none">
                            <div className="border-b border-[#112d22] pb-3">
                              <h3 className="text-lg font-bold text-[#C9A227]">
                                {language === 'ar' ? 'العناوين المحفوظة ومواقع التوصيل' : 'Saved Addresses & Locations'}
                              </h3>
                              <p className="text-xs text-gray-400 mt-1">
                                {language === 'ar' ? 'إدارة عناوينك المسجلة لتسريع طلب تذاكر السفر وتوصيل التأشيرات أو التنسيق من موقعك' : 'Manage your home, work, or travel addresses for effortless pickup or dropoff coordination'}
                              </p>
                            </div>

                            <div className="space-y-3">
                              {accountAddresses.map((addr, i) => (
                                <div key={i} className="p-4 bg-[#0b1d16] border border-[#112d22] rounded-2xl flex justify-between items-center hover:border-emerald-900/60 transition-all duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#122b21]/60 rounded-xl text-[#C9A227]">
                                      <MapPin className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs text-white font-bold">{addr}</span>
                                  </div>
                                  <button
                                    onClick={() => setAccountAddresses(accountAddresses.filter((_, idx) => idx !== i))}
                                    className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1"
                                  >
                                    {language === 'ar' ? 'حذف' : 'Delete'}
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 flex gap-2">
                              <input
                                type="text"
                                placeholder={language === 'ar' ? 'أضف عنواناً جديداً... (مثال: عمان - شارع الجاردنز)' : 'Add a new location (e.g. Amman - Gardens St.)'}
                                value={newAddressInput}
                                onChange={e => setNewAddressInput(e.target.value)}
                                className="flex-1 bg-[#0b1d16] border border-[#112d22] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                              />
                              <button
                                onClick={() => {
                                  if (newAddressInput.trim()) {
                                    setAccountAddresses([...accountAddresses, newAddressInput.trim()]);
                                    setNewAddressInput('');
                                  }
                                }}
                                className="px-6 py-2.5 bg-[#C9A227] hover:bg-[#C9A227]/90 text-black text-xs font-bold rounded-xl transition"
                              >
                                {language === 'ar' ? 'إضافة' : 'Add'}
                              </button>
                            </div>
                          </div>
                        )}


                        {/* SUB-VIEW 5: NOTIFICATIONS TIMELINE */}
                        {activeAccountSection === 'notifications' && (
                          <div className="space-y-5 animate-none">
                            <div className="border-b border-[#112d22] pb-3">
                              <h3 className="text-lg font-bold text-[#C9A227]">
                                {language === 'ar' ? 'سجل التنبيهات والإشعارات المستلمة' : 'Notifications Hub & Activity'}
                              </h3>
                              <p className="text-xs text-gray-400 mt-1">
                                {language === 'ar' ? 'تتبع آخر تطورات حجوزاتك، العروض الحصرية، وإرساليات مكاتب السياحة' : 'Track travel alerts, dynamic offers, and instant communication logs'}
                              </p>
                            </div>

                            {/* Notification Control Switches */}
                            <div className="bg-black/20 border border-[#112d22] rounded-2xl p-4 space-y-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="block text-xs font-bold text-white">
                                    {language === 'ar' ? 'تلقي إشعارات الحجز عبر الهاتف' : 'Push Notification Alerts'}
                                  </span>
                                  <span className="text-[10px] text-gray-400 block mt-0.5">
                                    {language === 'ar' ? 'الحصول على تحديثات فورية لحالة حجز رحلتك' : 'Get instant flight, bus or hotel booking updates'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                  className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                                    notificationsEnabled ? 'bg-[#C9A227]' : 'bg-gray-800'
                                  }`}
                                >
                                  <span className={`w-4 h-4 bg-black rounded-full absolute top-1 transition-all ${
                                    notificationsEnabled 
                                      ? (language === 'ar' ? 'left-1' : 'right-1') 
                                      : (language === 'ar' ? 'left-6' : 'right-6')
                                  }`} />
                                </button>
                              </div>

                              <div className="border-t border-[#112d22] pt-4 flex justify-between items-center">
                                <div>
                                  <span className="block text-xs font-bold text-white">
                                    {language === 'ar' ? 'تلقي النشرات والعروض بالبريد الإلكتروني' : 'Email Promotional Newsletters'}
                                  </span>
                                  <span className="text-[10px] text-gray-400 block mt-0.5">
                                    {language === 'ar' ? 'أقوى كوبونات الخصم والرحلات الحصرية' : 'Exclusive discounts, deals, and flight coupons'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setEmailPromoEnabled(!emailPromoEnabled)}
                                  className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                                    emailPromoEnabled ? 'bg-[#C9A227]' : 'bg-gray-800'
                                  }`}
                                >
                                  <span className={`w-4 h-4 bg-black rounded-full absolute top-1 transition-all ${
                                    emailPromoEnabled 
                                      ? (language === 'ar' ? 'left-1' : 'right-1') 
                                      : (language === 'ar' ? 'left-6' : 'right-6')
                                  }`} />
                                </button>
                              </div>
                            </div>

                            {/* Notifications Timeline */}
                            <div className="space-y-3">
                              {notifications.map((n) => {
                                const nBooking = n.bookingId ? bookings.find(b => b.id === n.bookingId) : null;
                                return (
                                  <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-3.5 border rounded-2xl space-y-2 transition-all cursor-pointer ${n.read ? 'bg-[#0b1d16] border-[#112d22] hover:border-emerald-950' : 'bg-[#123329] border-[#C9A227]/50 hover:border-[#C9A227]'}`}
                                  >
                                    {nBooking && (
                                      <div className="flex items-center gap-2 pb-2 border-b border-[#173B2F]/50">
                                        <img 
                                          src={officeLogoImages[nBooking.officeId] || 'https://images.unsplash.com/photo-1599740831146-818456b2af32?auto=format&fit=crop&w=100&h=100&q=80'} 
                                          className="w-8 h-8 rounded-full object-cover border border-[#C9A227]/30"
                                          alt={nBooking.officeName}
                                        />
                                        <span className="font-bold text-xs text-[#C9A227]">{nBooking.officeName}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between items-start pt-1">
                                      <h4 className={`text-xs font-bold ${n.read ? 'text-white' : 'text-[#C9A227]'}`}>
                                        {language === 'ar' ? n.titleAr : n.titleEn}
                                        {!n.read && <span className="ml-2 inline-block w-2 h-2 bg-[#C9A227] rounded-full"></span>}
                                      </h4>
                                      <span className="text-[10px] text-gray-400 font-mono" dir="ltr">
                                        {language === 'ar' ? n.timeAr : n.timeEn}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                      {language === 'ar' ? n.descAr : n.descEn}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* SUB-VIEW 6: CUSTOMER SUPPORT & FAQ Accordion */}
                        {activeAccountSection === 'support' && (
                          <div className="space-y-5 animate-none">
                            <div className="border-b border-[#112d22] pb-3">
                              <h3 className="text-lg font-bold text-[#C9A227]">
                                {language === 'ar' ? 'مركز الدعم الفني والأسئلة الشائعة' : 'Customer Support & Help Center'}
                              </h3>
                              <p className="text-xs text-gray-400 mt-1">
                                {language === 'ar' ? 'اقرأ الأسئلة الشائعة أو أرسل شكوى/طلب وسنقوم بخدمتك فوراً' : 'Browse common answers or open a support ticket to get help instantly'}
                              </p>
                            </div>

                            {/* FAQ Accordion */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-extrabold text-[#C9A227] uppercase tracking-wider mb-2">
                                {language === 'ar' ? 'الأسئلة الأكثر تكراراً' : 'Frequently Asked Questions (FAQs)'}
                              </h4>
                              
                              {[
                                {
                                  qAr: 'كيف يمكنني إلغاء أو تعديل الحجز؟',
                                  qEn: 'How can I edit or cancel my booking?',
                                  aAr: 'يمكنك تعديل أو إلغاء حجزك بسهولة بالدخول على تبويب "حجوزاتي"، واختيار الحجز النشط ثم النقر على "طلب إلغاء" أو مراسلة مكتب السياحة والتمثيل المباشر عبر المحادثة الفورية بلمسة واحدة.',
                                  aEn: 'Go to the "Bookings" tab, select your trip, and click "Request Cancellation" or instantly chat with the specific office.'
                                },
                                {
                                  qAr: 'هل معلومات الدفع والبطاقة آمنة؟',
                                  qEn: 'Is my payment information fully secure?',
                                  aAr: 'نعم بالتأكيد. منصة سفرتك مشفرة بأقوى خوارزميات الأمن والحماية PCI-DSS ومتكاملة مباشرة مع بوابات الدفع الرسمية المعتمدة في الأردن (CliQ وبوابات البنوك) دون تخزين كلمات السر الخاصة بك.',
                                  aEn: 'Yes, absolutely. We use industry-standard PCI-DSS encryption and integrate directly with official gateways (CliQ / Visa) without caching details.'
                                }
                              ].map((faq, idx) => {
                                const isOpen = activeFaqIndex === idx;
                                return (
                                  <div key={idx} className="bg-[#0b1d16] border border-[#112d22] rounded-2xl overflow-hidden transition-all duration-300">
                                    <button
                                      onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                                      className="w-full px-4 py-3.5 flex justify-between items-center text-xs font-bold text-white text-right cursor-pointer hover:bg-black/10"
                                    >
                                      <span>{language === 'ar' ? faq.qAr : faq.qEn}</span>
                                      <ChevronRight className={`w-4 h-4 transition-transform text-[#C9A227] ${isOpen ? 'rotate-90' : (language === 'ar' ? 'rotate-180' : '')}`} />
                                    </button>
                                    
                                    {isOpen && (
                                      <div className="px-4 pb-4 pt-1 text-xs text-gray-400 border-t border-[#112d22]/50 leading-relaxed bg-black/10">
                                        {language === 'ar' ? faq.aAr : faq.aEn}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Contact support ticket form */}
                            <div className="bg-[#0b1d16] border border-[#112d22] rounded-2xl p-5 space-y-4">
                              <h4 className="text-xs font-extrabold text-[#C9A227] uppercase tracking-wider">
                                {language === 'ar' ? 'مراسلة الدعم الفني وفتح تذكرة مساعدة' : 'Open a Customer Support Ticket'}
                              </h4>

                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 block">{language === 'ar' ? 'عنوان الموضوع' : 'Subject'}</label>
                                  <input
                                    type="text"
                                    placeholder={language === 'ar' ? 'مثال: تفاصيل الحجز الفندقي...' : 'e.g. Booking details...'}
                                    value={supportSubject}
                                    onChange={e => setSupportSubject(e.target.value)}
                                    className="w-full bg-black/25 border border-[#112d22] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 block">{language === 'ar' ? 'تفاصيل الرسالة' : 'Message Details'}</label>
                                  <textarea
                                    rows={3}
                                    placeholder={language === 'ar' ? 'اكتب تفاصيل طلبك بالتفصيل هنا...' : 'Write details of your issue here...'}
                                    value={supportMessage}
                                    onChange={e => setSupportMessage(e.target.value)}
                                    className="w-full bg-black/25 border border-[#112d22] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A227]"
                                  />
                                </div>

                                <button
                                  onClick={() => {
                                    if (supportSubject.trim() && supportMessage.trim()) {
                                      setSupportSubject('');
                                      setSupportMessage('');
                                      setSupportSuccessToast(language === 'ar' ? 'تم إرسال رسالتك لفريق الدعم بنجاح! سيتم الرد عليك في غضون 24 ساعة.' : 'Support ticket submitted successfully! We will get back to you within 24 hours.');
                                      setTimeout(() => setSupportSuccessToast(null), 5000);
                                    }
                                  }}
                                  className="w-full py-3 bg-[#122b21] hover:bg-[#C9A227] hover:text-black text-[#C9A227] border border-[#C9A227]/30 rounded-xl text-xs font-bold transition active:scale-95"
                                >
                                  {language === 'ar' ? 'إرسال طلب المساعدة' : 'Send Ticket'}
                                </button>

                                {supportSuccessToast && (
                                  <div className="p-3 bg-emerald-950/80 border border-emerald-900 text-emerald-400 rounded-xl text-[11px] text-center font-bold">
                                    {supportSuccessToast}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SUB-VIEW 7: SETTINGS & PREFERENCES */}
                        {activeAccountSection === 'settings' && (
                          <div className="space-y-5 animate-none">
                            <div className="border-b border-[#112d22] pb-3">
                              <h3 className="text-lg font-bold text-[#C9A227]">
                                {language === 'ar' ? 'إعدادات الحساب والنظام العام' : 'System Preferences & Settings'}
                              </h3>
                              <p className="text-xs text-gray-400 mt-1">
                                {language === 'ar' ? 'تبديل لغة المنصة، اختبار صلاحيات الدخول، وتسجيل الخروج بكل أمان' : 'Toggle platform language, explore partner portals, or log out of your session'}
                              </p>
                            </div>

                            <div className="space-y-4">
                              {/* Language Switch */}
                              <div className="p-4 bg-[#0b1d16] border border-[#112d22] rounded-2xl flex justify-between items-center hover:border-emerald-900/60 transition">
                                <div>
                                  <span className="block text-xs font-bold text-white">
                                    {language === 'ar' ? 'لغة واجهة المنصة' : 'Application Language'}
                                  </span>
                                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                                    {language === 'ar' ? 'تغيير اتجاه التطبيق بين العربية والإنجليزية' : 'Toggle between Arabic and English displays'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                                  className="px-4 py-2 bg-[#C9A227] hover:bg-[#C9A227]/90 text-black text-xs font-bold rounded-xl transition"
                                >
                                  {language === 'en' ? 'عربي' : 'English'}
                                </button>
                              </div>

                              {/* Switches Roles (Convenience for Testing) */}
                              <div className="p-4 bg-[#0b1d16] border border-[#112d22] rounded-2xl flex justify-between items-center hover:border-emerald-900/60 transition">
                                <div>
                                  <span className="block text-xs font-bold text-white">
                                    {language === 'ar' ? 'تبديل الدور (محيط التجربة)' : 'Switch Portal Role (Sandbox)'}
                                  </span>
                                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                                    {language === 'ar' ? 'استعرض شاشات مكتب السياحة أو لوحة الإدارة للتحقق' : 'Explore partner workspace or system admin panel'}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => onSwitchRole('office')}
                                    className="px-3 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-900 rounded-xl text-xs font-bold transition"
                                  >
                                    {language === 'ar' ? 'المكتب' : 'Office'}
                                  </button>
                                  <button
                                    onClick={() => onSwitchRole('admin')}
                                    className="px-3 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-900 rounded-xl text-xs font-bold transition"
                                  >
                                    {language === 'ar' ? 'الأدمن' : 'Admin'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Sign Out Action */}
                            <div className="pt-4 border-t border-[#112d22] flex justify-end">
                              <button
                                onClick={onLogout}
                                className="w-full py-3.5 bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/40 hover:border-red-600 rounded-xl text-xs font-bold transition duration-300"
                              >
                                {language === 'ar' ? 'تسجيل الخروج من سفرتك' : 'Sign Out from Safretak'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                      </div>

                      {/* Content Panel Footer Accent */}
                      <div className="text-center text-[10px] text-gray-500 font-mono mt-6 border-t border-[#112d22]/30 pt-3">
                        SAFRETK PLATFORM v2.4.0 • 2026 SECURED PCI-DSS
                      </div>

                    </div>
                  </div>

                </div>

                {/* Toast Notification Banner */}
                {shareToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-24 left-4 right-4 z-50 bg-[#C9A227] text-black font-extrabold text-center py-3.5 px-6 rounded-2xl shadow-2xl text-xs"
                  >
                    {shareToast}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Interactive Notification Modal */}
      <AnimatePresence>
        {activeNotificationModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#05130e] border border-[#112d22] rounded-[28px] max-w-lg w-full p-6 shadow-2xl relative text-left rtl:text-right"
              dir={dir}
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#112d22]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#C9A227]" />
                  <span>{language === 'ar' ? activeNotificationModal.notification.titleAr : activeNotificationModal.notification.titleEn}</span>
                </h3>
                <button
                  onClick={() => setActiveNotificationModal(null)}
                  className="p-1.5 rounded-full hover:bg-[#0E4B2E] text-gray-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed">
                  {language === 'ar' ? activeNotificationModal.notification.descAr : activeNotificationModal.notification.descEn}
                </p>

                {activeNotificationModal.booking && (
                  <div className="bg-[#123329] border border-[#173B2F] rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-[#173B2F]">
                      <img 
                        src={officeLogoImages[activeNotificationModal.booking.officeId] || 'https://images.unsplash.com/photo-1599740831146-818456b2af32?auto=format&fit=crop&w=100&h=100&q=80'} 
                        className="w-10 h-10 rounded-full object-cover border border-[#C9A227]"
                        alt={activeNotificationModal.booking.officeName}
                      />
                      <div>
                        <span className="text-[10px] text-gray-400 block">{language === 'ar' ? 'مرسل من:' : 'From:'}</span>
                        <span className="font-bold text-sm text-white">{activeNotificationModal.booking.officeName}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start pt-1">
                      <div>
                        <span className="font-mono text-xs text-[#C9A227]/90 font-bold">{activeNotificationModal.booking.id}</span>
                        <h4 className="text-sm font-bold text-white mt-1">{tf(activeNotificationModal.booking.serviceName)}</h4>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                        activeNotificationModal.booking.status === 'Confirmed' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' 
                          : 'bg-yellow-950 text-[#C9A227]/90 border border-yellow-900'
                      }`}>
                        {activeNotificationModal.booking.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#173B2F] grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-0.5">{language === 'ar' ? 'المسافر:' : 'Traveler:'}</span>
                        <span className="text-white font-medium">{activeNotificationModal.booking.travelerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">{language === 'ar' ? 'المكتب:' : 'Agency:'}</span>
                        <span className="text-white font-medium">{activeNotificationModal.booking.officeName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">{language === 'ar' ? 'تاريخ الحجز:' : 'Date:'}</span>
                        <span className="text-white font-medium">{activeNotificationModal.booking.bookingDetails.date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">{language === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                        <span className="text-[#C9A227] font-bold">{activeNotificationModal.booking.totalPrice} JOD</span>
                      </div>
                    </div>
                    {activeNotificationModal.notification.type === 'PAYMENT_RECEIPT' && (
                      <div className="pt-3 border-t border-[#173B2F] space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-emerald-400 font-bold">{language === 'ar' ? 'تم الدفع بالكامل' : 'Paid in Full'}</span>
                          <span className="text-white bg-emerald-950 px-2 py-1 rounded">{activeNotificationModal.booking.paymentMethod}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono text-center">
                          {language === 'ar' ? 'رقم الإيصال:' : 'Receipt No:'} {activeNotificationModal.booking.qrCode}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#112d22] flex justify-end gap-3">
                {activeNotificationModal.requiresAction ? (
                  <>
                    <button
                      onClick={() => setActiveNotificationModal(null)}
                      className="px-5 py-2.5 bg-[#123329] text-gray-300 hover:text-white border border-[#173B2F] rounded-xl text-xs font-bold transition"
                    >
                      {language === 'ar' ? 'لاحقاً' : 'Later'}
                    </button>
                    <button
                      onClick={() => {
                        // Confirm action
                        setActiveNotificationModal(null);
                        setShareToast(language === 'ar' ? 'تم تأكيد الإجراء بنجاح' : 'Action confirmed successfully');
                        setTimeout(() => setShareToast(null), 3000);
                      }}
                      className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#C9A227]/90 text-black rounded-xl text-xs font-bold transition"
                    >
                      {language === 'ar' ? 'تأكيد وموافقة' : 'Confirm & Accept'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveNotificationModal(null)}
                      className="px-5 py-2.5 bg-[#123329] text-gray-300 hover:text-white border border-[#173B2F] rounded-xl text-xs font-bold transition"
                    >
                      {language === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                    {(activeNotificationModal.notification.type === 'BOOKING_CONFIRMED' || activeNotificationModal.notification.type === 'PAYMENT_RECEIPT') && (
                      <button
                        onClick={() => {
                          setActiveNotificationModal(null);
                          setActiveTab('bookings');
                          setActiveChatBooking(activeNotificationModal.booking);
                        }}
                        className="px-5 py-2.5 bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 hover:text-white rounded-xl text-xs font-bold transition"
                      >
                        {language === 'ar' ? 'عرض تفاصيل الحجز' : 'View Booking Details'}
                      </button>
                    )}
                    {activeNotificationModal.notification.type === 'UPLOAD_DOCUMENTS' && (
                      <button
                        onClick={() => {
                          setActiveNotificationModal(null);
                          setActiveTab('bookings');
                          setActiveChatBooking(activeNotificationModal.booking);
                          setShareToast(language === 'ar' ? 'تم تحويلك لمركز رفع المستندات في الحجز' : 'Redirected to Document Upload area');
                          setTimeout(() => setShareToast(null), 3000);
                        }}
                        className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#C9A227]/90 text-black rounded-xl text-xs font-bold transition"
                      >
                        {language === 'ar' ? 'رفع المستندات الآن' : 'Upload Documents Now'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile bottom navigation bar */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#123329] border-t border-[#173B2F] px-4 py-2 flex justify-around items-center text-[10px]">
        <button
          onClick={() => {
            setActiveTab('home');
            setSelectedItem(null);
            setIsBookingMode(false);
            setSelectedOfficeProfile(null);
          }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-[#C9A227]/90 font-bold' : 'text-gray-400'}`}
        >
          <Compass className="w-5 h-5" />
          <span>{t('nav.home')}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('services');
            setSelectedItem(null);
            setIsBookingMode(false);
            setSelectedOfficeProfile(null);
          }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'services' ? 'text-[#C9A227]/90 font-bold' : 'text-gray-400'}`}
        >
          <Search className="w-5 h-5" />
          <span>{t('nav.services')}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('bookings');
            setSelectedItem(null);
            setIsBookingMode(false);
            setSelectedOfficeProfile(null);
          }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'bookings' ? 'text-[#C9A227]/90 font-bold' : 'text-gray-400'}`}
        >
          <Ticket className="w-5 h-5" />
          <span>{t('nav.bookings')}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('account');
            setSelectedItem(null);
            setIsBookingMode(false);
            setSelectedOfficeProfile(null);
          }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'account' ? 'text-[#C9A227]/90 font-bold' : 'text-gray-400'}`}
        >
          <User className="w-5 h-5" />
          <span>{t('nav.account')}</span>
        </button>
      </footer>
    </div>
  );
};
