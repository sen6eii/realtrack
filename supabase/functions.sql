-- RealTrack Database Functions and Procedures

-- Function to get ETA based on driver location and delivery destination
CREATE OR REPLACE FUNCTION calculate_eta(
    p_delivery_id UUID
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    driver_location GEOMETRY(POINT, 4326);
    delivery_location GEOMETRY(POINT, 4326);
    distance_km DECIMAL(10,2);
    avg_speed_km_per_hour DECIMAL(5,2) := 40; -- Average speed in city
    eta_minutes INTEGER;
    eta TIMESTAMPTZ;
BEGIN
    -- Get driver current location and delivery coordinates
    SELECT dr.location, d.delivery_coordinates
    INTO driver_location, delivery_location
    FROM deliveries d
    JOIN drivers dr ON d.driver_id = dr.id
    WHERE d.id = p_delivery_id;
    
    -- Return NULL if no driver or locations
    IF driver_location IS NULL OR delivery_location IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calculate distance using Haversine formula
    distance_km := ST_Distance(
        driver_location::geography, 
        delivery_location::geography
    ) / 1000;
    
    -- Calculate ETA based on average speed
    eta_minutes := CEIL((distance_km / avg_speed_km_per_hour) * 60);
    eta := NOW() + (eta_minutes || ' minutes')::INTERVAL;
    
    -- Update the delivery with new ETA
    UPDATE deliveries 
    SET estimated_delivery_time = eta
    WHERE id = p_delivery_id;
    
    RETURN eta;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get driver statistics
CREATE OR REPLACE FUNCTION get_driver_stats(
    p_driver_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_deliveries BIGINT,
    completed_deliveries BIGINT,
    average_time_minutes DECIMAL(10,2),
    total_distance_km DECIMAL(10,2)
) AS $$
BEGIN
    -- Set default date range to last 30 days if not provided
    IF p_start_date IS NULL THEN
        p_start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*) as total_deliveries,
        COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed_deliveries,
        AVG(EXTRACT(EPOCH FROM (d.actual_delivery_time - d.created_at))/60) as average_time_minutes,
        COALESCE(
            SUM(
                ST_Distance(
                    lag(lu.location) OVER (ORDER BY lu.timestamp)::geography,
                    lu.location::geography
                ) / 1000
            ), 0
        ) as total_distance_km
    FROM deliveries d
    LEFT JOIN location_updates lu ON d.id = lu.delivery_id
    WHERE d.driver_id = p_driver_id
    AND d.created_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get business analytics
CREATE OR REPLACE FUNCTION get_business_analytics(
    p_business_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_deliveries BIGINT,
    completed_deliveries BIGINT,
    pending_deliveries BIGINT,
    on_route_deliveries BIGINT,
    average_delivery_time_minutes DECIMAL(10,2),
    active_drivers BIGINT
) AS $$
BEGIN
    -- Set default date range to last 30 days if not provided
    IF p_start_date IS NULL THEN
        p_start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*) as total_deliveries,
        COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed_deliveries,
        COUNT(CASE WHEN d.status = 'pending' THEN 1 END) as pending_deliveries,
        COUNT(CASE WHEN d.status = 'on_route' THEN 1 END) as on_route_deliveries,
        AVG(EXTRACT(EPOCH FROM (d.actual_delivery_time - d.created_at))/60) as average_delivery_time_minutes,
        COUNT(CASE WHEN dr.is_active = true THEN 1 END) as active_drivers
    FROM deliveries d
    LEFT JOIN drivers dr ON d.driver_id = dr.id
    WHERE d.business_id = p_business_id
    AND d.created_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-assign nearest available driver to a delivery
CREATE OR REPLACE FUNCTION auto_assign_driver(
    p_delivery_id UUID
)
RETURNS UUID AS $$
DECLARE
    delivery_location GEOMETRY(POINT, 4326);
    nearest_driver_id UUID;
BEGIN
    -- Get delivery coordinates
    SELECT delivery_coordinates
    INTO delivery_location
    FROM deliveries
    WHERE id = p_delivery_id;
    
    -- Find nearest available driver for the same business
    SELECT id
    INTO nearest_driver_id
    FROM drivers
    WHERE is_active = true
    AND business_id = (SELECT business_id FROM deliveries WHERE id = p_delivery_id)
    AND location IS NOT NULL
    ORDER BY ST_Distance(location, delivery_location)
    LIMIT 1;
    
    -- Assign driver if found
    IF nearest_driver_id IS NOT NULL THEN
        PERFORM assign_driver_to_delivery(p_delivery_id, nearest_driver_id);
    END IF;
    
    RETURN nearest_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically calculate ETA when driver starts route
CREATE OR REPLACE FUNCTION trigger_eta_calculation()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate ETA when status changes to 'on_route'
    IF NEW.status = 'on_route' AND OLD.status != 'on_route' THEN
        PERFORM calculate_eta(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_eta_on_route
    BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION trigger_eta_calculation();

-- Function to cleanup old location updates (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_location_updates()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM location_updates 
    WHERE timestamp < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get delivery route history
CREATE OR REPLACE FUNCTION get_delivery_route(
    p_delivery_id UUID
)
RETURNS TABLE(
    timestamp TIMESTAMPTZ,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    speed DECIMAL(5,2),
    heading DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lu.timestamp,
        ST_Y(lu.location) as latitude,
        ST_X(lu.location) as longitude,
        lu.speed,
        lu.heading
    FROM location_updates lu
    WHERE lu.delivery_id = p_delivery_id
    ORDER BY lu.timestamp ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;