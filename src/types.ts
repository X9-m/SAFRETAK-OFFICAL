export type ServiceType =
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

export interface Traveler {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  avatarUrl?: string;
}

export interface TravelOffice {
  id: string;
  name: string;
  logo: string;
  rating: number;
  location: string;
  isApproved: boolean;
  subscriptionPlan: 'Free' | 'Basic' | 'Premium';
  balance: number;
  complaintsCount: number;
}

export interface BaseService {
  id: string;
  officeId: string;
  officeName: string;
  title: string;
  price: number;
  rating: number;
  image: string;
  images?: string[];
  description: string;
  location?: string;
  terms?: string;
  cancellationPolicy?: string;
  availableDates?: string[];
}

export interface TripService extends BaseService {
  type: 'domestic' | 'international';
  duration: string; // e.g., "3 Days / 2 Nights"
  seatsRemaining: number;
  itinerary: { day: number; title: string; activities: string[] }[];
  included: string[];
}

export interface HotelService extends BaseService {
  city: string;
  stars: number;
  amenities: string[];
  rooms: { type: string; price: number; available: number; amenities: string[] }[];
}

export interface CarService extends BaseService {
  city: string;
  carType: 'SUV' | 'Sedan' | 'Luxury' | 'Economy';
  company: string;
  capacity: number;
  transmission: 'Automatic' | 'Manual';
}

export interface FlightService extends BaseService {
  from: string;
  to: string;
  airline: string;
  cabinClass: 'Economy' | 'Business' | 'First';
  tripType: 'one-way' | 'round-trip' | 'multi-city';
  departureDate: string;
  returnDate?: string;
  duration: string;
}

export interface BusTrainService extends BaseService {
  type: 'bus' | 'train';
  from: string;
  to: string;
  departureTime: string;
  duration: string;
  company: string;
  availableSeats: number;
}

export interface HajjUmrahService extends BaseService {
  programType: 'Hajj' | 'Umrah';
  duration: string;
  hotelAmman?: string;
  hotelMakkah: string;
  hotelMadinah: string;
  seatsRemaining: number;
  supervisorName: string;
  includedFlights: string;
}

export interface InsuranceService extends BaseService {
  planType: 'Individual' | 'Family' | 'Worldwide';
  durationDays: number;
  coverageLimit: string;
  benefits: string[];
}

export interface VisaService extends BaseService {
  country: string;
  requirements: string[];
  documentsRequired: string[];
  processingTime: string;
  fee: number;
}

export interface ConsultationService extends BaseService {
  languages: string[];
  experienceYears: number;
}

export interface Booking {
  id: string;
  serviceType: ServiceType;
  serviceId: string;
  serviceName: string;
  officeId: string;
  officeName: string;
  travelerId: string;
  travelerName: string;
  travelerPhone: string;
  bookingDetails: Record<string, any>;
  totalPrice: number;
  paymentMethod: 'CliQ' | 'eFAWATEERcom' | 'Visa' | 'MasterCard' | 'Cash at Office';
  paymentStatus: 'unpaid' | 'paid';
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  qrCode: string;
  invoiceUrl?: string;
  createdAt: string;
  chatHistory: { sender: 'traveler' | 'office'; message: string; timestamp: string }[];
  documents?: { name: string; url: string }[];
}

export interface Review {
  id: string;
  serviceId: string;
  travelerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Complaint {
  id: string;
  travelerName: string;
  travelerPhone: string;
  officeName: string;
  subject: string;
  details: string;
  status: 'Open' | 'Resolved';
  createdAt: string;
  resolution?: string;
}

export interface PlatformAd {
  id: string;
  titleEn: string;
  titleAr: string;
  image: string;
  link: string;
  isActive: boolean;
}

export interface PlatformStats {
  totalRevenue: number;
  totalBookings: number;
  activeTravelers: number;
  activeOffices: number;
  commissionEarned: number;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  maxDiscount: number;
  isActive: boolean;
  minBookingValue: number;
  expiryDate: string;
}
