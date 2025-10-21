-- Enhanced Driver Seed Data
-- This script adds sample driver data for testing and demonstration

-- Insert sample driver profiles for existing drivers
INSERT INTO driver_profiles (
    driver_id, 
    profile_image_url, 
    rating, 
    total_ratings, 
    total_deliveries,
    preferred_delivery_areas,
    max_deliveries_per_day,
    emergency_contact_name,
    emergency_contact_phone,
    vehicle_details,
    background_check_status,
    training_completed,
    training_completion_date
)
SELECT 
    d.id,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || REPLACE(d.name, ' ', ''),
    CASE 
        WHEN d.name = 'John Driver' THEN 4.8
        WHEN d.name = 'Sarah Wheeler' THEN 4.9
        WHEN d.name = 'Mike Transport' THEN 4.7
        ELSE 4.5
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN 156
        WHEN d.name = 'Sarah Wheeler' THEN 89
        WHEN d.name = 'Mike Transport' THEN 234
        ELSE 50
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN 156
        WHEN d.name = 'Sarah Wheeler' THEN 89
        WHEN d.name = 'Mike Transport' THEN 234
        ELSE 50
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN ARRAY['10001', '10002', '10003']
        WHEN d.name = 'Sarah Wheeler' THEN ARRAY['20001', '20002', '20003', '20004']
        WHEN d.name = 'Mike Transport' THEN ARRAY['30001', '30002']
        ELSE ARRAY['40001']
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN 12
        WHEN d.name = 'Sarah Wheeler' THEN 15
        WHEN d.name = 'Mike Transport' THEN 8
        ELSE 10
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN 'Jane Driver'
        WHEN d.name = 'Sarah Wheeler' THEN 'Tom Wheeler'
        WHEN d.name = 'Mike Transport' THEN 'Lisa Transport'
        ELSE 'Emergency Contact'
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN '555-0101'
        WHEN d.name = 'Sarah Wheeler' THEN '555-0102'
        WHEN d.name = 'Mike Transport' THEN '555-0103'
        ELSE '555-0000'
    END,
    jsonb_build_object(
        'type', d.vehicle_type,
        'license_plate', d.license_plate,
        'make', CASE 
            WHEN d.name = 'John Driver' THEN 'Toyota'
            WHEN d.name = 'Sarah Wheeler' THEN 'Honda'
            WHEN d.name = 'Mike Transport' THEN 'Ford'
            ELSE 'Generic'
        END,
        'model', CASE 
            WHEN d.name = 'John Driver' THEN 'Camry'
            WHEN d.name = 'Sarah Wheeler' THEN 'Civic'
            WHEN d.name = 'Mike Transport' THEN 'Transit'
            ELSE 'Model'
        END,
        'year', CASE 
            WHEN d.name = 'John Driver' THEN 2021
            WHEN d.name = 'Sarah Wheeler' THEN 2022
            WHEN d.name = 'Mike Transport' THEN 2020
            ELSE 2021
        END,
        'color', CASE 
            WHEN d.name = 'John Driver' THEN 'Blue'
            WHEN d.name = 'Sarah Wheeler' THEN 'Red'
            WHEN d.name = 'Mike Transport' THEN 'White'
            ELSE 'Silver'
        END
    ),
    'approved',
    true,
    CURRENT_DATE - INTERVAL '30 days'
FROM drivers d
ON CONFLICT (driver_id) DO UPDATE SET
    rating = EXCLUDED.rating,
    total_ratings = EXCLUDED.total_ratings,
    total_deliveries = EXCLUDED.total_deliveries,
    preferred_delivery_areas = EXCLUDED.preferred_delivery_areas,
    max_deliveries_per_day = EXCLUDED.max_deliveries_per_day,
    emergency_contact_name = EXCLUDED.emergency_contact_name,
    emergency_contact_phone = EXCLUDED.emergency_contact_phone,
    vehicle_details = EXCLUDED.vehicle_details,
    background_check_status = EXCLUDED.background_check_status,
    training_completed = EXCLUDED.training_completed,
    training_completion_date = EXCLUDED.training_completion_date,
    updated_at = NOW();

-- Insert driver availability for the next 7 days
INSERT INTO driver_availability (driver_id, date, start_time, end_time, is_available)
SELECT 
    d.id,
    CURRENT_DATE + (n || ' days')::INTERVAL::DATE,
    '09:00'::TIME,
    '18:00'::TIME,
    CASE 
        WHEN EXTRACT(DOW FROM (CURRENT_DATE + (n || ' days')::INTERVAL)) IN (0, 6) 
        THEN false  -- Weekends unavailable
        ELSE true   -- Weekdays available
    END
FROM drivers d, generate_series(0, 6) n
ON CONFLICT (driver_id, date) DO NOTHING;

-- Insert sample driver earnings for completed deliveries
INSERT INTO driver_earnings (driver_id, delivery_id, base_amount, tip_amount, payment_status, payment_date)
SELECT 
    d.driver_id,
    d.id,
    CASE 
        WHEN d.customer_name LIKE '%John%' THEN 15.00
        WHEN d.customer_name LIKE '%Sarah%' THEN 20.00
        WHEN d.customer_name LIKE '%Mike%' THEN 18.50
        ELSE 12.00
    END as base_amount,
    CASE 
        WHEN d.customer_name LIKE '%John%' THEN 3.50
        WHEN d.customer_name LIKE '%Sarah%' THEN 5.00
        WHEN d.customer_name LIKE '%Mike%' THEN 2.00
        ELSE 1.50
    END as tip_amount,
    'paid',
    d.actual_delivery_time
FROM deliveries d
WHERE d.driver_id IS NOT NULL 
AND d.status = 'delivered'
ON CONFLICT DO NOTHING;

-- Insert sample driver ratings
INSERT INTO driver_ratings (driver_id, delivery_id, customer_rating, customer_comment)
SELECT 
    d.driver_id,
    d.id,
    CASE 
        WHEN d.customer_name LIKE '%John%' THEN 5
        WHEN d.customer_name LIKE '%Sarah%' THEN 4
        WHEN d.customer_name LIKE '%Mike%' THEN 5
        ELSE 4
    END,
    CASE 
        WHEN d.customer_name LIKE '%John%' THEN 'Excellent service, very professional!'
        WHEN d.customer_name LIKE '%Sarah%' THEN 'Good delivery, slight delay but communicated well.'
        WHEN d.customer_name LIKE '%Mike%' THEN 'Fast and efficient delivery!'
        ELSE 'Good service overall.'
    END
FROM deliveries d
WHERE d.driver_id IS NOT NULL 
AND d.status = 'delivered'
ON CONFLICT DO NOTHING;

-- Insert sample driver notifications
INSERT INTO driver_notifications (driver_id, title, message, notification_type, data, is_read)
SELECT 
    d.id,
    'Welcome to RealTrack!',
    'Your driver account has been activated. Start accepting deliveries!',
    'system',
    jsonb_build_object('action', 'welcome'),
    CASE 
        WHEN d.name = 'John Driver' THEN false
        WHEN d.name = 'Sarah Wheeler' THEN false
        ELSE true
    END
FROM drivers d
ON CONFLICT DO NOTHING;

-- Add some delivery notifications for active drivers
INSERT INTO driver_notifications (driver_id, title, message, notification_type, data, is_read)
SELECT 
    d.driver_id,
    'New Delivery Assigned',
    'Delivery #' || d.tracking_code || ' has been assigned to you. Customer: ' || d.customer_name,
    'delivery_assigned',
    jsonb_build_object(
        'delivery_id', d.id,
        'tracking_code', d.tracking_code,
        'customer_name', d.customer_name
    ),
    false
FROM deliveries d
WHERE d.driver_id IS NOT NULL 
AND d.status IN ('assigned', 'on_route')
ON CONFLICT DO NOTHING;

-- Insert sample performance metrics for the last 30 days
INSERT INTO driver_performance_metrics (
    driver_id, 
    metric_date, 
    total_deliveries, 
    completed_deliveries, 
    average_delivery_time_minutes,
    total_distance_km,
    total_earnings,
    customer_rating
)
SELECT 
    d.id,
    CURRENT_DATE - (n || ' days')::INTERVAL::DATE,
    CASE 
        WHEN d.name = 'John Driver' THEN GREATEST(1, (RANDOM() * 8)::INTEGER)
        WHEN d.name = 'Sarah Wheeler' THEN GREATEST(1, (RANDOM() * 6)::INTEGER)
        WHEN d.name = 'Mike Transport' THEN GREATEST(1, (RANDOM() * 10)::INTEGER)
        ELSE GREATEST(1, (RANDOM() * 5)::INTEGER)
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN GREATEST(0, (RANDOM() * 8)::INTEGER)
        WHEN d.name = 'Sarah Wheeler' THEN GREATEST(0, (RANDOM() * 6)::INTEGER)
        WHEN d.name = 'Mike Transport' THEN GREATEST(0, (RANDOM() * 10)::INTEGER)
        ELSE GREATEST(0, (RANDOM() * 5)::INTEGER)
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN 25 + (RANDOM() * 15)::INTEGER
        WHEN d.name = 'Sarah Wheeler' THEN 20 + (RANDOM() * 20)::INTEGER
        WHEN d.name = 'Mike Transport' THEN 30 + (RANDOM() * 10)::INTEGER
        ELSE 35 + (RANDOM() * 25)::INTEGER
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN 50 + (RANDOM() * 100)::DECIMAL(10,2)
        WHEN d.name = 'Sarah Wheeler' THEN 30 + (RANDOM() * 80)::DECIMAL(10,2)
        WHEN d.name = 'Mike Transport' THEN 80 + (RANDOM() * 120)::DECIMAL(10,2)
        ELSE 20 + (RANDOM() * 60)::DECIMAL(10,2)
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN 100.00 + (RANDOM() * 200)::DECIMAL(10,2)
        WHEN d.name = 'Sarah Wheeler' THEN 80.00 + (RANDOM() * 150)::DECIMAL(10,2)
        WHEN d.name = 'Mike Transport' THEN 150.00 + (RANDOM() * 250)::DECIMAL(10,2)
        ELSE 60.00 + (RANDOM() * 120)::DECIMAL(10,2)
    END,
    CASE 
        WHEN d.name = 'John Driver' THEN 4.6 + (RANDOM() * 0.6)::DECIMAL(3,2)
        WHEN d.name = 'Sarah Wheeler' THEN 4.7 + (RANDOM() * 0.5)::DECIMAL(3,2)
        WHEN d.name = 'Mike Transport' THEN 4.5 + (RANDOM() * 0.7)::DECIMAL(3,2)
        ELSE 4.4 + (RANDOM() * 0.8)::DECIMAL(3,2)
    END
FROM drivers d, generate_series(0, 29) n
WHERE d.is_active = true
ON CONFLICT (driver_id, metric_date) DO NOTHING;