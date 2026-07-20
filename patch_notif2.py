import sys

target = """                            <div className="space-y-3">
                              {notifications.map((n) => (
                                <div
                                   key={n.id}
                                   onClick={() => handleNotificationClick(n)}
                                  className={`p-3.5 border rounded-2xl space-y-1.5 transition-all cursor-pointer ${n.read ? 'bg-[#0b1d16] border-[#112d22] hover:border-emerald-950' : 'bg-[#123329] border-[#C9A227]/50 hover:border-[#C9A227]'}`}
                                >
                                  <div className="flex justify-between items-start">
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
                              ))}
                            </div>"""

content = open('src/components/TravelerPortal.tsx').read()
idx = content.find('{notifications.map((n) => (')
if idx != -1:
    end_idx = content.find('</div>\n                              ))}', idx) + len('</div>\n                              ))}')
    target = content[idx:end_idx]
    
    replacement = """{notifications.map((n) => {
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
                              })}"""
    
    content = content[:idx] + replacement + content[end_idx:]
    open('src/components/TravelerPortal.tsx', 'w').write(content)
    print("Replaced!")
else:
    print("Not found")
