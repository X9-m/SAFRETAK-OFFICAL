import sys

target = """    if (booking) {
      if (nextStatus === 'Confirmed') {
        window.dispatchEvent(new CustomEvent('addNotification', {"""

replacement = """    if (booking) {
      if (nextStatus === 'Confirmed') {
        const notif = {
          id: Date.now(),
          type: 'PAYMENT_RECEIPT',
          bookingId: booking.id,
          titleAr: 'تم تأكيد حجزك واستلام الدفعة',
          titleEn: 'Booking Confirmed & Payment Received',
          descAr: `قام مكتب ${booking.officeName} بتأكيد حجزك وتم استلام الدفعة النقدية بنجاح. اضغط هنا لعرض تفاصيل الحجز والإيصال.`,
          descEn: `${booking.officeName} confirmed your booking and payment. Click to view receipt.`,
          timeAr: 'الآن',
          timeEn: 'Just now',
          read: false,
          requiresAction: false
        };
        const existing = JSON.parse(localStorage.getItem('safretk_notifications') || '[]');
        localStorage.setItem('safretk_notifications', JSON.stringify([notif, ...existing]));
        window.dispatchEvent(new CustomEvent('addNotification', {"""

content = open('src/components/OfficePortal.tsx').read()
content = content.replace(target, replacement)
open('src/components/OfficePortal.tsx', 'w').write(content)

target2 = """      } else if (nextStatus === 'Cancelled') {
        window.dispatchEvent(new CustomEvent('addNotification', {"""

replacement2 = """      } else if (nextStatus === 'Cancelled') {
        const notif = {
          id: Date.now(),
          type: 'BOOKING_CANCELLED',
          bookingId: booking.id,
          titleAr: 'تم إلغاء الحجز',
          titleEn: 'Booking Cancelled',
          descAr: `نعتذر، قام مكتب ${booking.officeName} بإلغاء طلب الحجز الخاص بك لعدم توفر شواغر أو لسبب آخر.`,
          descEn: `Sorry, ${booking.officeName} has cancelled your booking request.`,
          timeAr: 'الآن',
          timeEn: 'Just now',
          read: false,
          requiresAction: false
        };
        const existing = JSON.parse(localStorage.getItem('safretk_notifications') || '[]');
        localStorage.setItem('safretk_notifications', JSON.stringify([notif, ...existing]));
        window.dispatchEvent(new CustomEvent('addNotification', {"""

content = open('src/components/OfficePortal.tsx').read()
content = content.replace(target2, replacement2)
open('src/components/OfficePortal.tsx', 'w').write(content)

