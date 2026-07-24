export type AppRole = 'traveler' | 'office' | 'admin';
export type AuthIntent = 'login' | 'signup';
export type ServiceKind =
  | 'trip'
  | 'intl_trip'
  | 'hotel'
  | 'car'
  | 'flight'
  | 'bus_train'
  | 'hajj_umrah'
  | 'insurance'
  | 'visa'
  | 'consultation';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'unpaid' | 'paid';
export type PaymentMethod = 'CliQ' | 'eFAWATEERcom' | 'Cash at Office';
export type TravelerDocumentType = 'national_id' | 'passport';
export type FlightPassengerType = 'adult' | 'child' | 'infant';

export interface AppProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: AppRole;
  isActive: boolean;
  language: 'ar' | 'en';
  createdAt: string | null;
}

export interface TravelOffice {
  id: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  rating: number;
  description: string | null;
  location: string | null;
  serviceCount?: number;
}

export interface ServiceCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
}

export interface CatalogAddOn {
  id: string;
  label: string;
  price: number;
}

export interface CatalogOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface CatalogService {
  id: string;
  officeId: string;
  categoryId: string | null;
  type: ServiceKind;
  title: string;
  description: string;
  price: number;
  rating: number;
  imageUrl: string | null;
  images: string[];
  location: string | null;
  terms: string | null;
  cancellationPolicy: string | null;
  availableDates: string[];
  duration: string | null;
  seatsRemaining: number | null;
  itinerary: Array<Record<string, unknown> | string>;
  included: string[];
  details: Record<string, unknown>;
  addOns: CatalogAddOn[];
  options: CatalogOption[];
  office: TravelOffice;
  category: ServiceCategory | null;
}

export interface PlatformAd {
  id: string;
  titleAr: string;
  titleEn: string;
  imageUrl: string;
  link: string | null;
}

export interface BookingTraveler {
  fullName: string;
  nationality: string;
  documentType: TravelerDocumentType;
  documentNumber: string;
  documentExpiry: string | null;
  passengerType?: FlightPassengerType;
  birthDate?: string | null;
}

export interface TravelerBooking {
  id: string;
  referenceCode: string;
  serviceId: string | null;
  officeId: string;
  serviceType: ServiceKind;
  serviceName: string;
  officeName: string;
  bookingDetails: Record<string, unknown>;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  qrCode: string | null;
  invoiceUrl: string | null;
  documents: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface TravelerNotification {
  id: string;
  bookingId: string | null;
  type: string;
  titleAr: string;
  descriptionAr: string;
  isRead: boolean;
  requiresAction: boolean;
  createdAt: string;
}

export interface FavoriteService {
  serviceId: string;
  createdAt: string;
}

export interface NotificationPreferences {
  bookingUpdates: boolean;
  promotions: boolean;
  serviceAlerts: boolean;
}

export interface TravelerStats {
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
}

export interface PortalSnapshot {
  profile: AppProfile;
  bookings: TravelerBooking[];
  notifications: TravelerNotification[];
  favorites: FavoriteService[];
  notificationPreferences: NotificationPreferences;
  stats: TravelerStats;
}

export interface BookingDraft {
  serviceId: string;
  details: Record<string, unknown>;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  couponCode: string;
}

export interface ServiceReview {
  id: string;
  serviceId: string;
  travelerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isMine: boolean;
}

export interface BookingDocument {
  id: string;
  bookingId: string;
  originalName: string;
  documentType: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  fileSize: number;
  status: 'pending_review' | 'approved' | 'rejected';
  createdAt: string;
  signedUrl: string | null;
}

export interface BookingMessage {
  id: string;
  bookingId: string;
  sender: 'traveler' | 'office' | 'system';
  body: string;
  createdAt: string;
}
