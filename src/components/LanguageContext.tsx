import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  dir: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tf: (text: string | null | undefined) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // General
    'app.name': 'Safretak',
    'app.tagline': 'Your Jordanian Travel Companion',
    'role.traveler': 'Traveler',
    'role.office': 'Travel Office',
    'role.admin': 'System Admin',
    'role.selection': 'Choose Workspace',
    'btn.login': 'Log In',
    'btn.register': 'Register',
    'btn.logout': 'Log Out',
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.book_now': 'Book Now',
    'btn.confirm': 'Confirm',
    'btn.reject': 'Reject',
    'btn.submit': 'Submit',
    'btn.back': 'Back',
    'btn.apply': 'Apply',
    'btn.chat': 'Chat with Office',
    'status.loading': 'Loading content...',
    'status.empty': 'No items found',
    'status.error': 'An error occurred. Please try again.',
    'status.success': 'Operation completed successfully!',
    'common.search': 'Search services, cities or offices...',
    'common.filter': 'Filters',
    'common.sort': 'Sort By',
    'common.price': 'Price',
    'common.rating': 'Rating',
    'common.jod': 'JOD',
    'common.days': 'Days',
    'common.seats': 'Seats remaining',
    'common.duration': 'Duration',
    'common.details': 'Details',
    'common.status': 'Status',
    'common.phone': 'Phone Number',
    'common.otp': 'Verification Code (OTP)',
    'common.fullname': 'Full Name',
    'common.email': 'Email Address',

    // Bottom Navigation
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.bookings': 'Bookings',
    'nav.favorites': 'Favorites',
    'nav.account': 'Account',

    // 14 Services Categories
    'cat.domestic_trips': 'Domestic Trips',
    'cat.intl_trips': 'International Trips',
    'cat.hajj_umrah': 'Hajj & Umrah',
    'cat.hotels': 'Hotels',
    'cat.apartments': 'Apartments',
    'cat.resorts': 'Resorts',
    'cat.villas': 'Villas',
    'cat.flights': 'Flight Tickets',
    'cat.car_rental': 'Car Rental',
    'cat.buses': 'Buses',
    'cat.trains': 'Trains',
    'cat.insurance': 'Travel Insurance',
    'cat.visa_services': 'Visa Services',
    'cat.consultation': 'Travel Consultations',

    // Traveler Home Page
    'home.search_placeholder': 'Where do you want to go in Jordan or abroad?',
    'home.banners': 'Promotional Offers',
    'home.categories': 'Travel Services',
    'home.featured_offers': 'Featured Packages',
    'home.popular_destinations': 'Popular Destinations',
    'home.nearby_trips': 'Nearby Activities',
    'home.top_offices': 'Top-Rated Travel Offices',
    'home.latest_deals': 'Latest Flash Deals',

    // Filters
    'filter.all': 'All',
    'filter.city': 'City / Location',
    'filter.stars': 'Star Rating',
    'filter.price_range': 'Price Range',
    'filter.car_type': 'Car Class',
    'filter.cabin_class': 'Cabin Class',
    'filter.trip_type': 'Flight Type',

    // Booking Details
    'book.dates': 'Booking Dates',
    'book.guests': 'Number of Guests',
    'book.rooms': 'Number of Rooms',
    'book.seats': 'Number of Seats',
    'book.summary': 'Booking Price Summary',
    'book.subtotal': 'Subtotal',
    'book.coupon': 'Apply Coupon',
    'book.discount': 'Discount Applied',
    'book.total': 'Total Price',
    'book.terms': 'I agree to the Safretak terms & office cancellation policy',

    // Payments
    'pay.title': 'Choose Payment Method',
    'pay.cliq': 'CliQ (Instant Local Transfer)',
    'pay.efawateer': 'eFAWATEERcom (Bill Payment)',
    'pay.card': 'Credit / Debit Card',
    'pay.cash': 'Cash at Office',
    'pay.now': 'Pay & Confirm Booking',
    'pay.success_title': 'Booking Confirmed!',
    'pay.success_desc': 'Your booking has been completed. You can present the QR code below at the service provider.',
    'pay.booking_no': 'Booking Reference',
    'pay.qr_code': 'Booking QR Code',
    'pay.invoice': 'Download PDF Invoice',
    'pay.share': 'Share Booking Details',

    // Post booking
    'bookings.tabs.pending': 'Pending',
    'bookings.tabs.confirmed': 'Confirmed',
    'bookings.tabs.completed': 'Completed',
    'bookings.tabs.cancelled': 'Cancelled',
    'bookings.details.title': 'Booking Information',
    'bookings.details.ticket': 'Digital Ticket',
    'bookings.details.attached': 'Attached Documents',
    'bookings.rate': 'Rate Your Experience',

    // Office Dashboard
    'office.summary': 'Office Summary',
    'office.balance': 'Available Balance',
    'office.revenue': 'Total Sales',
    'office.total_bookings': 'Active Bookings',
    'office.plan': 'Subscription Plan',
    'office.manage_services': 'Manage Services',
    'office.manage_bookings': 'Client Bookings',
    'office.employees': 'Employee Permissions',
    'office.reports': 'Business Reports',
    'office.add_service': 'Create New Listing',

    // Admin Dashboard
    'admin.dashboard': 'Platform Operations Control',
    'admin.stats': 'Global Analytics',
    'admin.users': 'Travelers Registry',
    'admin.offices': 'Travel Agencies Approval',
    'admin.complaints': 'Client Complaints',
    'admin.coupons': 'Promo Codes Manager',
    'admin.ads': 'App Advertisements',
    'admin.cities': 'Jordanian Cities & Countries',
    'admin.revenue': 'Platform Revenue Sharing',
  },
  ar: {
    // General
    'app.name': 'سفرتك',
    'app.tagline': 'رفيق سفرك الأردني المعتمد',
    'role.traveler': 'مسافر',
    'role.office': 'مكتب سياحة وسفر',
    'role.admin': 'مدير النظام',
    'role.selection': 'اختر بيئة العمل',
    'btn.login': 'تسجيل الدخول',
    'btn.register': 'إنشاء حساب جديد',
    'btn.logout': 'تسجيل الخروج',
    'btn.save': 'حفظ والتعديل',
    'btn.cancel': 'إلغاء',
    'btn.book_now': 'احجز الآن',
    'btn.confirm': 'تأكيد وقبول',
    'btn.reject': 'رفض الطلب',
    'btn.submit': 'إرسال',
    'btn.back': 'رجوع',
    'btn.apply': 'تطبيق',
    'btn.chat': 'المحادثة مع المكتب',
    'status.loading': 'جاري تحميل المحتوى...',
    'status.empty': 'لم يتم العثور على نتائج',
    'status.error': 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً',
    'status.success': 'تمت العملية بنجاح!',
    'common.search': 'ابحث عن خدمات، مدن أو مكاتب سياحية...',
    'common.filter': 'تصفية النتائج',
    'common.sort': 'ترتيب حسب',
    'common.price': 'السعر',
    'common.rating': 'التقييم',
    'common.jod': 'د.أ',
    'common.days': 'أيام',
    'common.seats': 'المقاعد المتبقية',
    'common.duration': 'المدة',
    'common.details': 'التفاصيل الكاملة',
    'common.status': 'الحالة',
    'common.phone': 'رقم الهاتف الأردني',
    'common.otp': 'رمز التحقق (OTP)',
    'common.fullname': 'الاسم الكامل',
    'common.email': 'البريد الإلكتروني',

    // Bottom Navigation
    'nav.home': 'الرئيسية',
    'nav.services': 'الخدمات',
    'nav.bookings': 'حجوزاتي',
    'nav.favorites': 'المفضلة',
    'nav.account': 'حسابي',

    // 14 Services Categories
    'cat.domestic_trips': 'رحلات داخلية',
    'cat.intl_trips': 'رحلات دولية',
    'cat.hajj_umrah': 'حج وعمرة',
    'cat.hotels': 'فنادق',
    'cat.apartments': 'شقق فندقية',
    'cat.resorts': 'منتجعات',
    'cat.villas': 'فلل خاصة',
    'cat.flights': 'تذاكر طيران',
    'cat.car_rental': 'تأجير سيارات',
    'cat.buses': 'حافلات نقل',
    'cat.trains': 'رحلات قطار',
    'cat.insurance': 'تأمين سفر',
    'cat.visa_services': 'خدمات تأشيرات',
    'cat.consultation': 'استشارات سفر',

    // Traveler Home Page
    'home.search_placeholder': 'أين ترغب في الذهاب داخل الأردن أو خارجه؟',
    'home.banners': 'عروض ترويجية حصرية',
    'home.categories': 'كل خدمات السفر',
    'home.featured_offers': 'باقات سياحية مميزة',
    'home.popular_destinations': 'وجهات شهيرة في الأردن',
    'home.nearby_trips': 'رحلات وأنشطة قريبة',
    'home.top_offices': 'أبرز مكاتب السياحة المعتمدة',
    'home.latest_deals': 'عروض اللحظة الأخيرة',

    // Filters
    'filter.all': 'الكل',
    'filter.city': 'المدينة / الموقع',
    'filter.stars': 'تصنيف النجوم',
    'filter.price_range': 'نطاق السعر',
    'filter.car_type': 'فئة السيارة',
    'filter.cabin_class': 'درجة السفر',
    'filter.trip_type': 'نوع تذكرة الطيران',

    // Booking Details
    'book.dates': 'تواريخ الحجز',
    'book.guests': 'عدد النزلاء / الأشخاص',
    'book.rooms': 'عدد الغرف المطلوبة',
    'book.seats': 'عدد المقاعد المطلوبة',
    'book.summary': 'ملخص تكلفة الحجز',
    'book.subtotal': 'المجموع الفرعي',
    'book.coupon': 'كود الخصم',
    'book.discount': 'الخصم المطبق',
    'book.total': 'التكلفة الإجمالية',
    'book.terms': 'أوافق على شروط تطبيق سفرتك وسياسة إلغاء المكتب السياحي',

    // Payments
    'pay.title': 'اختر طريقة الدفع الآمنة',
    'pay.cliq': 'كليك CliQ (تحويل محلي فوري)',
    'pay.efawateer': 'إي فواتيركم eFAWATEERcom',
    'pay.card': 'بطاقة فيزا / ماستركارد',
    'pay.cash': 'الدفع نقداً في مقر المكتب السياحي',
    'pay.now': 'ادفع وأكد حجزك الآن',
    'pay.success_title': 'تم تأكيد الحجز بنجاح!',
    'pay.success_desc': 'لقد اكتمل حجزك بنجاح. يرجى إبراز رمز الاستجابة السريعة (QR Code) التالي عند مراجعة مزود الخدمة.',
    'pay.booking_no': 'رقم المرجع للحجز',
    'pay.qr_code': 'رمز كيو آر الرقمي',
    'pay.invoice': 'تحميل الفاتورة الرسمية PDF',
    'pay.share': 'مشاركة تفاصيل الحجز',

    // Post booking
    'bookings.tabs.pending': 'قيد الانتظار',
    'bookings.tabs.confirmed': 'مؤكد',
    'bookings.tabs.completed': 'مكتمل',
    'bookings.tabs.cancelled': 'ملغي',
    'bookings.details.title': 'تفاصيل وبيانات الحجز',
    'bookings.details.ticket': 'التذكرة الرقمية',
    'bookings.details.attached': 'الملفات والمستندات',
    'bookings.rate': 'تقييم جودة الخدمة',

    // Office Dashboard
    'office.summary': 'مؤشرات الأداء للمكتب',
    'office.balance': 'الرصيد المتاح للتحويل',
    'office.revenue': 'إجمالي المبيعات المحققة',
    'office.total_bookings': 'عدد الحجوزات النشطة',
    'office.plan': 'نوع الاشتراك الحالي',
    'office.manage_services': 'إدارة عروض الخدمات السياحية',
    'office.manage_bookings': 'إدارة حجوزات العملاء الواردة',
    'office.employees': 'صلاحيات الموظفين والفرق',
    'office.reports': 'التقارير المالية والتحليلات',
    'office.add_service': 'إضافة عرض أو خدمة سياحية جديدة',

    // Admin Dashboard
    'admin.dashboard': 'لوحة تحكم وإدارة منصة سفرتك',
    'admin.stats': 'التحليلات والمؤشرات العامة',
    'admin.users': 'سجل المسافرين والعملاء',
    'admin.offices': 'اعتماد ومراقبة المكاتب السياحية',
    'admin.complaints': 'الشكاوى ومراجعات العملاء',
    'admin.coupons': 'إدارة الكوبونات وأكواد الخصم',
    'admin.ads': 'إدارة المساحات الإعلانية والبنرات',
    'admin.cities': 'تعديل المدن الأردنية والدول',
    'admin.revenue': 'إيرادات المنصة والعمولات المتراكمة',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Initial load check from path
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'en') return 'en';
    return 'ar'; // Default to Arabic
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    
    // Sync URL path with language prefix
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'en' || parts[0] === 'ar') {
      parts[0] = lang;
    } else {
      parts.unshift(lang);
    }
    const newPath = '/' + parts.join('/');
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
      window.dispatchEvent(new Event('pushstate'));
    }
  };

  const dir: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  const t = (key: string): string => {
    if (translations[language][key]) {
      return translations[language][key];
    }
    return key;
  };

  const tf = (text: string | null | undefined): string => {
    if (!text) return '';
    // If it's a key in translations, return the translated value
    if (translations[language][text]) {
      return translations[language][text];
    }
    // If it contains " / ", split it and return the correct language portion
    if (text.includes(' / ')) {
      const parts = text.split(' / ');
      if (language === 'ar') {
        return parts[1] ? parts[1].trim() : parts[0].trim();
      } else {
        return parts[0].trim();
      }
    }
    // Robust check for any slash-separated bilingual text (e.g. "English/عربي" or "English /عربي")
    if (text.includes('/') && !text.includes('://')) {
      const parts = text.split('/');
      if (parts.length === 2) {
        const hasArabic = /[\u0600-\u06FF]/.test(parts[1]);
        if (hasArabic) {
          if (language === 'ar') {
            return parts[1].trim();
          } else {
            return parts[0].trim();
          }
        }
      }
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, dir, setLanguage, t, tf }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
