import sys

target = """  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'BOOKING_UPDATE',
      titleAr: 'تحديث حالة الحجز',
      titleEn: 'Booking Update',
      descAr: 'تم تأكيد حجزك لرحلة وادي رم الاستكشافية. يمكنك الآن عرض تذاكر الرحلة والإيصال.',
      descEn: 'Your booking for Wadi Rum Expedition is confirmed. View tickets now.',
      timeAr: 'منذ ساعتين',
      timeEn: '2 hours ago',
      read: false,
      requiresAction: false
    },
    {
      id: 2,
      type: 'PROMO',
      titleAr: 'خصم 20% على فنادق العقبة',
      titleEn: '20% off Aqaba Hotels',
      descAr: 'استخدم الكود AQABA20 عند حجز أي فندق في العقبة خلال هذا الأسبوع.',
      descEn: 'Use code AQABA20 for any Aqaba hotel booking this week.',
      timeAr: 'منذ يوم',
      timeEn: '1 day ago',
      read: true,
      requiresAction: false
    }
  ]);"""

replacement = """  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('safretk_notifications');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [
      {
        id: 1,
        type: 'PROMO',
        titleAr: 'مرحباً بك في سفرتك!',
        titleEn: 'Welcome to Safretak!',
        descAr: 'اكتشف أفضل الرحلات والعروض السياحية مع أقوى مكاتب السياحة في الأردن.',
        descEn: 'Discover the best tours and offers with top agencies in Jordan.',
        timeAr: 'الآن',
        timeEn: 'Just now',
        read: false,
        requiresAction: false
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('safretk_notifications', JSON.stringify(notifications));
  }, [notifications]);"""

content = open('src/components/TravelerPortal.tsx').read()
content = content.replace(target, replacement)
open('src/components/TravelerPortal.tsx', 'w').write(content)
print("done")
