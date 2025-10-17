// Re-export types from packages/types
export * from '../../../../../packages/types'

// Customer tracking specific types
export interface DeliveryStatus {
  pending: 'pending'
  assigned: 'assigned'
  on_route: 'on_route'
  delivered: 'delivered'
  cancelled: 'cancelled'
}

export interface TrackingPoint {
  timestamp: string
  latitude: number
  longitude: number
  speed?: number
  heading?: number
}

export interface DeliveryInfo {
  id: string
  trackingCode: string
  customerName: string
  deliveryAddress: string
  status: keyof DeliveryStatus
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  createdAt: string
  businessName: string
  driverName?: string
  vehicleType?: string
}