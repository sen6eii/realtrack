/**
 * Real-time Service for RealTrack
 * Handles WebSocket connections and real-time data synchronization across all applications
 */

export interface RealtimeConfig {
  supabaseUrl: string
  supabaseKey: string
  businessId?: string
  userId?: string
}

export interface DeliveryUpdate {
  id: string
  status: string
  driver_id?: string
  driver_location?: { lat: number; lng: number }
  estimated_delivery_time?: string
  actual_delivery_time?: string
  updated_at: string
}

export interface LocationUpdate {
  delivery_id: string
  driver_id: string
  location: { lat: number; lng: number }
  speed?: number
  heading?: number
  timestamp: string
}

export interface DriverStatus {
  id: string
  name: string
  location?: { lat: number; lng: number }
  status: 'available' | 'on_delivery' | 'offline'
  vehicle_type?: string
  last_location_update?: string
  current_delivery_id?: string
}

export class RealtimeService {
  private supabase: any
  private config: RealtimeConfig
  private subscriptions: Map<string, any> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false

  constructor(config: RealtimeConfig) {
    this.config = config
    this.initializeSupabase()
  }

  private initializeSupabase() {
    // Dynamically import Supabase client to avoid SSR issues
    if (typeof window !== 'undefined') {
      import('@supabase/supabase-js').then(({ createClient }) => {
        this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey, {
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        })
      })
    }
  }

  // Business Portal: Subscribe to driver locations and delivery updates
  subscribeToBusinessRealtime(callbacks: {
    onDriverLocationUpdate?: (driver: DriverStatus) => void
    onDeliveryStatusUpdate?: (delivery: DeliveryUpdate) => void
    onNewDelivery?: (delivery: any) => void
    onDriverStatusChange?: (driver: DriverStatus) => void
  }) {
    if (!this.supabase || !this.config.businessId) return

    const subscriptionId = `business-${this.config.businessId}`

    // Subscribe to driver location updates
    if (callbacks.onDriverLocationUpdate) {
      const driverSubscription = this.supabase
        .channel(`driver-locations-${this.config.businessId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'drivers',
            filter: `business_id=eq.${this.config.businessId}`,
          },
          (payload: any) => {
            const driver: DriverStatus = {
              id: payload.new.id,
              name: payload.new.name,
              location: payload.new.location ? this.parsePoint(payload.new.location) : undefined,
              status: payload.new.is_active ? 
                (payload.new.current_delivery_id ? 'on_delivery' : 'available') : 'offline',
              vehicle_type: payload.new.vehicle_type,
              last_location_update: payload.new.last_location_update,
              current_delivery_id: payload.new.current_delivery_id,
            }
            callbacks.onDriverLocationUpdate(driver)
          }
        )
        .subscribe((status: string) => {
          console.log('Driver location subscription status:', status)
          if (status === 'SUBSCRIBED') {
            this.reconnectAttempts = 0
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.handleReconnect(subscriptionId)
          }
        })

      this.subscriptions.set(`${subscriptionId}-drivers`, driverSubscription)
    }

    // Subscribe to delivery status updates
    if (callbacks.onDeliveryStatusUpdate) {
      const deliverySubscription = this.supabase
        .channel(`delivery-updates-${this.config.businessId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deliveries',
            filter: `business_id=eq.${this.config.businessId}`,
          },
          (payload: any) => {
            const delivery: DeliveryUpdate = {
              id: payload.new.id,
              status: payload.new.status,
              driver_id: payload.new.driver_id,
              updated_at: payload.new.updated_at,
              estimated_delivery_time: payload.new.estimated_delivery_time,
              actual_delivery_time: payload.new.actual_delivery_time,
            }
            callbacks.onDeliveryStatusUpdate(delivery)
          }
        )
        .subscribe()

      this.subscriptions.set(`${subscriptionId}-deliveries`, deliverySubscription)
    }

    // Subscribe to new deliveries
    if (callbacks.onNewDelivery) {
      const newDeliverySubscription = this.supabase
        .channel(`new-deliveries-${this.config.businessId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'deliveries',
            filter: `business_id=eq.${this.config.businessId}`,
          },
          (payload: any) => {
            callbacks.onNewDelivery(payload.new)
          }
        )
        .subscribe()

      this.subscriptions.set(`${subscriptionId}-new-deliveries`, newDeliverySubscription)
    }

    return subscriptionId
  }

  // Customer Tracking: Subscribe to specific delivery updates
  subscribeToDeliveryRealtime(trackingCode: string, callbacks: {
    onLocationUpdate?: (location: LocationUpdate) => void
    onStatusUpdate?: (delivery: DeliveryUpdate) => void
    onDriverInfoUpdate?: (driver: any) => void
    onEtaUpdate?: (eta: string, distance?: number) => void
  }) {
    if (!this.supabase) return

    const subscriptionId = `delivery-${trackingCode}`

    // Subscribe to location updates for this delivery
    if (callbacks.onLocationUpdate) {
      const locationSubscription = this.supabase
        .channel(`location-updates-${trackingCode}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'location_updates',
          },
          async (payload: any) => {
            // Verify this location update belongs to the tracked delivery
            const { data: delivery } = await this.supabase
              .from('delivery_tracking')
              .select('tracking_code')
              .eq('id', payload.new.delivery_id)
              .single()

            if (delivery?.tracking_code === trackingCode) {
              const locationUpdate: LocationUpdate = {
                delivery_id: payload.new.delivery_id,
                driver_id: payload.new.driver_id,
                location: this.parsePoint(payload.new.location),
                speed: payload.new.speed,
                heading: payload.new.heading,
                timestamp: payload.new.timestamp,
              }
              callbacks.onLocationUpdate(locationUpdate)

              // Calculate and send ETA update
              this.calculateEta(payload.new.delivery_id).then(eta => {
                if (eta && callbacks.onEtaUpdate) {
                  callbacks.onEtaUpdate(eta.time, eta.distance)
                }
              })
            }
          }
        )
        .subscribe()

      this.subscriptions.set(`${subscriptionId}-locations`, locationSubscription)
    }

    // Subscribe to delivery status updates
    if (callbacks.onStatusUpdate) {
      const statusSubscription = this.supabase
        .channel(`delivery-status-${trackingCode}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'deliveries',
          },
          async (payload: any) => {
            const { data: delivery } = await this.supabase
              .from('deliveries')
              .select('tracking_code')
              .eq('id', payload.new.id)
              .single()

            if (delivery?.tracking_code === trackingCode) {
              const statusUpdate: DeliveryUpdate = {
                id: payload.new.id,
                status: payload.new.status,
                driver_id: payload.new.driver_id,
                updated_at: payload.new.updated_at,
                estimated_delivery_time: payload.new.estimated_delivery_time,
                actual_delivery_time: payload.new.actual_delivery_time,
              }
              callbacks.onStatusUpdate(statusUpdate)
            }
          }
        )
        .subscribe()

      this.subscriptions.set(`${subscriptionId}-status`, statusSubscription)
    }

    return subscriptionId
  }

  // Driver App: Subscribe to driver-specific updates
  subscribeToDriverRealtime(driverId: string, callbacks: {
    onDeliveryAssigned?: (delivery: any) => void
    onDeliveryUpdate?: (delivery: DeliveryUpdate) => void
    onLocationUpdateRequest?: (deliveryId: string) => void
    onNotification?: (notification: any) => void
  }) {
    if (!this.supabase) return

    const subscriptionId = `driver-${driverId}`

    // Subscribe to deliveries assigned to this driver
    if (callbacks.onDeliveryAssigned) {
      const deliverySubscription = this.supabase
        .channel(`driver-deliveries-${driverId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deliveries',
            filter: `driver_id=eq.${driverId}`,
          },
          (payload: any) => {
            if (payload.eventType === 'INSERT' || 
                (payload.eventType === 'UPDATE' && payload.new.driver_id === driverId && 
                 payload.old.driver_id !== driverId)) {
              callbacks.onDeliveryAssigned(payload.new)
            } else if (payload.eventType === 'UPDATE') {
              const delivery: DeliveryUpdate = {
                id: payload.new.id,
                status: payload.new.status,
                driver_id: payload.new.driver_id,
                updated_at: payload.new.updated_at,
                estimated_delivery_time: payload.new.estimated_delivery_time,
                actual_delivery_time: payload.new.actual_delivery_time,
              }
              callbacks.onDeliveryUpdate(delivery)
            }
          }
        )
        .subscribe()

      this.subscriptions.set(`${subscriptionId}-deliveries`, deliverySubscription)
    }

    // Subscribe to driver notifications
    if (callbacks.onNotification) {
      const notificationSubscription = this.supabase
        .channel(`driver-notifications-${driverId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'driver_notifications',
            filter: `driver_id=eq.${driverId}`,
          },
          (payload: any) => {
            callbacks.onNotification(payload.new)
          }
        )
        .subscribe()

      this.subscriptions.set(`${subscriptionId}-notifications`, notificationSubscription)
    }

    return subscriptionId
  }

  // Send location updates from driver app
  async sendLocationUpdate(driverId: string, deliveryId: string, location: {
    lat: number
    lng: number
  }, speed?: number, heading?: number) {
    if (!this.supabase) return

    try {
      const { error } = await this.supabase.rpc('add_location_update', {
        p_delivery_id: deliveryId,
        p_driver_id: driverId,
        p_location: `POINT(${location.lng} ${location.lat})`,
        p_speed: speed,
        p_heading: heading,
      })

      if (error) {
        console.error('Error sending location update:', error)
      }
    } catch (error) {
      console.error('Error in sendLocationUpdate:', error)
    }
  }

  // Calculate ETA using database function
  private async calculateEta(deliveryId: string): Promise<{ time: string; distance?: number } | null> {
    if (!this.supabase) return null

    try {
      const { data, error } = await this.supabase.rpc('calculate_eta', {
        p_delivery_id: deliveryId,
      })

      if (error) {
        console.error('Error calculating ETA:', error)
        return null
      }

      return {
        time: new Date(data).toLocaleTimeString(),
      }
    } catch (error) {
      console.error('Error in calculateEta:', error)
      return null
    }
  }

  // Unsubscribe from specific subscription
  unsubscribe(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      this.supabase.removeChannel(subscription)
      this.subscriptions.delete(subscriptionId)
    }
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      this.supabase.removeChannel(subscription)
    })
    this.subscriptions.clear()
  }

  // Handle reconnection logic
  private handleReconnect(subscriptionId: string) {
    if (this.isConnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.isConnecting = true
    this.reconnectAttempts++

    setTimeout(() => {
      console.log(`Attempting to reconnect ${subscriptionId} (attempt ${this.reconnectAttempts})`)
      // Implementation would resubscribe based on subscription type
      this.isConnecting = false
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  // Parse PostGIS point format
  private parsePoint(pointString: string): { lat: number; lng: number } | undefined {
    if (!pointString || !pointString.startsWith('POINT(')) return undefined
    
    const matches = pointString.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/)
    if (matches) {
      return {
        lng: parseFloat(matches[1]),
        lat: parseFloat(matches[2]),
      }
    }
    return undefined
  }

  // Get connection status
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnecting) return 'connecting'
    if (this.subscriptions.size > 0) return 'connected'
    return 'disconnected'
  }

  // Health check for real-time connection
  async healthCheck(): Promise<boolean> {
    if (!this.supabase) return false

    try {
      const { data, error } = await this.supabase
        .from('businesses')
        .select('id')
        .limit(1)

      return !error && data !== null
    } catch (error) {
      return false
    }
  }
}

// Factory function to create service instances
export function createRealtimeService(config: RealtimeConfig): RealtimeService {
  return new RealtimeService(config)
}

// React hook for using the service
import { useEffect, useRef, useState } from 'react'

export function useRealtimeService(config: RealtimeConfig) {
  const [service, setService] = useState<RealtimeService | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')
  const serviceRef = useRef<RealtimeService | null>(null)

  useEffect(() => {
    const realtimeService = createRealtimeService(config)
    serviceRef.current = realtimeService
    setService(realtimeService)

    // Set up connection status monitoring
    const checkConnection = setInterval(async () => {
      const isHealthy = await realtimeService.healthCheck()
      setConnectionStatus(isHealthy ? 'connected' : 'disconnected')
    }, 5000)

    return () => {
      clearInterval(checkConnection)
      realtimeService.unsubscribeAll()
    }
  }, [config.supabaseUrl, config.supabaseKey])

  return { service, connectionStatus }
}