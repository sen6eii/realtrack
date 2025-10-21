-- Driver Profiles Enhancement
-- This file extends the existing schema with driver-specific functionality

-- Driver profiles table (extends drivers table with additional information)
CREATE TABLE driver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE UNIQUE,
    profile_image_url TEXT,
    rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 0.0 AND rating <= 5.0),
    total_ratings INTEGER DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    average_delivery_time_minutes INTEGER,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.0,
    preferred_delivery_areas TEXT[], -- Array of preferred ZIP codes or areas
    max_deliveries_per_day INTEGER DEFAULT 10,
    work_schedule JSONB, -- Flexible schedule: {"monday": ["09:00", "17:00"], ...}
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    bank_account_details JSONB, -- Encrypted bank details for payments
    vehicle_details JSONB, -- Extended vehicle information
    driver_licenses JSONB, -- Driver license information
    insurance_details JSONB, -- Insurance information
    background_check_status TEXT DEFAULT 'pending', -- pending, approved, rejected
    background_check_date TIMESTAMPTZ,
    training_completed BOOLEAN DEFAULT false,
    training_completion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver availability table
CREATE TABLE driver_availability (
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

-- Driver earnings table
CREATE TABLE driver_earnings (
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

-- Driver performance metrics table
CREATE TABLE driver_performance_metrics (
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

-- Driver ratings table
CREATE TABLE driver_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_comment TEXT,
    rating_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver notifications table
CREATE TABLE driver_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('delivery_assigned', 'delivery_update', 'payment', 'system', 'promotion')),
    is_read BOOLEAN DEFAULT false,
    data JSONB, -- Additional data related to the notification
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced location_updates with more detailed information
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100);
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(8,2);
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS altitude DECIMAL(10,2);
ALTER TABLE location_updates ADD COLUMN IF NOT EXISTS activity_type TEXT; -- driving, walking, still, etc.

-- Add indexes for new tables
CREATE INDEX idx_driver_profiles_driver_id ON driver_profiles(driver_id);
CREATE INDEX idx_driver_availability_driver_id_date ON driver_availability(driver_id, date);
CREATE INDEX idx_driver_earnings_driver_id ON driver_earnings(driver_id);
CREATE INDEX idx_driver_earnings_delivery_id ON driver_earnings(delivery_id);
CREATE INDEX idx_driver_performance_metrics_driver_id_date ON driver_performance_metrics(driver_id, metric_date);
CREATE INDEX idx_driver_ratings_driver_id ON driver_ratings(driver_id);
CREATE INDEX idx_driver_notifications_driver_id ON driver_notifications(driver_id);
CREATE INDEX idx_driver_notifications_is_read ON driver_notifications(is_read);

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON driver_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_availability_updated_at BEFORE UPDATE ON driver_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_earnings_updated_at BEFORE UPDATE ON driver_earnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_performance_metrics_updated_at BEFORE UPDATE ON driver_performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();