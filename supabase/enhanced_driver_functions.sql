-- Enhanced Driver Functions
-- Additional functions for driver management, analytics, and real-time operations

-- Function to create or update driver profile
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

-- Function to get driver comprehensive stats
CREATE OR REPLACE FUNCTION get_driver_comprehensive_stats(
    p_driver_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    total_deliveries BIGINT,
    completed_deliveries BIGINT,
    cancelled_deliveries BIGINT,
    average_delivery_time_minutes DECIMAL(10,2),
    total_distance_km DECIMAL(10,2),
    total_earnings DECIMAL(10,2),
    customer_rating DECIMAL(3,2),
    on_time_delivery_rate DECIMAL(5,2),
    active_days INTEGER
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
        COALESCE(COUNT(d.id), 0) as total_deliveries,
        COALESCE(COUNT(CASE WHEN d.status = 'delivered' THEN 1 END), 0) as completed_deliveries,
        COALESCE(COUNT(CASE WHEN d.status = 'cancelled' THEN 1 END), 0) as cancelled_deliveries,
        COALESCE(AVG(EXTRACT(EPOCH FROM (d.actual_delivery_time - d.created_at))/60), 0) as average_delivery_time_minutes,
        COALESCE(
            (SELECT COALESCE(SUM(
                ST_Distance(
                    lag(lu.location) OVER (ORDER BY lu.timestamp)::geography,
                    lu.location::geography
                ) / 1000
            ), 0)
            FROM location_updates lu
            WHERE lu.driver_id = p_driver_id
            AND lu.timestamp::DATE BETWEEN p_start_date AND p_end_date), 0
        ) as total_distance_km,
        COALESCE(SUM(de.total_amount), 0) as total_earnings,
        COALESCE(dp.rating, 5.0) as customer_rating,
        CASE 
            WHEN COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) > 0 THEN
                (COUNT(CASE WHEN d.status = 'delivered' AND d.actual_delivery_time <= d.estimated_delivery_time THEN 1 END) * 100.0 / 
                 COUNT(CASE WHEN d.status = 'delivered' THEN 1 END))
            ELSE 100.0
        END as on_time_delivery_rate,
        COUNT(DISTINCT d.created_at::DATE) as active_days
    FROM deliveries d
    LEFT JOIN driver_earnings de ON d.id = de.delivery_id
    LEFT JOIN driver_profiles dp ON dp.driver_id = p_driver_id
    WHERE d.driver_id = p_driver_id
    AND d.created_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get driver availability for date range
CREATE OR REPLACE FUNCTION get_driver_availability(
    p_driver_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    date DATE,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN,
    reason_unavailable TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.date,
        da.start_time,
        da.end_time,
        da.is_available,
        da.reason_unavailable
    FROM driver_availability da
    WHERE da.driver_id = p_driver_id
    AND da.date BETWEEN p_start_date AND p_end_date
    ORDER BY da.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set driver availability
CREATE OR REPLACE FUNCTION set_driver_availability(
    p_driver_id UUID,
    p_date DATE,
    p_start_time TIME DEFAULT NULL,
    p_end_time TIME DEFAULT NULL,
    p_is_available BOOLEAN DEFAULT true,
    p_reason_unavailable TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO driver_availability (
        driver_id, date, start_time, end_time, is_available, reason_unavailable
    ) VALUES (
        p_driver_id, p_date, p_start_time, p_end_time, p_is_available, p_reason_unavailable
    )
    ON CONFLICT (driver_id, date) DO UPDATE SET
        start_time = COALESCE(EXCLUDED.start_time, driver_availability.start_time),
        end_time = COALESCE(EXCLUDED.end_time, driver_availability.end_time),
        is_available = EXCLUDED.is_available,
        reason_unavailable = EXCLUDED.reason_unavailable,
        updated_at = NOW();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add driver rating
CREATE OR REPLACE FUNCTION add_driver_rating(
    p_driver_id UUID,
    p_delivery_id UUID,
    p_customer_rating INTEGER,
    p_customer_comment TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    rating_id UUID;
    new_average DECIMAL(3,2);
BEGIN
    -- Insert the new rating
    INSERT INTO driver_ratings (
        driver_id, delivery_id, customer_rating, customer_comment
    ) VALUES (
        p_driver_id, p_delivery_id, p_customer_rating, p_customer_comment
    ) RETURNING id INTO rating_id;
    
    -- Update driver profile average rating
    SELECT AVG(customer_rating)::DECIMAL(3,2)
    INTO new_average
    FROM driver_ratings
    WHERE driver_id = p_driver_id;
    
    UPDATE driver_profiles
    SET rating = new_average,
        total_ratings = total_ratings + 1,
        updated_at = NOW()
    WHERE driver_id = p_driver_id;
    
    RETURN rating_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate driver earnings for a period
CREATE OR REPLACE FUNCTION calculate_driver_earnings(
    p_driver_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
    period_start DATE,
    period_end DATE,
    total_deliveries INTEGER,
    total_earnings DECIMAL(10,2),
    average_per_delivery DECIMAL(10,2),
    total_tips DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    pending_amount DECIMAL(10,2)
) AS $$
BEGIN
    -- Set default date range to current month if not provided
    IF p_start_date IS NULL THEN
        p_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    END IF;
    
    IF p_end_date IS NULL THEN
        p_end_date := DATE_TRUNC('month', CURRENT_DATE)::DATE + INTERVAL '1 month - 1 day';
    END IF;
    
    RETURN QUERY
    SELECT 
        p_start_date as period_start,
        p_end_date as period_end,
        COUNT(de.id) as total_deliveries,
        COALESCE(SUM(de.total_amount), 0) as total_earnings,
        CASE WHEN COUNT(de.id) > 0 THEN COALESCE(SUM(de.total_amount), 0) / COUNT(de.id) ELSE 0 END as average_per_delivery,
        COALESCE(SUM(de.tip_amount), 0) as total_tips,
        COALESCE(SUM(CASE WHEN de.payment_status = 'paid' THEN de.total_amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN de.payment_status = 'pending' THEN de.total_amount ELSE 0 END), 0) as pending_amount
    FROM driver_earnings de
    WHERE de.driver_id = p_driver_id
    AND de.created_at::DATE BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get nearby available drivers
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

-- Function to get active drivers with their current delivery status
CREATE OR REPLACE FUNCTION get_active_drivers_status(
    p_business_id UUID DEFAULT NULL
)
RETURNS TABLE(
    driver_id UUID,
    driver_name TEXT,
    driver_phone TEXT,
    vehicle_type TEXT,
    current_location GEOMETRY,
    last_location_update TIMESTAMPTZ,
    current_delivery_id UUID,
    current_delivery_status TEXT,
    deliveries_today INTEGER,
    status TEXT -- 'available', 'on_delivery', 'offline'
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as driver_id,
        d.name as driver_name,
        d.phone as driver_phone,
        d.vehicle_type,
        d.location as current_location,
        d.last_location_update,
        COALESCE(
            (SELECT d2.id 
             FROM deliveries d2 
             WHERE d2.driver_id = d.id 
             AND d2.status IN ('assigned', 'on_route')
             ORDER BY d2.created_at DESC 
             LIMIT 1), NULL
        ) as current_delivery_id,
        COALESCE(
            (SELECT d2.status 
             FROM deliveries d2 
             WHERE d2.driver_id = d.id 
             AND d2.status IN ('assigned', 'on_route')
             ORDER BY d2.created_at DESC 
             LIMIT 1), 'none'
        ) as current_delivery_status,
        COALESCE(deliveries_today.count, 0) as deliveries_today,
        CASE 
            WHEN d.is_active = false THEN 'offline'
            WHEN EXISTS(SELECT 1 FROM deliveries d2 WHERE d2.driver_id = d.id AND d2.status IN ('assigned', 'on_route')) THEN 'on_delivery'
            ELSE 'available'
        END as status
    FROM drivers d
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM deliveries d2
        WHERE d2.driver_id = d.id
        AND d2.created_at::DATE = CURRENT_DATE
    ) deliveries_today ON true
    WHERE (p_business_id IS NULL OR d.business_id = p_business_id)
    ORDER BY status DESC, d.last_location_update DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update driver performance metrics
CREATE OR REPLACE FUNCTION update_driver_performance_metrics()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    driver_record RECORD;
BEGIN
    FOR driver_record IN 
        SELECT DISTINCT driver_id 
        FROM deliveries 
        WHERE created_at::DATE = CURRENT_DATE - INTERVAL '1 day'
    LOOP
        INSERT INTO driver_performance_metrics (
            driver_id,
            metric_date,
            total_deliveries,
            completed_deliveries,
            cancelled_deliveries,
            average_delivery_time_minutes,
            total_distance_km,
            total_earnings,
            customer_rating,
            on_time_deliveries,
            late_deliveries
        )
        SELECT 
            dr.driver_id,
            CURRENT_DATE - INTERVAL '1 day',
            COUNT(d.id),
            COUNT(CASE WHEN d.status = 'delivered' THEN 1 END),
            COUNT(CASE WHEN d.status = 'cancelled' THEN 1 END),
            AVG(EXTRACT(EPOCH FROM (d.actual_delivery_time - d.created_at))/60),
            COALESCE(
                (SELECT COALESCE(SUM(
                    ST_Distance(
                        lag(lu.location) OVER (ORDER BY lu.timestamp)::geography,
                        lu.location::geography
                    ) / 1000
                ), 0)
                FROM location_updates lu
                WHERE lu.driver_id = dr.driver_id
                AND lu.timestamp::DATE = CURRENT_DATE - INTERVAL '1 day'), 0
            ),
            COALESCE(SUM(de.total_amount), 0),
            COALESCE(
                (SELECT AVG(customer_rating) 
                 FROM driver_ratings drt 
                 WHERE drt.driver_id = dr.driver_id 
                 AND drt.rating_date::DATE = CURRENT_DATE - INTERVAL '1 day'), 5.0
            ),
            COUNT(CASE WHEN d.status = 'delivered' AND d.actual_delivery_time <= d.estimated_delivery_time THEN 1 END),
            COUNT(CASE WHEN d.status = 'delivered' AND d.actual_delivery_time > d.estimated_delivery_time THEN 1 END)
        FROM (SELECT dr.driver_id) dr
        LEFT JOIN deliveries d ON d.driver_id = dr.driver_id AND d.created_at::DATE = CURRENT_DATE - INTERVAL '1 day'
        LEFT JOIN driver_earnings de ON d.id = de.delivery_id
        WHERE dr.driver_id = driver_record.driver_id
        GROUP BY dr.driver_id
        ON CONFLICT (driver_id, metric_date) DO UPDATE SET
            total_deliveries = EXCLUDED.total_deliveries,
            completed_deliveries = EXCLUDED.completed_deliveries,
            cancelled_deliveries = EXCLUDED.cancelled_deliveries,
            average_delivery_time_minutes = EXCLUDED.average_delivery_time_minutes,
            total_distance_km = EXCLUDED.total_distance_km,
            total_earnings = EXCLUDED.total_earnings,
            customer_rating = EXCLUDED.customer_rating,
            on_time_deliveries = EXCLUDED.on_time_deliveries,
            late_deliveries = EXCLUDED.late_deliveries,
            updated_at = NOW();
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;