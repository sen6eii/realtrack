-- RealTrack Sample Data for Testing

-- Insert sample businesses
INSERT INTO businesses (id, name, email, phone, address) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'QuickMart', 'contact@quickmart.com', '+1234567890', '123 Main St, City, State'),
('550e8400-e29b-41d4-a716-446655440002', 'FreshGrocery', 'info@freshgrocery.com', '+0987654321', '456 Oak Ave, Town, State'),
('550e8400-e29b-41d4-a716-446655440003', 'SpeedyDelivery', 'support@speedydelivery.com', '+1122334455', '789 Pine Rd, Village, State');

-- Insert sample drivers
INSERT INTO drivers (id, business_id, name, email, phone, vehicle_type, license_plate, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'John Smith', 'john.smith@email.com', '+1555123456', 'car', 'ABC123', true),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Sarah Johnson', 'sarah.j@email.com', '+1555234567', 'motorcycle', 'XYZ789', true),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Mike Wilson', 'mike.w@email.com', '+1555345678', 'van', 'DEF456', true),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Emily Brown', 'emily.b@email.com', '+1555456789', 'bicycle', 'GHI789', true),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'David Lee', 'david.lee@email.com', '+1555567890', 'car', 'JKL012', true);

-- Update driver locations (sample coordinates)
UPDATE drivers 
SET location = ST_SetSRID(ST_MakePoint(-74.0060 + (RANDOM() * 0.1), 40.7128 + (RANDOM() * 0.1)), 4326),
    last_location_update = NOW()
WHERE is_active = true;

-- Insert sample deliveries
INSERT INTO deliveries (
    id, business_id, driver_id, customer_name, customer_phone, 
    delivery_address, delivery_coordinates, notes, status, 
    tracking_code, estimated_delivery_time
) VALUES
-- Pending deliveries
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Alice Customer', '+15559998877', '100 1st Ave, New York, NY', ST_SetSRID(ST_MakePoint(-74.0059, 40.7128), 4326), 'Handle with care', 'pending', 'RT0001A2B', NOW() + INTERVAL '2 hours'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Bob Shopper', '+15558887766', '200 2nd St, New York, NY', ST_SetSRID(ST_MakePoint(-73.9857, 40.7580), 4326), 'Leave at door', 'pending', 'RT0002C3D', NOW() + INTERVAL '3 hours'),

-- Assigned deliveries
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'Carol Buyer', '+15557776655', '300 3rd Ave, New York, NY', ST_SetSRID(ST_MakePoint(-73.9680, 40.7859), 4326), 'Call upon arrival', 'assigned', 'RT0003E4F', NOW() + INTERVAL '1 hour'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 'Dan Shopper', '+15556665544', '400 4th St, New York, NY', ST_SetSRID(ST_MakePoint(-73.9902, 40.7358), 4326), 'Fragile items', 'assigned', 'RT0004G5H', NOW() + INTERVAL '1.5 hours'),

-- On route deliveries
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', 'Eve Customer', '+15555554433', '500 5th Ave, New York, NY', ST_SetSRID(ST_MakePoint(-73.9749, 40.7614), 4326), 'Apartment 4B', 'on_route', 'RT0005I6J', NOW() + INTERVAL '30 minutes'),

-- Completed deliveries
('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Frank Client', '+15554443322', '600 6th St, New York, NY', ST_SetSRID(ST_MakePoint(-73.9496, 40.8006), 4326), 'Delivered to reception', 'delivered', 'RT0006K7L', NOW() - INTERVAL '2 hours'),
('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'Grace Buyer', '+15553332211', '700 7th Ave, New York, NY', ST_SetSRID(ST_MakePoint(-73.9654, 40.7829), 4326), 'Delivered to back door', 'delivered', 'RT0007M8N', NOW() - INTERVAL '4 hours');

-- Set actual delivery times for completed deliveries
UPDATE deliveries 
SET actual_delivery_time = created_at + INTERVAL '2 hours'
WHERE status = 'delivered';

-- Insert sample location updates for on route delivery
INSERT INTO location_updates (delivery_id, driver_id, location, speed, heading, timestamp) VALUES
-- Recent locations for delivery RT0005I6J
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', ST_SetSRID(ST_MakePoint(-73.9857, 40.7489), 4326), 35.5, 45.2, NOW() - INTERVAL '15 minutes'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', ST_SetSRID(ST_MakePoint(-73.9801, 40.7537), 4326), 42.1, 47.8, NOW() - INTERVAL '10 minutes'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', ST_SetSRID(ST_MakePoint(-73.9755, 40.7591), 4326), 28.3, 52.1, NOW() - INTERVAL '5 minutes'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', ST_SetSRID(ST_MakePoint(-73.9720, 40.7610), 4326), 15.7, 78.9, NOW() - INTERVAL '2 minutes'),

-- Historical location updates for completed delivery RT0006K7L
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326), 0.0, 0.0, NOW() - INTERVAL '3 hours'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', ST_SetSRID(ST_MakePoint(-73.9985, 40.7205), 4326), 45.2, 35.8, NOW() - INTERVAL '2.5 hours'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', ST_SetSRID(ST_MakePoint(-73.9850, 40.7350), 4326), 38.7, 42.3, NOW() - INTERVAL '2 hours'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', ST_SetSRID(ST_MakePoint(-73.9654, 40.7480), 4326), 32.1, 55.6, NOW() - INTERVAL '1.5 hours'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', ST_SetSRID(ST_MakePoint(-73.9496, 40.8006), 4326), 0.0, 0.0, NOW() - INTERVAL '1 hours');

-- Create some QR code URLs (placeholder for now)
UPDATE deliveries 
SET qr_code_url = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' || tracking_code
WHERE qr_code_url IS NULL;