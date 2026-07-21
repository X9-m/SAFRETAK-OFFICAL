import { ArrowLeft, Clock3, Heart, Star } from 'lucide-react';
import { formatMoney, serviceKinds } from '../domain';
import { AppImage } from './AppImage';
import { serviceImageFallback } from '../media';
import type { CatalogService } from '../types';

interface ServiceCardProps {
  service: CatalogService;
  favorite?: boolean;
  onSelect: (service: CatalogService) => void;
  onFavorite?: (service: CatalogService, favorite: boolean) => void;
}

export function ServiceCard({ service, favorite = false, onSelect, onFavorite }: ServiceCardProps) {
  const meta = serviceKinds[service.type];
  const Icon = meta.icon;

  return (
    <article className="service-card">
      <button type="button" className="service-card-hit" onClick={() => onSelect(service)} aria-label={`فتح تفاصيل ${service.title}`}>
        <div className="service-media">
          <AppImage src={service.imageUrl} fallbackSrc={serviceImageFallback(service.type)} alt={service.title} />
          <span className="service-kind-badge">{meta.shortLabel}</span>
        </div>
        <div className="service-card-body">
          <div className="service-card-title-row">
            <h3>{service.title}</h3>
            <span className="rating"><Star size={13} fill="currentColor" /> {service.rating.toFixed(1)}</span>
          </div>
          <p className="service-office">{service.office.name}</p>
          <div className="service-meta-row">{service.duration ? <span><Clock3 size={13} />{service.duration}</span> : null}</div>
          <div className="service-card-footer"><strong>{formatMoney(service.price)}</strong><span className="open-link">التفاصيل <ArrowLeft size={14} /></span></div>
        </div>
      </button>
      {onFavorite ? (
        <button type="button" className={`favorite-button ${favorite ? 'active' : ''}`} onClick={() => onFavorite(service, !favorite)} aria-label={favorite ? `إزالة ${service.title} من المفضلة` : `إضافة ${service.title} إلى المفضلة`}>
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      ) : null}
    </article>
  );
}
