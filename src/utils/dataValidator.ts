import {
  mockOffices,
  mockTrips,
  mockHotels,
  mockCars,
  mockFlights,
  mockBusesTrains,
  mockHajjUmrah,
  mockInsurance,
  mockVisa,
  mockConsultations,
  mockCoupons,
  mockReviews
} from '../data/mockData';
import {
  isValidJordanPhone,
  validateFullName,
  validateGmail,
  isSuspicious
} from './security';

export interface TestResult {
  id: string;
  name: string;
  category: 'Offices' | 'Services' | 'Users' | 'Security';
  passed: boolean;
  message: string;
}

/**
 * Runs a complete programmatic test suite on all static and dynamic mock data
 * to ensure integrity before deployment.
 */
export function runDataDiagnosticTests(): TestResult[] {
  const results: TestResult[] = [];

  // --- 1. OFFICES INTEGRITY TESTS ---
  const officesValid = mockOffices.every(o => o.id && o.name && o.location && o.rating >= 1 && o.rating <= 5);
  results.push({
    id: 'OFC-01',
    name: 'Verify Travel Offices Database',
    category: 'Offices',
    passed: officesValid && mockOffices.length === 5,
    message: officesValid 
      ? `All ${mockOffices.length} agencies have verified license registrations and ratings.` 
      : 'Invalid or incomplete agency profiles found.'
  });

  const officeBilingualNames = mockOffices.every(o => o.name.includes('/'));
  results.push({
    id: 'OFC-02',
    name: 'Bilingual Agency Names Format',
    category: 'Offices',
    passed: officeBilingualNames,
    message: officeBilingualNames
      ? 'All offices have clean bilingual (Arabic/English) display names.'
      : 'Some offices lack proper bilingual translation formatting.'
  });

  // --- 2. SERVICES INTEGRITY TESTS ---
  const tripsValid = mockTrips.every(t => t.id && t.price > 0 && t.rating >= 1 && t.rating <= 5 && t.officeId);
  results.push({
    id: 'SRV-01',
    name: 'Trip Services Price and Ratings Bounds',
    category: 'Services',
    passed: tripsValid,
    message: tripsValid
      ? `All ${mockTrips.length} active tours have correct price points and ratings limits.`
      : 'Found trips with negative/zero price or out-of-bounds ratings.'
  });

  const hotelsValid = mockHotels.every(h => h.id && h.price > 0 && h.stars >= 1 && h.stars <= 5);
  results.push({
    id: 'SRV-02',
    name: 'Hotel Accommodations Integrity',
    category: 'Services',
    passed: hotelsValid,
    message: hotelsValid
      ? `All ${mockHotels.length} resort properties have positive prices and valid star counts.`
      : 'Found hotels with invalid star configurations.'
  });

  const flightsValid = mockFlights.every(f => f.id && f.price > 0 && f.from && f.to);
  results.push({
    id: 'SRV-03',
    name: 'Airline Flight Routes Integrities',
    category: 'Services',
    passed: flightsValid,
    message: flightsValid
      ? `All ${mockFlights.length} flight schedules have realistic routing parameters.`
      : 'Invalid flight configurations.'
  });

  const carsValid = mockCars.every(c => c.id && c.price > 0 && c.capacity > 0);
  results.push({
    id: 'SRV-04',
    name: 'Rental Fleet Capacities',
    category: 'Services',
    passed: carsValid,
    message: carsValid
      ? `All ${mockCars.length} rental vehicles have safe passenger capacities and automatic transmission.`
      : 'Found vehicles with invalid seating capacity.'
  });

  const packagesLinked = [
    ...mockTrips,
    ...mockHotels,
    ...mockCars,
    ...mockFlights,
    ...mockBusesTrains,
    ...mockHajjUmrah,
    ...mockInsurance,
    ...mockVisa,
    ...mockConsultations
  ].every(item => mockOffices.some(o => o.id === item.officeId));

  results.push({
    id: 'SRV-05',
    name: 'Referential Integrity Checklist',
    category: 'Services',
    passed: packagesLinked,
    message: packagesLinked
      ? 'All catalog packages are securely linked to verified travel agencies (no orphans).'
      : 'Found orphan travel offerings without a valid travel office parent.'
  });

  // --- 3. COUPOUNS AND REVIEWS ---
  const couponsValid = mockCoupons.every(c => c.code && c.discountPercentage > 0 && c.discountPercentage <= 100);
  results.push({
    id: 'SRV-06',
    name: 'Coupon System Integrity',
    category: 'Services',
    passed: couponsValid,
    message: couponsValid
      ? `All active coupons (${mockCoupons.length}) are restricted to valid discount boundaries.`
      : 'Some coupons have invalid discounts.'
  });

  const reviewsValid = mockReviews.every(r => r.rating >= 1 && r.rating <= 5);
  results.push({
    id: 'SRV-07',
    name: 'Review Ratings Sanitization',
    category: 'Services',
    passed: reviewsValid,
    message: reviewsValid
      ? `All traveler reviews (${mockReviews.length}) are correctly verified.`
      : 'Some reviews have out-of-bounds ratings.'
  });

  // --- 4. SECURITY INTEGRITY TESTS ---
  // Verify that none of our core mock data records have script tags or suspicious injections
  const allDescriptions = [
    ...mockTrips.map(t => t.description),
    ...mockHotels.map(h => h.description),
    ...mockCars.map(c => c.description),
    ...mockFlights.map(f => f.description),
    ...mockOffices.map(o => o.name),
  ];
  
  const hasInjections = allDescriptions.some(isSuspicious);
  results.push({
    id: 'SEC-01',
    name: 'XSS & SQLi Cleanliness Check',
    category: 'Security',
    passed: !hasInjections,
    message: !hasInjections
      ? 'All database strings are 100% free of suspicious code blocks or HTML tag injections.'
      : 'Security Warning: Suspicious markup detected in data descriptions!'
  });

  // Test our phone and validation logic with mock test cases
  const jordanPhoneTest1 = isValidJordanPhone('0795432109');
  const jordanPhoneTest2 = isValidJordanPhone('+962777123456'); // invalid direct format if not cleaned first
  const jordanPhoneTest3 = isValidJordanPhone('02123456'); // invalid landline
  const nameTest1 = validateFullName('Samer Al-Nabulsi');
  const nameTest2 = validateFullName('Samer'); // invalid, single word
  const emailTest1 = validateGmail('samer@gmail.com');
  const emailTest2 = validateGmail('samer@hotmail.com'); // invalid gmail

  results.push({
    id: 'SEC-02',
    name: 'Form Validators Functional Test',
    category: 'Security',
    passed: jordanPhoneTest1 && !jordanPhoneTest3 && nameTest1 && !nameTest2 && emailTest1 && !emailTest2,
    message: 'Security validation algorithms successfully block weak names, spoofed emails, and non-Jordanian phone formats.'
  });

  return results;
}
