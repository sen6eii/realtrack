-- Driver Schema Migration Script
-- This script extends the existing RealTrack schema with comprehensive driver functionality

-- Run this migration after the base schema is already set up

BEGIN;

-- Create driver profiles table
CREATE TABLE IF NOT EXISTS driver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE UNIQUE,
    profile_image_url TEXT,
    rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 0.0 AND rating <= 5.0),
    total_ratings INTEGER DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    average_delivery_time_minutes INTEGER,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.0,
    preferred_delivery_areas TEXT[],
    max_deliveries_per_day INTEGER DEFAULT 10,
    work_schedule JSONB,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    bank_account_details JSONB,
    vehicle_details JSONB,
    driver_licenses JSONB,
    insurance_details JSONB,
    background_check_status TEXT DEFAULT 'pending',
    background_check_date TIMESTAMPTZ,
    training_completed BOOLEAN DEFAULT false,
    training_completion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create driver availability table
CREATE TABLE IF NOT EXISTS driver_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,
    reason_unavailable TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(driver_id, date)
);

-- Create driver earnings table
CREATE TABLE IF NOT EXISTS driver_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    base_amount DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (base_amount + tip_amount + bonus_amount) STORED,
    currency TEXT DEFAULT 'USD',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create driver performance metrics table
CREATE TABLE IF NOT EXISTS driver_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_deliveries INTEGER DEFAULT 0,
    completed_deliveries INTEGER DEFAULT 0,
    cancelled_deliveries INTEGER DEFAULT 0,
    average_delivery_time_minutes INTEGER,
    total_distance_km DECIMAL(10,2),
    total_earnings DECIMAL(10,2),
    customer_rating DECIMAL(3,2),
    on_time_deliveries INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(driver_id, metric_date)
);

-- Create driver ratings table
CREATE TABLE IF NOT EXISTS driver_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_comment TEXT,
    rating_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create driver notifications table
CREATE TABLE IF NOT EXISTS driver_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('delivery_assigned', 'delivery_update', 'payment', 'system', 'promotion')),
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to location_updates table if they don't exist
ALTER TABLE location_updates 
ADD COLUMN IF NOT EXISTS battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS altitude DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS activity_type TEXT;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_driver_profiles_driver_id ON driver_profiles(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_availability_driver_id_date ON driver_availability(driver_id, date);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_id ON driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_delivery_id ON driver_earnings(delivery_id);
CREATE INDEX IF NOT EXISTS idx_driver_performance_metrics_driver_id_date ON driver_performance_metrics(driver_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver_id ON driver_ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_driver_id ON driver_notifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_is_read ON driver_notifications(is_read);

-- Enable RLS on new tables
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at on new tables
CREATE TRIGGER IF NOT EXISTS update_driver_profiles_updated_at BEFORE UPDATE ON driver_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_driver_availability_updated_at BEFORE UPDATE ON driver_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_driver_earnings_updated_at BEFORE UPDATE ON driver_earnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_driver_performance_metrics_updated_at BEFORE UPDATE ON driver_performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create enhanced driver functions
CREATE OR REPLACE FUNCTION upsert_driver_profile(
    p_driver_id UUID,
    p_profile_image_url TEXT DEFAULT NULL,
    p_preferred_areas TEXT[] DEFAULT NULL,
    p_max_deliveries INTEGER DEFAULT 10,
    p_emergency_contact_name TEXT DEFAULT NULL,
    p_emergency_contact_phone TEXT DEFAULT NULL,
    p_vehicle_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    profile_id UUID;
BEGIN
    INSERT INTO driver_profiles (
        driver_id,
        profile_image_url,
        preferred_delivery_areas,
        max_deliveries_per_day,
        emergency_contact_name,
        emergency_contact_phone,
        vehicle_details
    ) VALUES (
        p_driver_id,
        p_profile_image_url,
        p_preferred_areas,
        p_max_deliveries,
        p_emergency_contact_name,
        p_emergency_contact_phone,
        p_vehicle_details
    )
    ON CONFLICT (driver_id) DO UPDATE SET
        profile_image_url = COALESCE(EXCLUDED.profile_image_url, driver_profiles.profile_image_url),
        preferred_delivery_areas = COALESCE(EXCLUDED.preferred_delivery_areas, driver_profiles.preferred_delivery_areas),
        max_deliveries_per_day = COALESCE(EXCLUDED.max_deliveries_per_day, driver_profiles.max_deliveries_per_day),
        emergency_contact_name = COALESCE(EXCLUDED.emergency_contact_name, driver_profiles.emergency_contact_name),
        emergency_contact_phone = COALESCE(EXCLUDED.emergency_contact_phone, driver_profiles.emergency_contact_phone),
        vehicle_details = COALESCE(EXCLUDED.vehicle_details, driver_profiles.vehicle_details),
        updated_at = NOW()
    RETURNING id INTO profile_id;
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_nearby_available_drivers(
    p_business_id UUID,
    p_latitude DECIMAL(10,8),
    p_longitude DECIMAL(11,8),
    p_radius_km INTEGER DEFAULT 10
)
RETURNS TABLE(
    driver_id UUID,
    driver_name TEXT,
    driver_phone TEXT,
    vehicle_type TEXT,
    rating DECIMAL(3,2),
    distance_km DECIMAL(8,2),
    last_location_update TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as driver_id,
        d.name as driver_name,
        d.phone as driver_phone,
        d.vehicle_type,
        COALESCE(dp.rating, 5.0) as rating,
        ST_Distance(d.location::geography, ST_MakePoint(p_longitude, p_latitude)::geography) / 1000 as distance_km,
        d.last_location_update
    FROM drivers d
    LEFT JOIN driver_profiles dp ON d.id = dp.driver_id
    WHERE d.business_id = p_business_id
    AND d.is_active = true
    AND d.location IS NOT NULL
    AND d.last_location_update > NOW() - INTERVAL '1 hour'
    AND ST_DWithin(
        d.location::geography, 
        ST_MakePoint(p_longitude, p_latitude)::geography, 
        p_radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sample driver profile data for existing drivers
INSERT INTO driver_profiles (driver_id, vehicle_details)
SELECT 
    id,
    jsonb_build_object(
        'type', vehicle_type,
        'license_plate', license_plate,
        'make', 'Sample Make',
        'model', 'Sample Model',
        'year', 2020
    )::jsonb
FROM drivers
ON CONFLICT (driver_id) DO NOTHING;

COMMIT;