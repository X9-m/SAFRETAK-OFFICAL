import sys

target = """                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-2.5 rounded-xl border cursor-pointer hover:bg-[#1A4234] transition-colors ${n.read ? 'border-[#173B2F] bg-[#0A211A]/40' : 'border-[#C9A227]/50 bg-[#123329] hover:border-[#C9A227]'} text-xs`}
                          >
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
                        ))"""

replacement = """                        notifications.map(n => {
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
                        })"""

content = open('src/components/TravelerPortal.tsx').read()
content = content.replace(target, replacement)
open('src/components/TravelerPortal.tsx', 'w').write(content)
