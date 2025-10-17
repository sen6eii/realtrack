import { supabase } from '@/lib/supabase'
import { Delivery, Driver, Business, BusinessStats, CreateDeliveryInput, CreateDriverInput } from '@/types'

export const deliveryService = {
  // Get all deliveries for a business
  async getDeliveries(businessId: string): Promise<Delivery[]> {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        driver:drivers(id, name, phone, vehicle_type, is_active)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get single delivery with details
  async getDelivery(id: string): Promise<Delivery> {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        driver:drivers(*),
        business:businesses(*),
        location_updates(timestamp, location, speed, heading)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new delivery
  async createDelivery(businessId: string, delivery: CreateDeliveryInput): Promise<Delivery> {
    const { data, error } = await supabase.rpc('create_delivery', {
      p_business_id: businessId,
      p_customer_name: delivery.customer_name,
      p_customer_phone: delivery.customer_phone || null,
      p_delivery_address: delivery.delivery_address,
      p_delivery_coordinates: delivery.delivery_coordinates 
        ? `POINT(${delivery.delivery_coordinates.lng} ${delivery.delivery_coordinates.lat})`
        : null,
      p_notes: delivery.notes || null,
      p_estimated_delivery_time: delivery.estimated_delivery_time || null,
    })

    if (error) throw error
    return this.getDelivery(data)
  },

  // Update delivery
  async updateDelivery(id: string, updates: Partial<Delivery>): Promise<Delivery> {
    const { data, error } = await supabase
      .from('deliveries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete delivery
  async deleteDelivery(id: string): Promise<void> {
    const { error } = await supabase
      .from('deliveries')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Assign driver to delivery
  async assignDriver(deliveryId: string, driverId: string): Promise<void> {
    const { error } = await supabase.rpc('assign_driver_to_delivery', {
      p_delivery_id: deliveryId,
      p_driver_id: driverId,
    })

    if (error) throw error
  },

  // Update delivery status
  async updateStatus(deliveryId: string, status: Delivery['status']): Promise<void> {
    const { error } = await supabase.rpc('update_delivery_status', {
      p_delivery_id: deliveryId,
      p_status: status,
    })

    if (error) throw error
  },

  // Get delivery by tracking code (public)
  async getDeliveryByTrackingCode(trackingCode: string): Promise<any> {
    const { data, error } = await supabase
      .from('delivery_tracking')
      .select('*')
      .eq('tracking_code', trackingCode)
      .single()

    if (error) throw error
    return data
  },
}

export const driverService = {
  // Get all drivers for a business
  async getDrivers(businessId: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get single driver
  async getDriver(id: string): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new driver
  async createDriver(businessId: string, driver: CreateDriverInput): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .insert({
        ...driver,
        business_id: businessId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update driver
  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete driver
  async deleteDriver(id: string): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get driver stats
  async getDriverStats(driverId: string, startDate?: string, endDate?: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_driver_stats', {
      p_driver_id: driverId,
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) throw error
    return data[0]
  },
}

export const businessService = {
  // Get business profile
  async getBusiness(id: string): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Update business profile
  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get business analytics
  async getBusinessStats(businessId: string, startDate?: string, endDate?: string): Promise<BusinessStats> {
    const { data, error } = await supabase.rpc('get_business_analytics', {
      p_business_id: businessId,
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (error) throw error
    return data[0]
  },

  // Create business (during signup)
  async createBusiness(business: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .insert(business)
      .select()
      .single()

    if (error) throw error
    return data
  },
}