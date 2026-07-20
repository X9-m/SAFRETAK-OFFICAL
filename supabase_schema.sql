-- ====================================================================
-- SAFRETAK PLATFORM CORE SCHEMA (Supabase PostgreSQL)
-- Designed for Travelers, Travel Offices, and Platform Administrators
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Roles enum
CREATE TYPE user_role AS ENUM ('traveler', 'office', 'admin');
CREATE TYPE subscription_plan_tier AS ENUM ('Free', 'Basic', 'Premium');
CREATE TYPE booking_status AS ENUM ('Pending', 'Confirmed', 'Completed', 'Cancelled');
CREATE TYPE payment_status_tier AS ENUM ('unpaid', 'paid');
CREATE TYPE payment_method_tier AS ENUM ('CliQ', 'eFAWATEERcom', 'Visa', 'MasterCard', 'Cash at Office');
CREATE TYPE service_type_enum AS ENUM ('trip', 'hotel', 'car', 'flight', 'bus_train', 'hajj_umrah', 'insurance', 'visa', 'consultation');
CREATE TYPE complaint_status_enum AS ENUM ('Open', 'Resolved');

-- 2. USERS TABLE (Extends Supabase auth.users or behaves as main profiles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role user_role NOT NULL DEFAULT 'traveler',
    avatar_url VARCHAR(256),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TRAVEL OFFICES TABLE
CREATE TABLE IF NOT EXISTS public.travel_offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    logo VARCHAR(256),
    rating NUMERIC(3, 2) DEFAULT 5.00,
    location VARCHAR(150),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_plan subscription_plan_tier NOT NULL DEFAULT 'Free',
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    complaints_count INT DEFAULT 0,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SERVICE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SERVICES TABLE (Encompasses trips, flights, hotels, etc.)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID NOT NULL REFERENCES public.travel_offices(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
    type service_type_enum NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    image VARCHAR(256),
    images VARCHAR(256)[], -- Array of photo URLs
    location VARCHAR(150),
    terms TEXT,
    cancellation_policy TEXT,
    
    -- Service specific attributes (null if not applicable to the service type)
    sub_type VARCHAR(50), -- 'domestic' | 'international' | 'Hajj' | 'Umrah' etc.
    duration VARCHAR(50), -- "3 Days / 2 Nights"
    seats_remaining INT,
    itinerary JSONB, -- Stored structure of days & activities
    included VARCHAR(100)[], -- List of included items
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    office_id UUID NOT NULL REFERENCES public.travel_offices(id) ON DELETE CASCADE,
    traveler_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    service_type service_type_enum NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    traveler_name VARCHAR(100) NOT NULL,
    traveler_phone VARCHAR(20) NOT NULL,
    booking_details JSONB, -- Guest names, dynamic options, flight dates, room selections
    total_price NUMERIC(10, 2) NOT NULL,
    payment_method payment_method_tier NOT NULL,
    payment_status payment_status_tier NOT NULL DEFAULT 'unpaid',
    status booking_status NOT NULL DEFAULT 'Pending',
    qr_code TEXT,
    invoice_url VARCHAR(256),
    chat_history JSONB DEFAULT '[]'::jsonb, -- Shared communications
    documents JSONB DEFAULT '[]'::jsonb, -- e.g., tickets, insurance, visas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PAYMENTS TABLE (Audit log of financial transactions)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method payment_method_tier NOT NULL,
    status VARCHAR(30) NOT NULL, -- 'success', 'pending', 'failed'
    transaction_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    traveler_name VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. COMPLAINTS TABLE (Admin intervention and tracking)
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    traveler_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    office_id UUID REFERENCES public.travel_offices(id) ON DELETE CASCADE,
    traveler_name VARCHAR(100) NOT NULL,
    traveler_phone VARCHAR(20) NOT NULL,
    office_name VARCHAR(100) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    details TEXT NOT NULL,
    status complaint_status_enum NOT NULL DEFAULT 'Open',
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. PLATFORM STATISTICS & SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_stats (
    id INT PRIMARY KEY DEFAULT 1,
    total_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_bookings INT NOT NULL DEFAULT 0,
    active_travelers INT NOT NULL DEFAULT 0,
    active_offices INT NOT NULL DEFAULT 0,
    commission_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_services_office ON public.services(office_id);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler ON public.bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_bookings_office ON public.bookings(office_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_complaints_office ON public.complaints(office_id);

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Traveler Policy for Bookings
CREATE POLICY traveler_booking_policy ON public.bookings
    FOR ALL
    USING (auth.uid() = traveler_id);

-- Travel Office Policy for Bookings
CREATE POLICY office_booking_policy ON public.bookings
    FOR ALL
    USING (auth.uid() IN (SELECT owner_id FROM public.travel_offices WHERE id = office_id));
