-- RealTrack Database Schema
-- Multi-tenant delivery tracking platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Businesses table for multi-tenancy
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    vehicle_type TEXT, -- car, motorcycle, bicycle, etc.
    license_plate TEXT,
    is_active BOOLEAN DEFAULT true,
    location GEOMETRY(POINT, 4326), -- Current location
    last_location_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery statuses
CREATE TYPE delivery_status AS ENUM ('pending', 'assigned', 'on_route', 'delivered', 'cancelled');

-- Deliveries table
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    delivery_address TEXT NOT NULL,
    delivery_coordinates GEOMETRY(POINT, 4326),
    notes TEXT,
    status delivery_status DEFAULT 'pending',
    tracking_code TEXT UNIQUE NOT NULL,
    qr_code_url TEXT,
    estimated_delivery_time TIMESTAMPTZ,
    actual_delivery_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location updates table for real-time tracking
CREATE TABLE location_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    location GEOMETRY(POINT, 4326) NOT NULL,
    speed DECIMAL(5,2),
    heading DECIMAL(5,2),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_deliveries_business_id ON deliveries(business_id);
CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_tracking_code ON deliveries(tracking_code);
CREATE INDEX idx_location_updates_delivery_id ON location_updates(delivery_id);
CREATE INDEX idx_location_updates_timestamp ON location_updates(timestamp);
CREATE INDEX idx_drivers_business_id ON drivers(business_id);
CREATE INDEX idx_drivers_is_active ON drivers(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique tracking code
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        code := upper(substr(md5(random()::text), 1, 8));
        SELECT EXISTS(SELECT 1 FROM deliveries WHERE tracking_code = code) INTO exists;
        IF NOT exists THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new delivery
CREATE OR REPLACE FUNCTION create_delivery(
    p_business_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_delivery_address TEXT,
    p_delivery_coordinates GEOMETRY(POINT, 4326),
    p_notes TEXT DEFAULT NULL,
    p_estimated_delivery_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    delivery_id UUID;
    tracking_code TEXT;
BEGIN
    tracking_code := generate_tracking_code();
    
    INSERT INTO deliveries (
        business_id,
        customer_name,
        customer_phone,
        delivery_address,
        delivery_coordinates,
        notes,
        tracking_code,
        estimated_delivery_time
    ) VALUES (
        p_business_id,
        p_customer_name,
        p_customer_phone,
        p_delivery_address,
        p_delivery_coordinates,
        p_notes,
        tracking_code,
        p_estimated_delivery_time
    ) RETURNING id INTO delivery_id;
    
    RETURN delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign driver to delivery
CREATE OR REPLACE FUNCTION assign_driver_to_delivery(
    p_delivery_id UUID,
    p_driver_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE deliveries 
    SET driver_id = p_driver_id, 
        status = 'assigned',
        updated_at = NOW()
    WHERE id = p_delivery_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update delivery status
CREATE OR REPLACE FUNCTION update_delivery_status(
    p_delivery_id UUID,
    p_status delivery_status
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE deliveries 
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_delivery_id;
    
    -- Set actual delivery time when delivered
    IF p_status = 'delivered' THEN
        UPDATE deliveries 
        SET actual_delivery_time = NOW()
        WHERE id = p_delivery_id;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add location update
CREATE OR REPLACE FUNCTION add_location_update(
    p_delivery_id UUID,
    p_driver_id UUID,
    p_location GEOMETRY(POINT, 4326),
    p_speed DECIMAL(5,2) DEFAULT NULL,
    p_heading DECIMAL(5,2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    location_update_id UUID;
BEGIN
    -- Update driver's current location
    UPDATE drivers 
    SET location = p_location,
        last_location_update = NOW()
    WHERE id = p_driver_id;
    
    -- Insert location update
    INSERT INTO location_updates (
        delivery_id,
        driver_id,
        location,
        speed,
        heading
    ) VALUES (
        p_delivery_id,
        p_driver_id,
        p_location,
        p_speed,
        p_heading
    ) RETURNING id INTO location_update_id;
    
    RETURN location_update_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for active deliveries with driver info
CREATE VIEW active_deliveries AS
SELECT 
    d.id,
    d.business_id,
    d.customer_name,
    d.customer_phone,
    d.delivery_address,
    d.status,
    d.tracking_code,
    d.estimated_delivery_time,
    d.created_at,
    dr.id as driver_id,
    dr.name as driver_name,
    dr.phone as driver_phone,
    dr.vehicle_type,
    dr.location as driver_location,
    dr.last_location_update as driver_last_update
FROM deliveries d
LEFT JOIN drivers dr ON d.driver_id = dr.id
WHERE d.status IN ('assigned', 'on_route')
ORDER BY d.created_at DESC;

-- View for delivery tracking
CREATE VIEW delivery_tracking AS
SELECT 
    d.id,
    d.tracking_code,
    d.customer_name,
    d.delivery_address,
    d.delivery_coordinates,
    d.status,
    d.estimated_delivery_time,
    d.actual_delivery_time,
    d.created_at,
    b.name as business_name,
    b.phone as business_phone,
    dr.id as driver_id,
    dr.name as driver_name,
    dr.vehicle_type,
    dr.location as current_location,
    dr.last_location_update,
    -- Get latest location update
    (SELECT ST_AsText(location) 
     FROM location_updates lu 
     WHERE lu.delivery_id = d.id 
     ORDER BY lu.timestamp DESC 
     LIMIT 1) as latest_location,
    (SELECT lu.timestamp 
     FROM location_updates lu 
     WHERE lu.delivery_id = d.id 
     ORDER BY lu.timestamp DESC 
     LIMIT 1) as latest_location_time
FROM deliveries d
JOIN businesses b ON d.business_id = b.id
LEFT JOIN drivers dr ON d.driver_id = dr.id
WHERE d.status != 'cancelled';