import sys

target = """                    <div className="pt-3 border-t border-[#173B2F] grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-0.5">{language === 'ar' ? 'المسافر:' : 'Traveler:'}</span>
                        <span className="text-white font-medium">{activeNotificationModal.booking.travelerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">{language === 'ar' ? 'المكتب:' : 'Agency:'}</span>
                        <span className="text-white font-medium">{activeNotificationModal.booking.officeName}</span>
                      </div>
                    </div>
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
                    )}"""

replacement = """                    <div className="pt-3 border-t border-[#173B2F] grid grid-cols-2 gap-3 text-xs">
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
                    )}"""

content = open('src/components/TravelerPortal.tsx').read()
content = content.replace(target, replacement)
open('src/components/TravelerPortal.tsx', 'w').write(content)
