import type { CSSProperties } from 'react';
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
  const favoriteButtonStyle: CSSProperties = {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
    display: 'inline-flex',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    border: `1px solid ${favorite ? '#d5ad24' : 'rgba(213, 173, 36, 0.48)'}`,
    borderRadius: '50%',
    background: favorite ? '#d5ad24' : 'rgba(10, 33, 26, 0.9)',
    color: favorite ? '#0a211a' : '#e7c13d',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.28)',
    backdropFilter: 'blur(8px)',
    cursor: 'pointer',
  };

  return (
    <article className="service-card" style={{ position: 'relative' }}>
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
        <button type="button" className="service-favorite-button" style={favoriteButtonStyle} aria-pressed={favorite} onClick={() => onFavorite(service, !favorite)} aria-label={favorite ? `إزالة ${service.title} من المفضلة` : `إضافة ${service.title} إلى المفضلة`}>
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      ) : null}
    </article>
  );
}
