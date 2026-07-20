import sys

target = """                <p className="text-xs text-gray-300 leading-relaxed">
                  {language === 'ar' ? activeNotificationModal.notification.descAr : activeNotificationModal.notification.descEn}
                </p>

                {activeNotificationModal.booking && (
                  <div className="bg-[#123329] border border-[#173B2F] rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs text-[#C9A227]/90 font-bold">{activeNotificationModal.booking.id}</span>
                        <h4 className="text-sm font-bold text-white mt-1">{tf(activeNotificationModal.booking.serviceName)}</h4>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${"""

replacement = """                <p className="text-xs text-gray-300 leading-relaxed">
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
                      <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${"""

content = open('src/components/TravelerPortal.tsx').read()
content = content.replace(target, replacement)
open('src/components/TravelerPortal.tsx', 'w').write(content)
