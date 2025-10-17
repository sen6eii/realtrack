import { z } from 'zod'

export const createDeliverySchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional(),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  delivery_coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  notes: z.string().optional(),
  estimated_delivery_time: z.string().optional(),
  driver_id: z.string().uuid().optional(),
})

export const updateDeliverySchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required').optional(),
  customer_phone: z.string().optional(),
  delivery_address: z.string().min(1, 'Delivery address is required').optional(),
  delivery_coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  notes: z.string().optional(),
  estimated_delivery_time: z.string().optional(),
  driver_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'assigned', 'on_route', 'delivered', 'cancelled']).optional(),
})

export const createDriverSchema = z.object({
  name: z.string().min(1, 'Driver name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  vehicle_type: z.string().optional(),
  license_plate: z.string().optional(),
})

export const updateDriverSchema = z.object({
  name: z.string().min(1, 'Driver name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  vehicle_type: z.string().optional(),
  license_plate: z.string().optional(),
  is_active: z.boolean().optional(),
})

export const businessProfileSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  business_name: z.string().min(1, 'Business name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>
export type CreateDriverInput = z.infer<typeof createDriverSchema>
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>