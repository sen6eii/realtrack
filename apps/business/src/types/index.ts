// Re-export types from packages/types for convenience
export * from '../../../../../packages/types'

// Add any business-specific types here
export interface BusinessStats {
  total_deliveries: number
  completed_deliveries: number
  pending_deliveries: number
  on_route_deliveries: number
  average_delivery_time_minutes: number | null
  active_drivers: number
}

export interface DashboardStats {
  activeDeliveries: number
  todayDeliveries: number
  activeDrivers: number
  totalDeliveries: number
}