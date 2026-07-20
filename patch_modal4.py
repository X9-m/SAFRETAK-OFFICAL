import sys

target = """                ) : (
                  <>
                    <button
                      onClick={() => setActiveNotificationModal(null)}
                      className="px-5 py-2.5 bg-[#123329] text-gray-300 hover:text-white border border-[#173B2F] rounded-xl text-xs font-bold transition"
                    >
                      {language === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                    {activeNotificationModal.notification.type === 'BOOKING_CONFIRMED' && (
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
                    )}"""

replacement = """                ) : (
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
                    )}"""

content = open('src/components/TravelerPortal.tsx').read()
content = content.replace(target, replacement)
open('src/components/TravelerPortal.tsx', 'w').write(content)
