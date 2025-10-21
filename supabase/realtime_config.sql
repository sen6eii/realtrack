-- Real-time Configuration for RealTrack
-- This script sets up Supabase Realtime for live tracking

-- Enable Realtime for all relevant tables
-- Note: These commands need to be run in the Supabase dashboard or via SQL with admin privileges

-- 1. Enable Realtime on deliveries table
ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;

-- 2. Enable Realtime on drivers table  
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;

-- 3. Enable Realtime on location_updates table
ALTER PUBLICATION supabase_realtime ADD TABLE location_updates;

-- 4. Enable Realtime on driver_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE driver_notifications;

-- 5. Enable Realtime on driver_ratings table
ALTER PUBLICATION supabase_realtime ADD TABLE driver_ratings;

-- Create optimized indexes for real-time queries
CREATE INDEX IF NOT EXISTS idx_deliveries_business_status ON deliveries(business_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_status ON deliveries(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking_code_status ON deliveries(tracking_code, status);
CREATE INDEX IF NOT EXISTS idx_drivers_business_active ON drivers(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_drivers_location_update ON drivers(last_location_update DESC) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_location_updates_delivery_timestamp ON location_updates(delivery_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_location_updates_driver_timestamp ON location_updates(driver_id, timestamp DESC);

-- Create a view for active drivers with location data
CREATE OR REPLACE VIEW active_drivers_realtime AS
SELECT 
    d.id,
    d.business_id,
    d.name,
    d.phone,
    d.vehicle_type,
    d.license_plate,
    d.location,
    d.last_location_update,
    d.is_active,
    -- Current delivery info
    curr_delivery.id as current_delivery_id,
    curr_delivery.status as current_delivery_status,
    curr_delivery.tracking_code as current_tracking_code,
    -- Driver profile info
    dp.rating,
    dp.total_deliveries,
    -- Availability status
    CASE 
        WHEN d.is_active = false THEN 'offline'
        WHEN curr_delivery.id IS NOT NULL AND curr_delivery.status IN ('assigned', 'on_route') THEN 'on_delivery'
        ELSE 'available'
    END as availability_status
FROM drivers d
LEFT JOIN driver_profiles dp ON d.id = dp.driver_id
LEFT JOIN LATERAL (
    SELECT id, status, tracking_code
    FROM deliveries 
    WHERE driver_id = d.id 
    AND status IN ('assigned', 'on_route')
    ORDER BY created_at DESC 
    LIMIT 1
) curr_delivery ON true
WHERE d.business_id IS NOT NULL;

-- Enable Realtime on the view (PostgreSQL 15+ with materialized views support)
-- Note: This might need to be handled differently based on Supabase version

-- Create a function to broadcast location updates efficiently
CREATE OR REPLACE FUNCTION broadcast_location_update(
    p_delivery_id UUID,
    p_driver_id UUID,
    p_location GEOMETRY(POINT, 4326),
    p_speed DECIMAL(5,2) DEFAULT NULL,
    p_heading DECIMAL(5,2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    location_update_id UUID;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
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
    
    -- Create notification for customer tracking
    -- This would trigger a webhook or notification to subscribed clients
    
    -- Update driver's current location
    UPDATE drivers 
    SET location = p_location,
        last_location_update = NOW()
    WHERE id = p_driver_id;
    
    RETURN location_update_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to handle delivery status changes with notifications
CREATE OR REPLACE FUNCTION handle_delivery_status_change()
RETURNS TRIGGER AS $$
DECLARE
    business_rec RECORD;
    driver_rec RECORD;
    notification_data JSONB;
BEGIN
    -- Get business and driver info for notifications
    SELECT b.name, b.id INTO business_rec
    FROM businesses b
    WHERE b.id = NEW.business_id;
    
    -- Create driver notification if driver assigned
    IF NEW.driver_id IS NOT NULL AND OLD.driver_id IS DISTINCT FROM NEW.driver_id THEN
        INSERT INTO driver_notifications (
            driver_id,
            title,
            message,
            notification_type,
            data
        ) VALUES (
            NEW.driver_id,
            'New Delivery Assigned',
            'Delivery #' || NEW.tracking_code || ' has been assigned to you.',
            'delivery_assigned',
            jsonb_build_object(
                'delivery_id', NEW.id,
                'tracking_code', NEW.tracking_code,
                'customer_name', NEW.customer_name,
                'delivery_address', NEW.delivery_address
            )
        );
    END IF;
    
    -- Create status update notification for driver
    IF NEW.driver_id IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO driver_notifications (
            driver_id,
            title,
            message,
            notification_type,
            data
        ) VALUES (
            NEW.driver_id,
            'Delivery Status Update',
            'Delivery #' || NEW.tracking_code || ' status: ' || NEW.status,
            'delivery_update',
            jsonb_build_object(
                'delivery_id', NEW.id,
                'tracking_code', NEW.tracking_code,
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delivery status changes
DROP TRIGGER IF EXISTS delivery_status_change_trigger ON deliveries;
CREATE TRIGGER delivery_status_change_trigger
    AFTER UPDATE ON deliveries
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.driver_id IS DISTINCT FROM NEW.driver_id)
    EXECUTE FUNCTION handle_delivery_status_change();

-- Create function for periodic cleanup of old location data
CREATE OR REPLACE FUNCTION cleanup_realtime_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete location updates older than 24 hours (keep recent data for active tracking)
    DELETE FROM location_updates 
    WHERE timestamp < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Mark old notifications as read (cleanup)
    UPDATE driver_notifications 
    SET is_read = true 
    WHERE created_at < NOW() - INTERVAL '7 days' AND is_read = false;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security policies for Realtime access
-- Business users can see their drivers' real-time data
CREATE POLICY "Business realtime access to drivers" ON drivers
    FOR SELECT USING (
        auth.jwt()->>'business_id' = business_id::text OR
        auth.uid() = id
    );

-- Business users can see their deliveries' real-time data
CREATE POLICY "Business realtime access to deliveries" ON deliveries
    FOR SELECT USING (
        auth.jwt()->>'business_id' = business_id::text
    );

-- Drivers can see their own real-time data
CREATE POLICY "Driver realtime access to own data" ON drivers
    FOR SELECT USING (auth.uid() = id);

-- Drivers can see their assigned deliveries
CREATE POLICY "Driver realtime access to assigned deliveries" ON deliveries
    FOR SELECT USING (auth.uid() = driver_id);

-- Public access for tracking (no auth required)
CREATE POLICY "Public realtime tracking access" ON deliveries
    FOR SELECT USING (tracking_code IS NOT NULL AND status != 'cancelled');

-- Public access to location updates for tracking
CREATE POLICY "Public realtime location access" ON location_updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deliveries d 
            WHERE d.id = location_updates.delivery_id 
            AND d.tracking_code IS NOT NULL
            AND d.status != 'cancelled'
        )
    );

-- Create a summary view for dashboard analytics
CREATE OR REPLACE VIEW business_realtime_summary AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    COUNT(DISTINCT d.id) as total_drivers,
    COUNT(DISTINCT CASE WHEN d.is_active = true THEN d.id END) as active_drivers,
    COUNT(DISTINCT del.id) as total_deliveries,
    COUNT(DISTINCT CASE WHEN del.status = 'on_route' THEN del.id END) as active_deliveries,
    COUNT(DISTINCT CASE WHEN del.status = 'delivered' THEN del.id END) as completed_deliveries,
    COUNT(DISTINCT CASE WHEN del.status = 'pending' THEN del.id END) as pending_deliveries,
    -- Real-time location data
    COUNT(DISTINCT CASE WHEN d.location IS NOT NULL AND d.last_location_update > NOW() - INTERVAL '1 hour' THEN d.id END) as drivers_with_recent_location,
    -- Average rating
    COALESCE(AVG(dp.rating), 0) as average_driver_rating
FROM businesses b
LEFT JOIN drivers d ON b.id = d.business_id
LEFT JOIN driver_profiles dp ON d.id = dp.driver_id
LEFT JOIN deliveries del ON b.id = del.business_id
GROUP BY b.id, b.name;

-- Grant access to the summary view
GRANT SELECT ON business_realtime_summary TO authenticated, anon;

-- Create optimized storage parameters for real-time tables
ALTER TABLE location_updates SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE location_updates SET (autovacuum_analyze_scale_factor = 0.05);

-- Create partial indexes for better performance
CREATE INDEX idx_location_updates_recent ON location_updates(timestamp DESC) 
WHERE timestamp > NOW() - INTERVAL '24 hours';

CREATE INDEX idx_deliveries_active ON deliveries(business_id, status) 
WHERE status IN ('assigned', 'on_route');

CREATE INDEX idx_drivers_active_location ON drivers(business_id, last_location_update DESC) 
WHERE is_active = true AND location IS NOT NULL;

-- Add comments for documentation
COMMENT ON PUBLICATION supabase_realtime IS 'Real-time publication for RealTrack delivery tracking system';
COMMENT ON TABLE location_updates IS 'Stores real-time location updates for active deliveries';
COMMENT ON TABLE driver_notifications IS 'Stores notifications for drivers in the system';
COMMENT ON VIEW active_drivers_realtime IS 'Real-time view of active drivers with current status';
COMMENT ON FUNCTION broadcast_location_update IS 'Optimized function to broadcast location updates for real-time tracking';