import { ArrowLeft, Building2, CheckCircle2, MapPin, Navigation, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { CatalogService, PlatformAd, ServiceKind, TravelOffice } from '../types';
import { EmptyState } from '../components/EmptyState';
import { ServiceCard } from '../components/ServiceCard';
import { AppImage } from '../components/AppImage';
import { adImageFallback, officeImageFallback } from '../media';
import {
  findRegionByKey,
  recommendRegionalServices,
  resolveJordanRegion,
  type JordanRegion,
} from '../regionalDiscovery';

interface HomePageProps {
  services: CatalogService[];
  offices: TravelOffice[];
  ads: PlatformAd[];
  favoriteIds: Set<string>;
  onSelectService: (service: CatalogService) => void;
  onFavorite: (service: CatalogService, favorite: boolean) => void;
  onSelectOffice: (office: TravelOffice) => void;
  onBrowseServices: (kind?: ServiceKind) => void;
  onOpenFavorites: () => void;
}

const REGION_STORAGE_KEY = 'safretak-client-region-v1';

type LocationState = 'idle' | 'locating' | 'ready' | 'unavailable';

export function HomePage({ services, offices, ads, favoriteIds, onSelectService, onFavorite, onSelectOffice, onBrowseServices, onOpenFavorites }: HomePageProps) {
  const [clientRegion, setClientRegion] = useState<JordanRegion | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [activeOfficeIndex, setActiveOfficeIndex] = useState(0);
  const trendingOffices = useMemo(() => offices
    .map((office) => ({ ...office, serviceCount: services.filter((service) => service.officeId === office.id).length }))
    .sort((left, right) => (right.rating * 20 + (right.serviceCount || 0)) - (left.rating * 20 + (left.serviceCount || 0)))
    .slice(0, 10), [offices, services]);

  const regionalRecommendations = useMemo(
    () => recommendRegionalServices(services, clientRegion, 6),
    [clientRegion, services],
  );

  const locateClient = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationState('unavailable');
      return;
    }

    setLocationState('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const region = resolveJordanRegion(coords.latitude, coords.longitude);
        if (!region) {
          setClientRegion(null);
          setLocationState('unavailable');
          return;
        }
        setClientRegion(region);
        setLocationState('ready');
        try { window.localStorage.setItem(REGION_STORAGE_KEY, region.key); } catch { /* local preference is optional */ }
      },
      () => setLocationState('unavailable'),
      { enableHighAccuracy: false, maximumAge: 24 * 60 * 60 * 1000, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cachedRegion: JordanRegion | null = null;
    try { cachedRegion = findRegionByKey(window.localStorage.getItem(REGION_STORAGE_KEY)); } catch { /* local preference is optional */ }
    if (cachedRegion) {
      setClientRegion(cachedRegion);
      setLocationState('ready');
      return;
    }
    locateClient();
  }, [locateClient]);

  const regionalHeading = clientRegion && regionalRecommendations.mode === 'regional'
    ? `الخدمات الرائجة في ${clientRegion.label}`
    : 'الرحلات الأعلى تقييمًا';
  const regionalCaption = clientRegion && regionalRecommendations.mode === 'regional'
    ? 'من المكاتب الموثقة والقريبة من منطقتك، مع أولوية لبرامج العمرة.'
    : 'مختارات من المكاتب الموثقة، مع أولوية لبرامج العمرة ثم الرحلات الأعلى تقييمًا.';

  useEffect(() => {
    if (trendingOffices.length < 2) {
      setActiveOfficeIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setActiveOfficeIndex((current) => (current + 1) % trendingOffices.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [trendingOffices.length]);

  return (
    <div className="page-stack page-enter">
      <section className="trending-offices-section trending-offices-top" aria-labelledby="trending-offices-title">
        <div className="section-heading trending-heading">
          <div><span>الرائجة الآن</span><h2 id="trending-offices-title">المكاتب الرائجة</h2></div>
          <small><CheckCircle2 size={13} />للمكاتب الموثقة فقط</small>
        </div>
        {trendingOffices.length ? (
          <div className="office-card-carousel" role="region" aria-label="المكاتب السياحية الرائجة">
            <div
              className={`office-card-carousel-track ${trendingOffices.length === 1 ? 'single-office' : ''}`}
              style={{ '--office-slide': activeOfficeIndex } as CSSProperties}
            >
              {trendingOffices.map((office, officeIndex) => (
                <button key={office.id} type="button" className={`trending-office-card ${officeIndex === activeOfficeIndex ? 'active' : ''}`} onClick={() => onSelectOffice(office)}>
                  <span className="trending-office-logo"><AppImage src={office.logoUrl} fallbackSrc={officeImageFallback} alt={`شعار ${office.name}`} /></span>
                  <span className="trending-office-copy"><small><CheckCircle2 size={13} />مكتب موثق</small><strong>{office.name}</strong><em><Star size={13} fill="currentColor" />{office.rating.toFixed(1)} · {office.serviceCount || 0} خدمات منشورة</em></span>
                  <span className="office-card-open">عرض المكتب <ArrowLeft size={16} /></span>
                </button>
              ))}
            </div>
            {trendingOffices.length > 1 ? (
              <div className="office-carousel-dots" aria-label="التنقل بين المكاتب">
                {trendingOffices.map((office, index) => <button key={office.id} type="button" className={index === activeOfficeIndex ? 'active' : ''} onClick={() => setActiveOfficeIndex(index)} aria-label={`عرض مكتب ${office.name}`} />)}
              </div>
            ) : null}
          </div>
        ) : <EmptyState icon={Building2} title="لا توجد مكاتب رائجة حاليًا" description="ستظهر المكاتب الموثقة هنا بعد نشر خدماتها." />}
      </section>

      <section className="regional-services-section" aria-labelledby="regional-services-title">
        <div className="section-heading regional-heading">
          <div><span>مختارة حسب منطقتك</span><h2 id="regional-services-title">{regionalHeading}</h2><p>{regionalCaption}</p></div>
          <button type="button" className={`region-control ${locationState === 'locating' ? 'loading' : ''}`} onClick={locateClient} disabled={locationState === 'locating'}>
            {locationState === 'locating' ? <Navigation size={14} /> : <MapPin size={14} />}
            {locationState === 'locating' ? 'جاري تحديد المنطقة' : clientRegion?.label || 'تحديد منطقتي'}
          </button>
        </div>
        {regionalRecommendations.services.length ? (
          <div className="service-grid regional-service-grid">
            {regionalRecommendations.services.map((service) => <ServiceCard key={service.id} service={service} favorite={favoriteIds.has(service.id)} onSelect={onSelectService} onFavorite={onFavorite} />)}
          </div>
        ) : <EmptyState icon={MapPin} title="لا توجد خدمات رائجة حاليًا" description="ستظهر هنا خدمات المكاتب الموثقة فور توفرها." actionLabel="استعراض كل الخدمات" onAction={() => onBrowseServices()} />}
      </section>

      {ads.length ? (
        <section className="ad-strip" aria-label="عروض المنصة">
          {ads.slice(0, 5).map((ad) => ad.link ? (
            <a key={ad.id} href={ad.link} className="ad-card" target="_blank" rel="noopener noreferrer"><AppImage src={ad.imageUrl} fallbackSrc={adImageFallback} alt={ad.titleAr} /><strong>{ad.titleAr}</strong></a>
          ) : (
            <article key={ad.id} className="ad-card"><AppImage src={ad.imageUrl} fallbackSrc={adImageFallback} alt={ad.titleAr} /><strong>{ad.titleAr}</strong></article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
