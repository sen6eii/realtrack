import { supabase } from '@/lib/supabase'

export interface DeliveryTrackingData {
  id: string
  tracking_code: string
  customer_name: string
  delivery_address: string
  delivery_coordinates: string | null
  status: 'pending' | 'assigned' | 'on_route' | 'delivered' | 'cancelled'
  estimated_delivery_time: string | null
  actual_delivery_time: string | null
  created_at: string
  business_name: string
  business_phone: string | null
  driver_id: string | null
  driver_name: string | null
  vehicle_type: string | null
  current_location: string | null
  last_location_update: string | null
  latest_location: string | null
  latest_location_time: string | null
}

export interface LocationUpdate {
  timestamp: string
  latitude: number
  longitude: number
  speed?: number
  heading?: number
}

export class TrackingService {
  // Get delivery by tracking code (public access)
  static async getDeliveryByTrackingCode(trackingCode: string): Promise<DeliveryTrackingData | null> {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('tracking_code', trackingCode)
        .single()

      if (error) {
        console.error('Error fetching delivery:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getDeliveryByTrackingCode:', error)
      return null
    }
  }

  // Subscribe to real-time location updates for a delivery
  static subscribeToLocationUpdates(
    deliveryId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`location_updates_${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_updates',
          filter: `delivery_id=eq.${deliveryId}`,
        },
        callback
      )
      .subscribe()
  }

  // Subscribe to delivery status changes
  static subscribeToDeliveryStatus(
    deliveryId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`delivery_${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`,
        },
        callback
      )
      .subscribe()
  }

  // Get delivery route history
  static async getDeliveryRoute(deliveryId: string): Promise<LocationUpdate[]> {
    try {
      const { data, error } = await supabase
        .from('location_updates')
        .select('timestamp, location, speed, heading')
        .eq('delivery_id', deliveryId)
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Error fetching route:', error)
        return []
      }

      return data.map((update: any) => ({
        timestamp: update.timestamp,
        latitude: parseFloat(JSON.parse(update.location).coordinates[1]),
        longitude: parseFloat(JSON.parse(update.location).coordinates[0]),
        speed: update.speed,
        heading: update.heading,
      }))
    } catch (error) {
      console.error('Error in getDeliveryRoute:', error)
      return []
    }
  }

  // Unsubscribe from all channels
  static unsubscribe(channel: any) {
    supabase.removeChannel(channel)
  }

  // Calculate estimated time of arrival
  static calculateETA(
    driverLocation: { lat: number; lng: number } | null,
    deliveryLocation: { lat: number; lng: number } | null,
    speed = 40 // km/h average city speed
  ): string | null {
    if (!driverLocation || !deliveryLocation) return null

    // Calculate distance using Haversine formula (simplified)
    const R = 6371 // Earth's radius in kilometers
    const dLat = (deliveryLocation.lat - driverLocation.lat) * Math.PI / 180
    const dLon = (deliveryLocation.lng - driverLocation.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(driverLocation.lat * Math.PI / 180) * Math.cos(deliveryLocation.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c

    // Calculate ETA in minutes
    const etaMinutes = Math.ceil((distance / speed) * 60)
    const eta = new Date(Date.now() + etaMinutes * 60000)

    return eta.toISOString()
  }
}