import { CircleHelp, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TravelerBooking } from '../types';
import { cleanMultilineText, cleanSingleLineText } from '../validation';

interface SupportDialogProps {
  booking?: TravelerBooking | null;
  onClose: () => void;
  onSubmit: (subject: string, message: string, bookingId?: string) => Promise<void>;
}

export function SupportDialog({ booking, onClose, onSubmit }: SupportDialogProps) {
  const [subject, setSubject] = useState(booking ? `مساعدة بخصوص الحجز ${booking.referenceCode}` : '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; ref.current?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', key); return () => { document.body.style.overflow = old; document.removeEventListener('keydown', key); };
  }, [busy, onClose]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); const cleanSubject = cleanSingleLineText(subject, 120); const cleanMessage = cleanMultilineText(message, 1500);
    if (cleanSubject.length < 3 || cleanMessage.length < 10) { setError('اكتب عنوانًا وتفاصيل أوضح للطلب.'); return; }
    setBusy(true); setError('');
    try { await onSubmit(cleanSubject, cleanMessage, booking?.id); setSuccess(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر إرسال الطلب.'); }
    finally { setBusy(false); }
  };
  return <div className="modal-backdrop modal-enter" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}><section ref={ref} className="support-dialog dialog-enter" role="dialog" aria-modal="true" aria-label="طلب المساعدة" tabIndex={-1}><header><div><CircleHelp size={20} /><h2>طلب مساعدة</h2></div><button type="button" className="icon-button" onClick={onClose} disabled={busy}><X size={18} /></button></header>{success ? <div className="booking-success"><CircleHelp size={45} /><h3>تم إرسال الطلب</h3><p>سيتابع فريق الدعم الطلب من حسابك.</p><button type="button" className="gold-button" onClick={onClose}>إغلاق</button></div> : <form className="dialog-form" onSubmit={submit}><label className="field-group"><span>عنوان الموضوع</span><input value={subject} onChange={(event) => setSubject(event.target.value.slice(0, 120))} maxLength={120} /></label><label className="field-group"><span>التفاصيل</span><textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 1500))} maxLength={1500} placeholder="اشرح طلبك بالتفصيل" /><small className="field-hint">{message.length}/1500</small></label>{error ? <div className="form-notice error">{error}</div> : null}<button type="submit" className="gold-button" disabled={busy}>{busy ? <Loader2 className="spin" size={16} /> : <CircleHelp size={16} />}إرسال الطلب</button></form>}</section></div>;
}
