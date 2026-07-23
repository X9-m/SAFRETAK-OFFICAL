import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Heart, Loader2, MessageSquareText, ShieldCheck, Star, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatDate, formatMoney, serviceKinds } from '../domain';
import { apiClient } from '../services/apiClient';
import type { CatalogService, ServiceReview } from '../types';
import { cleanMultilineText, getBookableDates, getJordanTodayIso } from '../validation';
import { EmptyState } from '../components/EmptyState';
import { AppImage } from '../components/AppImage';
import { officeImageFallback, serviceImageFallback } from '../media';

interface ServiceDetailsPageProps {
  service: CatalogService;
  favorite: boolean;
  canReview: boolean;
  onBack: () => void;
  onBook: (service: CatalogService) => void;
  onFavorite: (service: CatalogService, favorite: boolean) => void;
  onOffice: () => void;
}

type DetailsTab = 'overview' | 'program' | 'reviews';

const detailLabels: Record<string, string> = {
  airline: 'شركة الطيران', origin: 'نقطة الانطلاق', destination: 'الوجهة', hotel_stars: 'تصنيف الفندق',
  vehicle_type: 'نوع المركبة', transmission: 'ناقل الحركة', visa_type: 'نوع التأشيرة', coverage: 'نوع التغطية',
  meeting_point: 'نقطة التجمع', guide: 'المرشد', accommodation: 'الإقامة', meal_plan: 'الوجبات',
};
const hiddenDetailKeys = new Set(['add_ons', 'options', 'location', 'address', 'latitude', 'longitude']);

const printableDetail = (value: unknown): string | null => {
  if (typeof value === 'string') return value.trim().slice(0, 300) || null;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').slice(0, 8).join('، ') || null;
  return null;
};

export function ServiceDetailsPage({ service, favorite, canReview, onBack, onBook, onFavorite, onOffice }: ServiceDetailsPageProps) {
  const [tab, setTab] = useState<DetailsTab>('overview');
  const [imageIndex, setImageIndex] = useState(0);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState('');
  const meta = serviceKinds[service.type];
  const Icon = meta.icon;
  const bookableDates = getBookableDates(service.availableDates, getJordanTodayIso());
  const unavailable = service.seatsRemaining === 0 || (service.availableDates.length > 0 && bookableDates.length === 0);
  const gallery = useMemo(() => [...new Set([service.imageUrl, ...service.images].filter((item): item is string => Boolean(item)))], [service.imageUrl, service.images]);
  const facts = useMemo(() => Object.entries(service.details).filter(([key]) => !hiddenDetailKeys.has(key)).map(([key, value]) => ({ key, label: detailLabels[key] || key.replaceAll('_', ' '), value: printableDetail(value) })).filter((item): item is { key: string; label: string; value: string } => Boolean(item.value)).slice(0, 12), [service.details]);

  useEffect(() => { setImageIndex(0); setTab('overview'); }, [service.id]);
  useEffect(() => {
    let cancelled = false;
    setReviewsLoading(true);
    setReviewsError('');
    void apiClient.getServiceReviews(service.id).then((items) => { if (!cancelled) setReviews(items); }).catch((error) => { if (!cancelled) setReviewsError(error instanceof Error ? error.message : 'تعذر تحميل التقييمات.'); }).finally(() => { if (!cancelled) setReviewsLoading(false); });
    return () => { cancelled = true; };
  }, [service.id]);

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanComment = cleanMultilineText(comment, 1000);
    if (cleanComment.length < 3) { setReviewNotice('اكتب تعليقًا واضحًا من 3 أحرف على الأقل.'); return; }
    setSubmittingReview(true); setReviewNotice('');
    try {
      const saved = await apiClient.submitReview(service.id, rating, cleanComment);
      setReviews((current) => [saved, ...current.filter((item) => !item.isMine)]);
      setComment('');
      setReviewNotice('تم حفظ تقييمك.');
    } catch (error) {
      setReviewNotice(error instanceof Error ? error.message : 'تعذر حفظ التقييم.');
    } finally { setSubmittingReview(false); }
  };

  const itineraryItems = service.itinerary.map((item, index) => {
    if (typeof item === 'string') return { title: `المحطة ${index + 1}`, description: item };
    const title = printableDetail(item.title_ar ?? item.title ?? item.day) || `المحطة ${index + 1}`;
    const description = printableDetail(item.description_ar ?? item.description ?? item.details) || '';
    return { title, description };
  });

  return (
    <div className="details-page page-enter">
      <button type="button" className="back-button" onClick={onBack}><ArrowRight size={18} />رجوع</button>
      <section className="details-hero rich-details-hero">
        <div className="details-media details-gallery">
          <AppImage src={gallery[imageIndex]} fallbackSrc={serviceImageFallback(service.type)} alt={`${service.title} ${imageIndex + 1}`} loading="eager" fetchPriority="high" />
          {gallery.length > 1 ? <><button type="button" className="gallery-arrow right" onClick={() => setImageIndex((value) => (value - 1 + gallery.length) % gallery.length)} aria-label="الصورة السابقة"><ChevronRight size={19} /></button><button type="button" className="gallery-arrow left" onClick={() => setImageIndex((value) => (value + 1) % gallery.length)} aria-label="الصورة التالية"><ChevronLeft size={19} /></button><span className="gallery-counter">{imageIndex + 1}/{gallery.length}</span></> : null}
        </div>
        <div className="details-copy">
          <div className="details-title-actions"><span className="eyebrow">{meta.label}</span><button type="button" className="service-details-favorite-button" style={{ display: 'inline-flex', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', padding: 0, border: `1px solid ${favorite ? '#d5ad24' : 'rgba(213, 173, 36, 0.48)'}`, borderRadius: '50%', background: favorite ? '#d5ad24' : 'rgba(10, 33, 26, 0.9)', color: favorite ? '#0a211a' : '#e7c13d', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.28)', cursor: 'pointer' }} onClick={() => onFavorite(service, !favorite)} aria-label={favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}><Heart size={18} fill={favorite ? 'currentColor' : 'none'} /></button></div>
          <h1>{service.title}</h1><p>{service.description || 'سيضيف المكتب تفاصيل الخدمة قريبًا.'}</p>
          <div className="details-meta"><span><Star size={15} fill="currentColor" />{service.rating.toFixed(1)}</span><button type="button" onClick={onOffice}><ShieldCheck size={15} />{service.office.name}</button></div>
          {gallery.length > 1 ? <div className="gallery-thumbnails">{gallery.slice(0, 8).map((image, index) => <button key={image} type="button" className={index === imageIndex ? 'active' : ''} onClick={() => setImageIndex(index)}><AppImage src={image} fallbackSrc={serviceImageFallback(service.type)} alt={`${service.title} ${index + 1}`} /></button>)}</div> : null}
        </div>
      </section>

      <nav className="details-tabs" aria-label="أقسام تفاصيل الخدمة">
        <button type="button" className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>التفاصيل</button>
        <button type="button" className={tab === 'program' ? 'active' : ''} onClick={() => setTab('program')}>البرنامج والمشمولات</button>
        <button type="button" className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>التقييمات ({reviews.length})</button>
      </nav>

      <div className="details-columns">
        <div className="details-main">
          {tab === 'overview' ? <>
            <section className="content-card"><h2>معلومات الخدمة</h2><div className="facts-grid"><div><Clock3 size={18} /><span>المدة</span><strong>{service.duration || 'حسب برنامج المكتب'}</strong></div><div><CalendarDays size={18} /><span>المواعيد</span><strong>{service.availableDates.length ? (bookableDates.length ? `${bookableDates.length} مواعيد متاحة` : 'لا توجد مواعيد مستقبلية') : 'موعد يختاره المسافر'}</strong></div><div><Users size={18} /><span>التوفر</span><strong>{service.seatsRemaining == null ? 'متاح للحجز' : `${service.seatsRemaining} متبقي`}</strong></div></div></section>
            {facts.length ? <section className="content-card"><h2>مواصفات إضافية</h2><dl className="details-definition-grid">{facts.map((item) => <div key={item.key}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section> : null}
            <button type="button" className="content-card office-inline-card" onClick={onOffice}><span className="office-profile-logo small"><AppImage src={service.office.logoUrl} fallbackSrc={officeImageFallback} alt={`شعار ${service.office.name}`} /></span><div><span>مقدم الخدمة</span><strong>{service.office.name}</strong><small>عرض صفحة المكتب وكل خدماته</small></div><ChevronLeft size={19} /></button>
            {service.terms || service.cancellationPolicy ? <section className="content-card"><h2>الشروط والسياسات</h2>{service.terms ? <p>{service.terms}</p> : null}{service.cancellationPolicy ? <p><strong>سياسة الإلغاء: </strong>{service.cancellationPolicy}</p> : null}</section> : null}
          </> : null}

          {tab === 'program' ? <>
            {service.included.length ? <section className="content-card"><h2>يشمل الحجز</h2><ul className="check-list">{service.included.map((item) => <li key={item}><Check size={16} />{item}</li>)}</ul></section> : null}
            {itineraryItems.length ? <section className="content-card"><h2>برنامج الخدمة</h2><ol className="itinerary-list">{itineraryItems.map((item, index) => <li key={`${item.title}-${index}`}><span>{index + 1}</span><div><strong>{item.title}</strong>{item.description ? <p>{item.description}</p> : null}</div></li>)}</ol></section> : <EmptyState icon={CalendarDays} title="لا يوجد برنامج تفصيلي" description="يعرض المكتب تفاصيل البرنامج عند إضافتها للخدمة." />}
            {service.options.length ? <section className="content-card"><h2>الخيارات المتاحة</h2><div className="option-preview-grid">{service.options.map((option) => <div key={option.id}><strong>{option.label}</strong><span>{option.priceDelta ? `+ ${formatMoney(option.priceDelta)}` : 'بدون فرق سعر'}</span></div>)}</div></section> : null}
            {service.addOns.length ? <section className="content-card"><h2>إضافات اختيارية</h2><div className="option-preview-grid">{service.addOns.map((addOn) => <div key={addOn.id}><strong>{addOn.label}</strong><span>+ {formatMoney(addOn.price)}</span></div>)}</div></section> : null}
          </> : null}

          {tab === 'reviews' ? <section className="content-card reviews-section"><h2>تقييمات المسافرين</h2>{reviewsLoading ? <div className="page-loader"><Loader2 className="spin" size={20} />جاري تحميل التقييمات...</div> : reviewsError ? <div className="form-notice error">{reviewsError}</div> : reviews.length ? <div className="reviews-list">{reviews.map((review) => <article key={review.id}><div><strong>{review.travelerName || 'مسافر سفرتك'}</strong><span>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < review.rating ? 'currentColor' : 'none'} />)}</span></div><p>{review.comment}</p><time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time></article>)}</div> : <EmptyState icon={MessageSquareText} title="لا توجد تقييمات بعد" description="يستطيع المسافر تقييم الخدمة بعد اكتمال حجزه." />}
            {canReview ? <form className="review-form" onSubmit={submitReview}><h3>أضف تقييمك</h3><div className="rating-picker" role="radiogroup" aria-label="التقييم">{[1,2,3,4,5].map((value) => <button key={value} type="button" className={value <= rating ? 'active' : ''} onClick={() => setRating(value)} aria-label={`${value} نجوم`}><Star size={20} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</div><textarea value={comment} onChange={(event) => setComment(event.target.value.slice(0, 1000))} maxLength={1000} placeholder="اكتب تجربتك مع الخدمة" disabled={submittingReview} />{reviewNotice ? <div className={`form-notice ${reviewNotice.includes('تم ') ? 'success' : 'error'}`}>{reviewNotice}</div> : null}<button type="submit" className="gold-button" disabled={submittingReview}>{submittingReview ? <Loader2 className="spin" size={16} /> : <MessageSquareText size={16} />}حفظ التقييم</button></form> : null}
          </section> : null}
        </div>

        <aside className="booking-summary"><span>السعر الأساسي</span><strong>{formatMoney(service.price)}</strong><small>السعر النهائي يُحسب من الخيارات والمدة والعدد داخل قاعدة البيانات.</small>{bookableDates.length && service.availableDates.length ? <small>أقرب موعد: {formatDate(bookableDates[0])}</small> : null}<button type="button" className="gold-button" onClick={() => onBook(service)} disabled={unavailable}>{unavailable ? 'غير متاح حاليًا' : 'ابدأ الحجز'}</button></aside>
      </div>
    </div>
  );
}
