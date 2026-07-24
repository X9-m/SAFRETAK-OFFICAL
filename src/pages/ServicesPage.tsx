import { Filter, Heart, RotateCcw, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { ServiceCard } from '../components/ServiceCard';
import { SmartTravelSearch } from '../components/SmartTravelSearch';
import { serviceKinds } from '../domain';
import type { CatalogService, ServiceKind, TravelOffice } from '../types';
import { cleanSearchText, getBookableDates, getJordanTodayIso } from '../validation';

interface ServicesPageProps {
  services: CatalogService[];
  offices: TravelOffice[];
  initialKind: ServiceKind | null;
  favoritesOnly?: boolean;
  favoriteIds: Set<string>;
  onSelectService: (service: CatalogService) => void;
  onFavorite: (service: CatalogService, favorite: boolean) => void;
  onSelectOffice: (office: TravelOffice) => void;
}

type SortMode = 'newest' | 'price_low' | 'price_high' | 'rating';

export function ServicesPage({ services, offices, initialKind, favoritesOnly = false, favoriteIds, onSelectService, onFavorite, onSelectOffice }: ServicesPageProps) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<ServiceKind | 'all'>(initialKind || 'all');
  const [officeId, setOfficeId] = useState('all');
  const [minimumRating, setMinimumRating] = useState(0);
  const [maximumPrice, setMaximumPrice] = useState<number | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const today = useMemo(() => getJordanTodayIso(), []);
  const catalogMaximum = useMemo(() => Math.ceil(Math.max(0, ...services.map((service) => service.price))), [services]);

  useEffect(() => setKind(initialKind || 'all'), [initialKind]);
  useEffect(() => { if (maximumPrice != null && maximumPrice > catalogMaximum) setMaximumPrice(catalogMaximum || null); }, [catalogMaximum, maximumPrice]);

  const filtered = useMemo(() => {
    const clean = cleanSearchText(query); const maxPrice = maximumPrice == null ? Number.POSITIVE_INFINITY : maximumPrice;
    return services.filter((service) => {
      if (favoritesOnly && !favoriteIds.has(service.id)) return false;
      if (kind !== 'all' && service.type !== kind) return false;
      if (officeId !== 'all' && service.officeId !== officeId) return false;
      if (service.rating < minimumRating || service.price > maxPrice) return false;
      if (availableOnly && (service.seatsRemaining === 0 || (service.availableDates.length && getBookableDates(service.availableDates, today).length === 0))) return false;
      if (!clean) return true;
      return cleanSearchText(`${service.title} ${service.description} ${service.office.name} ${service.category?.nameAr || ''} ${service.included.join(' ')}`).includes(clean);
    }).sort((a, b) => sort === 'price_low' ? a.price - b.price : sort === 'price_high' ? b.price - a.price : sort === 'rating' ? b.rating - a.rating || a.price - b.price : services.indexOf(a) - services.indexOf(b));
  }, [availableOnly, favoriteIds, favoritesOnly, kind, maximumPrice, minimumRating, officeId, query, services, sort, today]);

  const resetFilters = () => { setQuery(''); setKind(initialKind || 'all'); setOfficeId('all'); setMinimumRating(0); setMaximumPrice(null); setAvailableOnly(false); setSort('newest'); };
  const hasFilters = Boolean(query || kind !== (initialKind || 'all') || officeId !== 'all' || minimumRating || maximumPrice != null || availableOnly || sort !== 'newest');

  return <div className="page-stack page-enter services-catalog-pro">
    <section className="services-hero-pro">
      <div><span className="eyebrow"><Sparkles size={14} />{favoritesOnly ? 'اختياراتك المحفوظة' : 'دليل الخدمات السياحية'}</span><h1>{favoritesOnly ? 'الخدمات المفضلة' : 'اكتشف رحلتك القادمة'}</h1><p>{favoritesOnly ? 'كل الخدمات التي حفظتها للرجوع إليها بسرعة.' : 'رحلات وفنادق وطيران ونقل وخدمات سفر من مكاتب سياحة معتمدة.'}</p></div>
      <div className="services-hero-counter"><SlidersHorizontal size={27} /><strong>{filtered.length}</strong><span>خدمة مطابقة</span></div>
    </section>

    {!favoritesOnly ? <SmartTravelSearch services={services} onSelectService={onSelectService} /> : null}

    {!favoritesOnly ? <section className="service-kind-showcase" aria-label="تصنيفات الخدمات">
      <button type="button" className={kind === 'all' ? 'active' : ''} onClick={() => setKind('all')}><span><SlidersHorizontal size={21} /></span><strong>كل الخدمات</strong><small>{services.length} خدمة</small></button>
      {(Object.entries(serviceKinds) as [ServiceKind, (typeof serviceKinds)[ServiceKind]][]).map(([id, meta]) => { const Icon = meta.icon; const count = services.filter((service) => service.type === id).length; return <button key={id} type="button" className={kind === id ? 'active' : ''} onClick={() => setKind(id)}><span><Icon size={21} /></span><strong>{meta.shortLabel}</strong><small>{count} خدمة</small></button>; })}
    </section> : null}

    <section className="filter-panel full-filter-panel services-filter-pro">
      <div className="services-search-row"><label className="search-field"><Search size={18} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value.slice(0, 100))} placeholder="ابحث باسم الخدمة أو المكتب أو المزايا" maxLength={100} autoComplete="off" /></label><button type="button" className={`secondary-button filter-open-button ${showAdvanced ? 'active' : ''}`} onClick={() => setShowAdvanced((value) => !value)}><Filter size={16} />الفلاتر</button></div>
      <div className="filter-toolbar"><label className="inline-select"><span>ترتيب النتائج</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="newest">الأحدث</option><option value="price_low">السعر: الأقل</option><option value="price_high">السعر: الأعلى</option><option value="rating">الأعلى تقييمًا</option></select></label><label className="availability-inline"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /><span>المتاح للحجز فقط</span></label>{hasFilters ? <button type="button" className="text-button" onClick={resetFilters}><RotateCcw size={15} />مسح الفلاتر</button> : null}<span className="result-count">{filtered.length} نتيجة</span></div>
      {showAdvanced ? <div className="advanced-filter-grid screen-enter"><label><span>مكتب السياحة</span><select value={officeId} onChange={(event) => setOfficeId(event.target.value)}><option value="all">كل المكاتب</option>{offices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}</select></label><label><span>أقل تقييم</span><select value={minimumRating} onChange={(event) => setMinimumRating(Number(event.target.value))}><option value={0}>أي تقييم</option><option value={3}>3 نجوم فأعلى</option><option value={4}>4 نجوم فأعلى</option><option value={4.5}>4.5 نجمة فأعلى</option></select></label><label><span>أقصى سعر أساسي</span><div className="range-row"><input type="range" min="0" max={Math.max(1, catalogMaximum)} step="1" value={maximumPrice ?? catalogMaximum} onChange={(event) => setMaximumPrice(Number(event.target.value))} /><strong>{maximumPrice == null || maximumPrice >= catalogMaximum ? 'بدون حد' : `${maximumPrice} د.أ`}</strong></div></label></div> : null}
    </section>

    {filtered.length ? <div className="service-grid services-grid-pro">{filtered.map((service) => <ServiceCard key={service.id} service={service} favorite={favoriteIds.has(service.id)} onSelect={onSelectService} onFavorite={onFavorite} />)}</div> : <EmptyState icon={favoritesOnly ? Heart : Search} title={favoritesOnly ? 'المفضلة فارغة' : 'ما لقينا نتائج مطابقة'} description={services.length ? (favoritesOnly ? 'اضغط علامة القلب على أي خدمة لحفظها هنا.' : 'غيّر البحث أو أحد خيارات التصفية وجرب مرة ثانية.') : 'لا توجد خدمات منشورة حاليًا.'} />}

    {officeId !== 'all' ? (() => { const office = offices.find((item) => item.id === officeId); return office ? <button type="button" className="office-filter-link" onClick={() => onSelectOffice(office)}>عرض صفحة {office.name}</button> : null; })() : null}
  </div>;
}
