import { Bell, Check, CheckCheck, ChevronLeft, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatDate } from '../domain';
import type { TravelerNotification } from '../types';
import { EmptyState } from './EmptyState';

interface NotificationsPanelProps {
  notifications: TravelerNotification[];
  onClose: () => void;
  onMarkRead: (notificationId?: string) => Promise<void>;
  onOpenBooking: (bookingId: string) => void;
}

export function NotificationsPanel({ notifications, onClose, onMarkRead, onOpenBooking }: NotificationsPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const drawerRef = useRef<HTMLElement>(null);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busyId) onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKeyDown); };
  }, [busyId, onClose]);

  const mark = async (id?: string) => {
    setBusyId(id || 'all'); setError('');
    try { await onMarkRead(id); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحديث الإشعارات.'); }
    finally { setBusyId(null); }
  };

  const openNotification = async (notification: TravelerNotification) => {
    if (!notification.isRead) await mark(notification.id);
    if (notification.bookingId) { onClose(); onOpenBooking(notification.bookingId); }
  };

  return <div className="drawer-backdrop modal-enter" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busyId && onClose()}><aside ref={drawerRef} className="side-drawer drawer-enter" role="dialog" aria-modal="true" aria-label="الإشعارات" tabIndex={-1}><header><div><Bell size={20} /><h2>مركز الإشعارات</h2></div><button type="button" className="icon-button" onClick={onClose} disabled={Boolean(busyId)} aria-label="إغلاق الإشعارات"><X size={19} /></button></header>{error ? <div className="login-alert drawer-alert" role="alert">{error}</div> : null}{notifications.length ? <>{unreadCount > 0 ? <button type="button" className="text-button drawer-read" onClick={() => void mark()} disabled={Boolean(busyId)}>{busyId === 'all' ? <Loader2 className="spin" size={16} /> : <CheckCheck size={16} />}تحديد الكل كمقروء</button> : null}<div className="notification-list">{notifications.map((item) => <article key={item.id} className={`notification-item ${item.isRead ? '' : 'unread'} ${item.bookingId ? 'actionable' : ''}`}><span className="notification-dot" aria-hidden="true" /><button type="button" className="notification-content" onClick={() => void openNotification(item)} disabled={busyId === item.id}><div><h3>{item.titleAr}</h3><p>{item.descriptionAr}</p><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></div>{busyId === item.id ? <Loader2 className="spin" size={16} /> : item.bookingId ? <ChevronLeft size={17} /> : item.isRead ? <Check size={15} /> : null}</button>{!item.isRead && !item.bookingId ? <button type="button" className="notification-read-one" onClick={() => void mark(item.id)} disabled={Boolean(busyId)} aria-label="تحديد كمقروء"><Check size={15} /></button> : null}</article>)}</div></> : <EmptyState icon={Bell} title="لا توجد إشعارات" description="ستظهر تحديثات الحجوزات ورسائل المنصة هنا." />}</aside></div>;
}
