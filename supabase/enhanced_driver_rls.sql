-- Enhanced RLS Policies for Driver Tables
-- Additional security policies for new driver-related tables

-- Enable RLS on new tables
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;

-- Driver Profiles policies
-- Business users can view driver profiles for their drivers
CREATE POLICY "Business users can view own driver profiles" ON driver_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_profiles.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Drivers can view their own profile
CREATE POLICY "Drivers can view own profile" ON driver_profiles
    FOR SELECT USING (auth.uid() = driver_id);

-- Business users can create driver profiles for their drivers
CREATE POLICY "Business users can create driver profiles" ON driver_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_profiles.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Business users can update driver profiles for their drivers
CREATE POLICY "Business users can update own driver profiles" ON driver_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_profiles.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Drivers can update limited fields in their own profile
CREATE POLICY "Drivers can update limited own profile" ON driver_profiles
    FOR UPDATE USING (
        auth.uid() = driver_id AND
        (
            profile_image_url IS NOT NULL OR
            preferred_delivery_areas IS NOT NULL OR
            max_deliveries_per_day IS NOT NULL OR
            emergency_contact_name IS NOT NULL OR
            emergency_contact_phone IS NOT NULL OR
            vehicle_details IS NOT NULL
        )
    );

-- Driver Availability policies
-- Business users can view availability for their drivers
CREATE POLICY "Business users can view own driver availability" ON driver_availability
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_availability.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Drivers can view their own availability
CREATE POLICY "Drivers can view own availability" ON driver_availability
    FOR SELECT USING (auth.uid() = driver_id);

-- Business users can manage availability for their drivers
CREATE POLICY "Business users can manage driver availability" ON driver_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_availability.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Drivers can manage their own availability
CREATE POLICY "Drivers can manage own availability" ON driver_availability
    FOR ALL USING (auth.uid() = driver_id);

-- Driver Earnings policies
-- Business users can view earnings for their drivers
CREATE POLICY "Business users can view own driver earnings" ON driver_earnings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_earnings.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Drivers can view their own earnings
CREATE POLICY "Drivers can view own earnings" ON driver_earnings
    FOR SELECT USING (auth.uid() = driver_id);

-- Only system/business users can create earnings (calculated automatically)
CREATE POLICY "System can create driver earnings" ON driver_earnings
    FOR INSERT WITH CHECK (
        auth.jwt()->>'role' = 'service_role' OR
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_earnings.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Business users can update payment status
CREATE POLICY "Business users can update payment status" ON driver_earnings
    FOR UPDATE USING (
        auth.jwt()->>'role' = 'service_role' OR
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_earnings.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Driver Performance Metrics policies
-- Business users can view performance metrics for their drivers
CREATE POLICY "Business users can view own driver performance" ON driver_performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_performance_metrics.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Drivers can view their own performance metrics
CREATE POLICY "Drivers can view own performance" ON driver_performance_metrics
    FOR SELECT USING (auth.uid() = driver_id);

-- Only system can create performance metrics (calculated automatically)
CREATE POLICY "System can create performance metrics" ON driver_performance_metrics
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Driver Ratings policies
-- Business users can view ratings for their drivers
CREATE POLICY "Business users can view own driver ratings" ON driver_ratings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_ratings.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Drivers can view their own ratings
CREATE POLICY "Drivers can view own ratings" ON driver_ratings
    FOR SELECT USING (auth.uid() = driver_id);

-- Public (customers) can create ratings after delivery completion
CREATE POLICY "Customers can create ratings" ON driver_ratings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deliveries d 
            WHERE d.id = driver_ratings.delivery_id 
            AND d.status = 'delivered'
            AND d.driver_id = driver_ratings.driver_id
        )
    );

-- Driver Notifications policies
-- Business users can view notifications for their drivers
CREATE POLICY "Business users can view own driver notifications" ON driver_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = driver_notifications.driver_id 
            AND d.business_id::text = auth.jwt()->>'business_id'
        )
    );

-- Drivers can view their own notifications
CREATE POLICY "Drivers can view own notifications" ON driver_notifications
    FOR SELECT USING (auth.uid() = driver_id);

-- Only system can create notifications
CREATE POLICY "System can create notifications" ON driver_notifications
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Drivers can update their notifications (mark as read)
CREATE POLICY "Drivers can update own notifications" ON driver_notifications
    FOR UPDATE USING (auth.uid() = driver_id AND is_read = false);

-- Enhanced delivery policies for better driver integration
-- Allow drivers to self-assign deliveries by scanning QR code
CREATE POLICY "Drivers can self-assign via QR" ON deliveries
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        driver_id IS NULL AND
        status = 'pending' AND
        EXISTS (
            SELECT 1 FROM drivers d 
            WHERE d.id = auth.uid() 
            AND d.business_id = deliveries.business_id
            AND d.is_active = true
        )
    )
    WITH CHECK (
        auth.uid() = driver_id AND
        status = 'assigned'
    );

-- Allow drivers to view business details for their assigned deliveries
CREATE POLICY "Drivers can view business for assigned deliveries" ON businesses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deliveries d 
            WHERE d.business_id = businesses.id 
            AND d.driver_id = auth.uid()
        )
    );

-- Function-based policy for real-time location updates
CREATE OR REPLACE FUNCTION can_access_location_updates()
RETURNS BOOLEAN AS $$
BEGIN
    -- Business users can access location updates for their deliveries
    IF EXISTS (
        SELECT 1 FROM deliveries d 
        WHERE d.business_id::text = auth.jwt()->>'business_id'
        AND d.id = current_setting('app.current_delivery_id', true)::UUID
    ) THEN
        RETURN true;
    END IF;
    
    -- Drivers can access location updates for their assigned deliveries
    IF EXISTS (
        SELECT 1 FROM deliveries d 
        WHERE d.driver_id = auth.uid()
        AND d.id = current_setting('app.current_delivery_id', true)::UUID
    ) THEN
        RETURN true;
    END IF;
    
    -- Public access for tracking
    IF EXISTS (
        SELECT 1 FROM deliveries d 
        WHERE d.tracking_code IS NOT NULL
        AND d.id = current_setting('app.current_delivery_id', true)::UUID
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;