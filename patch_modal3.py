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
              </div>"""

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
              </div>"""

content = open('src/components/TravelerPortal.tsx').read()
content = content.replace(target, replacement)
open('src/components/TravelerPortal.tsx', 'w').write(content)
