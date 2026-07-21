import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, IdCard, Loader2, Minus, Plus, ShieldAlert, TicketCheck, UserRound, UsersRound, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, formatMoney, serviceKinds } from '../domain';
import { createTravelerDraft, requiresPassport, requiresTravelerManifest, sanitizeTravelerManifest, syncTravelerDrafts, travelerManifestCount, validateTravelerManifest, type BookingTravelerDraft } from '../bookingPassengers';
import type { BookingDraft, CatalogService, PaymentMethod, TravelerBooking } from '../types';
import { addDaysIso, cleanMultilineText, cleanSingleLineText, getBookableDates, getJordanTodayIso, isBookableDate, isCouponCode, isPaymentMethod, isPaymentReference } from '../validation';

interface BookingDialogProps {
  service: CatalogService;
  onClose: () => void;
  onSubmit: (input: BookingDraft) => Promise<TravelerBooking>;
  onViewBookings: (booking: TravelerBooking) => void;
  travelerName: string;
}

type Step = 'details' | 'travelers' | 'options' | 'payment' | 'confirm';
const addDays = (iso: string, days: number): string => { const date = new Date(`${iso}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };

export function BookingDialog({ service, onClose, onSubmit, onViewBookings, travelerName }: BookingDialogProps) {
  const today = useMemo(() => getJordanTodayIso(), []);
  const dates = useMemo(() => getBookableDates(service.availableDates, today), [service.availableDates, today]);
  const configuredDates = service.availableDates.length > 0;
  const maxQuantity = service.seatsRemaining == null ? 10 : Math.min(10, service.seatsRemaining);
  const initialDate = dates[0] || today;
  const [step, setStep] = useState<Step>('details');
  const [quantity, setQuantity] = useState(1);
  const [primaryDate, setPrimaryDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(addDays(initialDate, 1));
  const [rooms, setRooms] = useState(1);
  const [children, setChildren] = useState(0);
  const [roomType, setRoomType] = useState('standard');
  const [bedType, setBedType] = useState('double');
  const [tripType, setTripType] = useState('one_way');
  const [cabinClass, setCabinClass] = useState('economy');
  const [optionId, setOptionId] = useState(service.options[0]?.id || '');
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [travelers, setTravelers] = useState<BookingTravelerDraft[]>(() => [createTravelerDraft(0, travelerName)]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CliQ');
  const [paymentReference, setPaymentReference] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<TravelerBooking | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const serviceMeta = serviceKinds[service.type];
  const manifestRequired = requiresTravelerManifest(service.type);
  const passportRequired = requiresPassport(service.type);
  const manifestCount = travelerManifestCount(service.type, quantity);
  const manifestTravelDate = primaryDate;

  const pricingUnits = useMemo(() => {
    if (service.type === 'hotel') return Math.max(1, Math.round((Date.parse(`${endDate}T12:00:00Z`) - Date.parse(`${primaryDate}T12:00:00Z`)) / 86400000)) * rooms;
    if (service.type === 'car') return Math.max(1, Math.round((Date.parse(`${endDate}T12:00:00Z`) - Date.parse(`${primaryDate}T12:00:00Z`)) / 86400000));
    return quantity;
  }, [endDate, primaryDate, quantity, rooms, service.type]);
  const option = service.options.find((item) => item.id === optionId);
  const selectedAddOns = service.addOns.filter((item) => addOnIds.includes(item.id));
  const estimate = useMemo(() => (service.price + (option?.priceDelta || 0)) * pricingUnits + selectedAddOns.reduce((sum, item) => sum + item.price * quantity, 0), [option?.priceDelta, pricingUnits, quantity, selectedAddOns, service.price]);

  useEffect(() => {
    setTravelers((current) => syncTravelerDrafts(current, manifestCount, travelerName, passportRequired));
  }, [manifestCount, passportRequired, travelerName]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !submitting) onClose(); };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keydown); };
  }, [onClose, submitting]);

  const validateDetails = (): string | null => {
    if (configuredDates && dates.length === 0) return 'لا توجد مواعيد مستقبلية متاحة لهذه الخدمة.';
    if (!isBookableDate(primaryDate, today)) return 'اختر تاريخًا صحيحًا وغير ماضٍ.';
    if (configuredDates && !dates.includes(primaryDate)) return 'التاريخ المختار غير متاح لهذه الخدمة.';
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) return 'العدد المطلوب غير متاح.';
    if ((service.type === 'hotel' || service.type === 'car') && (!isBookableDate(endDate, today) || endDate <= primaryDate)) return 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية.';
    if (service.type === 'hotel' && (!Number.isInteger(rooms) || rooms < 1 || rooms > 5 || children < 0 || children > 10)) return 'راجع عدد الغرف والأطفال.';
    if (service.type === 'flight' && tripType === 'round_trip' && (!isBookableDate(endDate, today) || endDate <= primaryDate)) return 'اختر تاريخ عودة بعد تاريخ المغادرة.';
    return null;
  };

  const validateTravelers = (): string | null => validateTravelerManifest(travelers, service.type, manifestCount, manifestTravelDate);

  const validatePayment = (): string | null => {
    if (!isPaymentMethod(paymentMethod)) return 'اختر طريقة دفع صحيحة.';
    if (paymentMethod !== 'Cash at Office' && !isPaymentReference(cleanSingleLineText(paymentReference, 40))) return 'أدخل الرقم المرجعي للحوالة أو السداد.';
    const coupon = cleanSingleLineText(couponCode, 30).toUpperCase();
    if (coupon && !isCouponCode(coupon)) return 'رمز الخصم غير صالح.';
    return null;
  };

  const steps: { id: Step; label: string }[] = [
    { id: 'details', label: 'التفاصيل' },
    ...(manifestRequired ? [{ id: 'travelers' as Step, label: service.type === 'car' ? 'السائق' : 'المسافرون' }] : []),
    { id: 'options', label: 'الخيارات' },
    { id: 'payment', label: 'الدفع' },
    { id: 'confirm', label: 'التأكيد' },
  ];
  const currentStepIndex = steps.findIndex((item) => item.id === step);

  const next = () => {
    setError('');
    if (step === 'details') { const validation = validateDetails(); if (validation) return setError(validation); }
    if (step === 'travelers') { const validation = validateTravelers(); if (validation) return setError(validation); }
    if (step === 'payment') { const validation = validatePayment(); if (validation) return setError(validation); }
    const nextStep = steps[currentStepIndex + 1];
    if (nextStep) setStep(nextStep.id);
  };
  const previous = () => { setError(''); const previousStep = steps[currentStepIndex - 1]; if (previousStep) setStep(previousStep.id); };

  const updateTraveler = (index: number, patch: Partial<BookingTravelerDraft>) => setTravelers((current) => current.map((traveler, travelerIndex) => travelerIndex === index ? { ...traveler, ...patch } : traveler));

  const buildDetails = (): Record<string, unknown> => {
    const common = { quantity, notes: cleanMultilineText(notes, 500), option_id: optionId || undefined, add_on_ids: addOnIds, travelers: manifestRequired ? sanitizeTravelerManifest(travelers).map((traveler) => ({ full_name: traveler.fullName, nationality: traveler.nationality, document_type: traveler.documentType, document_number: traveler.documentNumber, document_expiry: traveler.documentExpiry })) : [] };
    if (service.type === 'hotel') return { ...common, check_in: primaryDate, check_out: endDate, rooms, children, room_type: roomType, bed_type: bedType };
    if (service.type === 'flight') return { ...common, outbound_date: primaryDate, return_date: tripType === 'round_trip' ? endDate : null, trip_type: tripType, cabin_class: cabinClass };
    if (service.type === 'car') return { ...common, pickup_date: primaryDate, return_date: endDate, quantity: 1 };
    return { ...common, travel_date: primaryDate };
  };

  const submit = async () => {
    const detailError = validateDetails(); const travelerError = validateTravelers(); const paymentError = validatePayment();
    if (detailError || travelerError || paymentError) { setError(detailError || travelerError || paymentError || 'راجع بيانات الحجز.'); return; }
    setSubmitting(true); setError('');
    try {
      setCreated(await onSubmit({ serviceId: service.id, details: buildDetails(), paymentMethod, paymentReference: cleanSingleLineText(paymentReference, 40), couponCode: cleanSingleLineText(couponCode, 30).toUpperCase() }));
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر إنشاء الحجز.'); }
    finally { setSubmitting(false); }
  };

  const toggleAddOn = (id: string) => setAddOnIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 10 ? [...current, id] : current);

  return (
    <div className="modal-backdrop modal-enter" onMouseDown={(event) => event.target === event.currentTarget && !submitting && onClose()}>
      <section ref={dialogRef} className="booking-dialog full-booking-dialog dialog-enter" role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title" tabIndex={-1}>
        <header><div><span>{serviceMeta.label}</span><h2 id="booking-dialog-title">{service.title}</h2></div><button type="button" className="icon-button" onClick={onClose} disabled={submitting} aria-label="إغلاق نافذة الحجز"><X size={19} /></button></header>
        {created ? <div className="booking-success" aria-live="polite"><CheckCircle2 size={52} /><h3>تم إرسال طلب الحجز</h3><p>رقم الحجز</p><strong>{created.referenceCode}</strong><small>الطلب بانتظار مراجعة المكتب. حالة الدفع تبقى غير مدفوعة إلى أن يؤكدها المكتب أو مزود الدفع.</small><div className="booking-success-actions"><button type="button" className="gold-button" onClick={() => onViewBookings(created)}>عرض الحجز</button><button type="button" className="secondary-button" onClick={onClose}>العودة للخدمة</button></div></div> : <>
          <ol className="booking-stepper">{steps.map((item, index) => <li key={item.id} className={index === currentStepIndex ? 'active' : index < currentStepIndex ? 'done' : ''}><span>{index < currentStepIndex ? <Check size={14} /> : index + 1}</span><small>{item.label}</small></li>)}</ol>
          <div className="dialog-form booking-step-content">
            {step === 'details' ? <div className="booking-form-grid screen-enter">
              <label className="field-group"><span>{service.type === 'hotel' ? 'تاريخ الدخول' : service.type === 'flight' ? 'تاريخ المغادرة' : service.type === 'car' ? 'تاريخ الاستلام' : 'تاريخ الخدمة'}</span>{configuredDates ? dates.length ? <select value={primaryDate} onChange={(event) => setPrimaryDate(event.target.value)}>{dates.map((item) => <option key={item} value={item}>{formatDate(item)}</option>)}</select> : <div className="availability-warning"><ShieldAlert size={17} />لا توجد مواعيد مستقبلية</div> : <input type="date" min={today} value={primaryDate} onChange={(event) => setPrimaryDate(event.target.value)} />}</label>
              {(service.type === 'hotel' || service.type === 'car' || (service.type === 'flight' && tripType === 'round_trip')) ? <label className="field-group"><span>{service.type === 'hotel' ? 'تاريخ المغادرة من الفندق' : service.type === 'car' ? 'تاريخ إعادة السيارة' : 'تاريخ العودة'}</span><input type="date" min={addDays(primaryDate, 1)} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label> : null}
              {service.type === 'flight' ? <><label className="field-group"><span>نوع الرحلة</span><select value={tripType} onChange={(event) => setTripType(event.target.value)}><option value="one_way">ذهاب فقط</option><option value="round_trip">ذهاب وعودة</option></select></label><label className="field-group"><span>درجة السفر</span><select value={cabinClass} onChange={(event) => setCabinClass(event.target.value)}><option value="economy">السياحية</option><option value="business">رجال الأعمال</option><option value="first">الأولى</option></select></label></> : null}
              {service.type === 'hotel' ? <><label className="field-group"><span>عدد الغرف</span><select value={rooms} onChange={(event) => setRooms(Number(event.target.value))}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="field-group"><span>فئة الغرفة</span><select value={roomType} onChange={(event) => setRoomType(event.target.value)}><option value="standard">قياسية</option><option value="deluxe">ديلوكس</option><option value="suite">جناح</option></select></label><label className="field-group"><span>نوع الأسرّة</span><select value={bedType} onChange={(event) => setBedType(event.target.value)}><option value="double">سرير مزدوج</option><option value="twin">سريران منفصلان</option><option value="single">سرير فردي</option></select></label><label className="field-group"><span>عدد الأطفال</span><input type="number" min="0" max="10" value={children} onChange={(event) => setChildren(Math.max(0, Math.min(10, Number(event.target.value) || 0)))} /></label></> : null}
              {service.type !== 'car' ? <div className="field-group"><span>{service.type === 'hotel' ? 'عدد النزلاء' : 'عدد المسافرين / المقاعد'}</span><div className="quantity-control"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}><Minus size={17} /></button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} disabled={quantity >= maxQuantity}><Plus size={17} /></button></div>{service.seatsRemaining != null ? <small className="field-hint">المتاح: {service.seatsRemaining}</small> : null}</div> : null}
              <label className="field-group full-span"><span>ملاحظات للمكتب</span><textarea value={notes} onChange={(event) => setNotes(event.target.value.slice(0, 500))} maxLength={500} placeholder="طلبات خاصة أو ملاحظات إضافية" /><small className="field-hint">{notes.length}/500</small></label>
            </div> : null}

            {step === 'travelers' ? <div className="traveler-manifest screen-enter">
              <div className="traveler-manifest-heading"><UsersRound size={22} /><div><h3>{service.type === 'car' ? 'بيانات السائق' : 'بيانات المسافرين'}</h3><p>تُرسل هذه البيانات للمكتب مع الطلب، ويمكن رفع صور الوثائق بعد إنشاء الحجز.</p></div></div>
              <div className="traveler-list">{travelers.map((traveler, index) => <section className="traveler-card" key={index}>
                <header><span><UserRound size={17} />{service.type === 'car' ? 'السائق' : `المسافر ${index + 1}`}</span>{index === 0 ? <small>صاحب الحجز</small> : null}</header>
                <div className="booking-form-grid">
                  <label className="field-group"><span>الاسم كما في الوثيقة</span><input value={traveler.fullName} onChange={(event) => updateTraveler(index, { fullName: event.target.value.normalize('NFKC').slice(0, 100) })} maxLength={100} autoComplete={index === 0 ? 'name' : 'off'} /></label>
                  <label className="field-group"><span>الجنسية</span><input value={traveler.nationality} onChange={(event) => updateTraveler(index, { nationality: event.target.value.normalize('NFKC').slice(0, 50) })} maxLength={50} /></label>
                  <label className="field-group"><span>نوع الوثيقة</span><select value={traveler.documentType} onChange={(event) => updateTraveler(index, { documentType: event.target.value as BookingTravelerDraft['documentType'], documentExpiry: event.target.value === 'passport' ? traveler.documentExpiry : '' })} disabled={passportRequired}><option value="national_id">هوية شخصية</option><option value="passport">جواز سفر</option></select>{passportRequired ? <small className="field-hint">جواز السفر مطلوب لهذه الخدمة.</small> : null}</label>
                  <label className="field-group"><span>رقم الوثيقة</span><div className="input-box"><input value={traveler.documentNumber} onChange={(event) => updateTraveler(index, { documentNumber: event.target.value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '').slice(0, 20) })} maxLength={20} dir="ltr" autoComplete="off" /><IdCard size={17} /></div></label>
                  {traveler.documentType === 'passport' ? <label className="field-group"><span>تاريخ انتهاء الجواز</span><input type="date" min={addDaysIso(primaryDate, 180)} value={traveler.documentExpiry} onChange={(event) => updateTraveler(index, { documentExpiry: event.target.value })} /></label> : null}
                </div>
              </section>)}</div>
              <div className="payment-safety"><ShieldAlert size={20} /><div><strong>حماية البيانات</strong><p>لا تُعرض أرقام الوثائق في القوائم العامة، ولا يستطيع قراءتها إلا صاحب الحجز والجهة المخولة بمراجعته.</p></div></div>
            </div> : null}

            {step === 'options' ? <div className="booking-options screen-enter">
              <section><h3>اختيار الباقة</h3>{service.options.length ? <div className="choice-card-grid">{service.options.map((item) => <label key={item.id} className={optionId === item.id ? 'selected' : ''}><input type="radio" name="service-option" checked={optionId === item.id} onChange={() => setOptionId(item.id)} /><div><strong>{item.label}</strong><span>{item.priceDelta ? `+ ${formatMoney(item.priceDelta)}` : 'مشمول بالسعر'}</span></div></label>)}</div> : <div className="inline-empty">لا توجد باقات إضافية؛ سيتم اعتماد الخيار الأساسي.</div>}</section>
              <section><h3>خدمات إضافية</h3>{service.addOns.length ? <div className="choice-card-grid">{service.addOns.map((item) => <label key={item.id} className={addOnIds.includes(item.id) ? 'selected' : ''}><input type="checkbox" checked={addOnIds.includes(item.id)} onChange={() => toggleAddOn(item.id)} /><div><strong>{item.label}</strong><span>+ {formatMoney(item.price)}</span></div></label>)}</div> : <div className="inline-empty">لا توجد إضافات منشورة لهذه الخدمة.</div>}</section>
              {Array.isArray(service.details.required_documents) && service.details.required_documents.length ? <section className="required-docs"><h3>مستندات قد يطلبها المكتب</h3><ul>{service.details.required_documents.filter((item): item is string => typeof item === 'string').slice(0, 12).map((item) => <li key={item}><TicketCheck size={15} />{item}</li>)}</ul><small>يمكنك رفع المستندات المطلوبة بأمان من صفحة تفاصيل الحجز بعد إرسال الطلب.</small></section> : null}
            </div> : null}

            {step === 'payment' ? <div className="booking-payment screen-enter">
              <section className="choice-card-grid payment-choices">{(['CliQ','eFAWATEERcom','Cash at Office'] as PaymentMethod[]).map((method) => <label key={method} className={paymentMethod === method ? 'selected' : ''}><input type="radio" name="payment-method" checked={paymentMethod === method} onChange={() => { setPaymentMethod(method); if (method === 'Cash at Office') setPaymentReference(''); }} /><div><strong>{method === 'CliQ' ? 'CliQ' : method === 'eFAWATEERcom' ? 'إي فواتيركم' : 'الدفع في المكتب'}</strong><span>{method === 'Cash at Office' ? 'يؤكد المكتب عملية الدفع لاحقًا' : 'أدخل مرجع العملية بعد التحويل'}</span></div></label>)}</section>
              {paymentMethod !== 'Cash at Office' ? <label className="field-group"><span>{paymentMethod === 'CliQ' ? 'الرقم المرجعي لحوالة CliQ' : 'رقم إيصال إي فواتيركم'}</span><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40))} placeholder={paymentMethod === 'CliQ' ? 'TXN998230' : 'EFW-102930'} dir="ltr" maxLength={40} /></label> : null}
              <label className="field-group"><span>رمز خصم (اختياري)</span><input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30))} placeholder="رمز الكوبون" dir="ltr" maxLength={30} /><small className="field-hint">يتم التحقق من الرمز وحساب الخصم داخل قاعدة البيانات عند الإرسال.</small></label>
              <div className="payment-safety"><ShieldAlert size={20} /><div><strong>لا يتم تسجيل دفعة ناجحة تلقائيًا</strong><p>المرجع يُرسل للمراجعة، وحالة الدفع تتغير فقط بعد التأكيد الحقيقي.</p></div></div>
            </div> : null}

            {step === 'confirm' ? <div className="booking-confirm screen-enter"><h3>راجع طلب الحجز</h3><dl><div><dt>الخدمة</dt><dd>{service.title}</dd></div><div><dt>المكتب</dt><dd>{service.office.name}</dd></div><div><dt>التاريخ</dt><dd>{formatDate(primaryDate)}{(service.type === 'hotel' || service.type === 'car' || tripType === 'round_trip') ? ` — ${formatDate(endDate)}` : ''}</dd></div><div><dt>العدد</dt><dd>{service.type === 'car' ? 'سيارة واحدة' : quantity}</dd></div>{manifestRequired ? <div><dt>{service.type === 'car' ? 'السائق' : 'بيانات المسافرين'}</dt><dd>{travelers.length} {service.type === 'car' ? 'سائق' : 'مسافر'}</dd></div> : null}<div><dt>طريقة الدفع</dt><dd>{paymentMethod === 'Cash at Office' ? 'الدفع في المكتب' : paymentMethod}</dd></div><div><dt>السعر التقديري قبل الخصم</dt><dd>{formatMoney(estimate)}</dd></div></dl><div className="confirmation-note"><CheckCircle2 size={19} /><p>السعر النهائي والمقاعد والكوبون يعاد التحقق منها عند الإرسال. إنشاء الطلب لا يعني أن المكتب أكده.</p></div></div> : null}
            {error ? <div className="form-notice error" role="alert">{error}</div> : null}
          </div>
          <footer className="booking-dialog-footer">{currentStepIndex > 0 ? <button type="button" className="secondary-button" onClick={previous} disabled={submitting}><ArrowRight size={16} />السابق</button> : <span />}{step === 'confirm' ? <button type="button" className="gold-button" onClick={() => void submit()} disabled={submitting}>{submitting ? <Loader2 className="spin" size={17} /> : <CheckCircle2 size={17} />}إرسال طلب الحجز</button> : <button type="button" className="gold-button" onClick={next}><ArrowLeft size={16} />التالي</button>}</footer>
        </>}
      </section>
    </div>
  );
}
