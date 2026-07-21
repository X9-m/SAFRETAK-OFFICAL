import { ArrowLeft, Star } from 'lucide-react';
import type { TravelOffice } from '../types';
import { AppImage } from './AppImage';
import { officeImageFallback } from '../media';

interface OfficeCardProps {
  office: TravelOffice;
  onSelect: (office: TravelOffice) => void;
}

export function OfficeCard({ office, onSelect }: OfficeCardProps) {
  return (
    <button type="button" className="office-card" onClick={() => onSelect(office)}>
      <div className="office-card-logo"><AppImage src={office.logoUrl} fallbackSrc={officeImageFallback} alt={`شعار ${office.name}`} /></div>
      <div><strong>{office.name}</strong><span><Star size={13} fill="currentColor" />{office.rating.toFixed(1)}</span><small>{office.serviceCount ? `${office.serviceCount} خدمات منشورة` : 'مكتب سياحة معتمد'}</small></div>
      <ArrowLeft size={17} />
    </button>
  );
}
