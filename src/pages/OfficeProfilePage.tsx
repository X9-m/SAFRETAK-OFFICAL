import { ArrowRight, Building2, ShieldCheck, Star } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { ServiceCard } from '../components/ServiceCard';
import type { CatalogService, TravelOffice } from '../types';
import { AppImage } from '../components/AppImage';
import { officeImageFallback } from '../media';

interface OfficeProfilePageProps {
  office: TravelOffice;
  services: CatalogService[];
  favoriteIds: Set<string>;
  onBack: () => void;
  onSelectService: (service: CatalogService) => void;
  onFavorite: (service: CatalogService, favorite: boolean) => void;
}

export function OfficeProfilePage({ office, services, favoriteIds, onBack, onSelectService, onFavorite }: OfficeProfilePageProps) {
  const officeServices = services.filter((service) => service.officeId === office.id);
  const averageRating = officeServices.length ? officeServices.reduce((sum, service) => sum + service.rating, 0) / officeServices.length : office.rating;

  return (
    <div className="page-stack page-enter">
      <button type="button" className="back-button" onClick={onBack}><ArrowRight size={18} />العودة للخدمات</button>
      <section className="office-profile-hero">
        <div className="office-cover"><AppImage src={office.coverUrl} fallbackSrc={officeImageFallback} alt={`غلاف ${office.name}`} loading="eager" fetchPriority="high" /></div>
        <div className="office-profile-copy">
          <div className="office-profile-logo"><AppImage src={office.logoUrl} fallbackSrc={officeImageFallback} alt={`شعار ${office.name}`} loading="eager" /></div>
          <div><span className="verified-label"><ShieldCheck size={15} />مكتب سياحة معتمد</span><h1>{office.name}</h1><p>{office.description || 'يقدم المكتب خدماته المنشورة عبر منصة سفرتك.'}</p><div className="details-meta"><span><Star size={15} fill="currentColor" />{averageRating.toFixed(1)}</span><span>{officeServices.length} خدمات منشورة</span></div></div>
        </div>
      </section>
      <section>
        <div className="section-heading"><div><span>خدمات المكتب</span><h2>الخدمات المتاحة للحجز</h2></div></div>
        {officeServices.length ? <div className="service-grid">{officeServices.map((service) => <ServiceCard key={service.id} service={service} favorite={favoriteIds.has(service.id)} onSelect={onSelectService} onFavorite={onFavorite} />)}</div> : <EmptyState icon={Building2} title="لا توجد خدمات منشورة" description="ستظهر خدمات المكتب هنا عند نشرها واعتمادها." />}
      </section>
    </div>
  );
}
