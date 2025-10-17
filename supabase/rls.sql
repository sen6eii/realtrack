-- RealTrack Row Level Security (RLS) Policies
-- Multi-tenant security policies

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

-- Businesses table policies
-- Business users can only see their own business
CREATE POLICY "Businesses can view own business" ON businesses
    FOR SELECT USING (
        auth.uid() = id OR 
        -- Users with custom claims can see their business
        auth.jwt()->>'business_id' = id::text
    );

-- Only authenticated users can insert businesses
CREATE POLICY "Users can create business" ON businesses
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Business owners can update their business
CREATE POLICY "Businesses can update own business" ON businesses
    FOR UPDATE USING (auth.uid() = id OR auth.jwt()->>'business_id' = id::text);

-- Drivers table policies
-- Business users can view drivers from their business only
CREATE POLICY "Business users can view own drivers" ON drivers
    FOR SELECT USING (
        auth.jwt()->>'business_id' = business_id::text OR
        -- Drivers can view their own profile
        auth.uid() = id
    );

-- Business users can create drivers for their business
CREATE POLICY "Business users can create drivers" ON drivers
    FOR INSERT WITH CHECK (auth.jwt()->>'business_id' = business_id::text);

-- Business users can update their drivers
CREATE POLICY "Business users can update own drivers" ON drivers
    FOR UPDATE USING (auth.jwt()->>'business_id' = business_id::text);

-- Drivers can update their own profile (location, status)
CREATE POLICY "Drivers can update own profile" ON drivers
    FOR UPDATE USING (auth.uid() = id AND (location IS NOT NULL OR is_active IS NOT NULL));

-- Deliveries table policies
-- Business users can view their own deliveries
CREATE POLICY "Business users can view own deliveries" ON deliveries
    FOR SELECT USING (auth.jwt()->>'business_id' = business_id::text);

-- Drivers can view deliveries assigned to them
CREATE POLICY "Drivers can view assigned deliveries" ON deliveries
    FOR SELECT USING (auth.uid() = driver_id);

-- Public read access for tracking by tracking_code (no auth required)
CREATE POLICY "Public tracking access" ON deliveries
    FOR SELECT USING (tracking_code IS NOT NULL);

-- Business users can create deliveries
CREATE POLICY "Business users can create deliveries" ON deliveries
    FOR INSERT WITH CHECK (auth.jwt()->>'business_id' = business_id::text);

-- Business users can update their deliveries
CREATE POLICY "Business users can update own deliveries" ON deliveries
    FOR UPDATE USING (auth.jwt()->>'business_id' = business_id::text);

-- Drivers can update delivery status (for assigned deliveries)
CREATE POLICY "Drivers can update delivery status" ON deliveries
    FOR UPDATE USING (
        auth.uid() = driver_id AND 
        status IN ('assigned', 'on_route', 'delivered')
    );

-- Location updates table policies
-- Business users can view location updates for their deliveries
CREATE POLICY "Business users can view own location updates" ON location_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deliveries d 
            WHERE d.id = location_updates.delivery_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Drivers can view location updates for their assigned deliveries
CREATE POLICY "Drivers can view assigned location updates" ON location_updates
    FOR SELECT USING (auth.uid() = driver_id);

-- Public read access for tracking (no auth required)
CREATE POLICY "Public tracking location access" ON location_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deliveries d 
            WHERE d.id = location_updates.delivery_id 
            AND d.tracking_code IS NOT NULL
        )
    );

-- Business users can insert location updates for their deliveries
CREATE POLICY "Business users can create location updates" ON location_updates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deliveries d 
            WHERE d.id = location_updates.delivery_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Drivers can insert location updates for assigned deliveries
CREATE POLICY "Drivers can create location updates" ON location_updates
    FOR INSERT WITH CHECK (
        auth.uid() = driver_id AND
        EXISTS (
            SELECT 1 FROM deliveries d 
            WHERE d.id = location_updates.delivery_id 
            AND d.driver_id = auth.uid()
        )
    );

-- Views policies
-- Active deliveries view - businesses can see their active deliveries
CREATE POLICY "Active deliveries for business" ON active_deliveries
    FOR SELECT USING (
        business_id::text = auth.jwt()->>'business_id' OR
        driver_id = auth.uid()
    );

-- Delivery tracking view - public access by tracking code
CREATE POLICY "Public delivery tracking" ON delivery_tracking
    FOR SELECT USING (tracking_code IS NOT NULL);