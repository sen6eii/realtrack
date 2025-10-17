// Generated TypeScript types for RealTrack Supabase schema
// Run: npx supabase gen types typescript --project-id=your-project-id > types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_business_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["business_id"]
          }
        ]
      }
      drivers: {
        Row: {
          id: string
          business_id: string
          name: string
          email: string
          phone: string | null
          vehicle_type: string | null
          license_plate: string | null
          is_active: boolean
          location: string | null
          last_location_update: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          email: string
          phone?: string | null
          vehicle_type?: string | null
          license_plate?: string | null
          is_active?: boolean
          location?: string | null
          last_location_update?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          email?: string
          phone?: string | null
          vehicle_type?: string | null
          license_plate?: string | null
          is_active?: boolean
          location?: string | null
          last_location_update?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["driver_id"]
          }
        ]
      }
      deliveries: {
        Row: {
          id: string
          business_id: string
          driver_id: string | null
          customer_name: string
          customer_phone: string | null
          delivery_address: string
          delivery_coordinates: string | null
          notes: string | null
          status: "pending" | "assigned" | "on_route" | "delivered" | "cancelled"
          tracking_code: string
          qr_code_url: string | null
          estimated_delivery_time: string | null
          actual_delivery_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          driver_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_address: string
          delivery_coordinates?: string | null
          notes?: string | null
          status?: "pending" | "assigned" | "on_route" | "delivered" | "cancelled"
          tracking_code: string
          qr_code_url?: string | null
          estimated_delivery_time?: string | null
          actual_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          driver_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string
          delivery_coordinates?: string | null
          notes?: string | null
          status?: "pending" | "assigned" | "on_route" | "delivered" | "cancelled"
          tracking_code?: string
          qr_code_url?: string | null
          estimated_delivery_time?: string | null
          actual_delivery_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_updates_delivery_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "location_updates"
            referencedColumns: ["delivery_id"]
          }
        ]
      }
      location_updates: {
        Row: {
          id: string
          delivery_id: string
          driver_id: string
          location: string
          speed: number | null
          heading: number | null
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          delivery_id: string
          driver_id: string
          location: string
          speed?: number | null
          heading?: number | null
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          delivery_id?: string
          driver_id?: string
          location?: string
          speed?: number | null
          heading?: number | null
          timestamp?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_updates_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_updates_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      active_deliveries: {
        Row: {
          id: string
          business_id: string
          customer_name: string
          customer_phone: string | null
          delivery_address: string
          status: "pending" | "assigned" | "on_route" | "delivered" | "cancelled"
          tracking_code: string
          estimated_delivery_time: string | null
          created_at: string
          driver_id: string | null
          driver_name: string | null
          driver_phone: string | null
          vehicle_type: string | null
          driver_location: string | null
          driver_last_update: string | null
        }
        Relationships: []
      }
      delivery_tracking: {
        Row: {
          id: string
          tracking_code: string
          customer_name: string
          delivery_address: string
          delivery_coordinates: string | null
          status: "pending" | "assigned" | "on_route" | "delivered" | "cancelled"
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
        Relationships: []
      }
    }
    Functions: {
      calculate_eta: {
        Args: {
          p_delivery_id: string
        }
        Returns: string | null
      }
      create_delivery: {
        Args: {
          p_business_id: string
          p_customer_name: string
          p_customer_phone: string | null
          p_delivery_address: string
          p_delivery_coordinates: string | null
          p_notes: string | null
          p_estimated_delivery_time: string | null
        }
        Returns: string
      }
      get_business_analytics: {
        Args: {
          p_business_id: string
          p_start_date: string | null
          p_end_date: string | null
        }
        Returns: {
          total_deliveries: number
          completed_deliveries: number
          pending_deliveries: number
          on_route_deliveries: number
          average_delivery_time_minutes: number | null
          active_drivers: number
        }[]
      }
      get_delivery_route: {
        Args: {
          p_delivery_id: string
        }
        Returns: {
          timestamp: string
          latitude: number
          longitude: number
          speed: number | null
          heading: number | null
        }[]
      }
      get_driver_stats: {
        Args: {
          p_driver_id: string
          p_start_date: string | null
          p_end_date: string | null
        }
        Returns: {
          total_deliveries: number
          completed_deliveries: number
          average_time_minutes: number | null
          total_distance_km: number
        }[]
      }
    }
    Enums: {
      delivery_status: "pending" | "assigned" | "on_route" | "delivered" | "cancelled"
    }
  }
}

// Utility types for common operations
export type Business = Database["public"]["Tables"]["businesses"]["Row"]
export type BusinessInsert = Database["public"]["Tables"]["businesses"]["Insert"]
export type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"]

export type Driver = Database["public"]["Tables"]["drivers"]["Row"]
export type DriverInsert = Database["public"]["Tables"]["drivers"]["Insert"]
export type DriverUpdate = Database["public"]["Tables"]["drivers"]["Update"]

export type Delivery = Database["public"]["Tables"]["deliveries"]["Row"]
export type DeliveryInsert = Database["public"]["Tables"]["deliveries"]["Insert"]
export type DeliveryUpdate = Database["public"]["Tables"]["deliveries"]["Update"]

export type LocationUpdate = Database["public"]["Tables"]["location_updates"]["Row"]
export type LocationUpdateInsert = Database["public"]["Tables"]["location_updates"]["Insert"]
export type LocationUpdateUpdate = Database["public"]["Tables"]["location_updates"]["Update"]

export type ActiveDelivery = Database["public"]["Views"]["active_deliveries"]["Row"]
export type DeliveryTracking = Database["public"]["Views"]["delivery_tracking"]["Row"]

export type DeliveryStatus = Database["public"]["Enums"]["delivery_status"]

// Realtime subscription types
export type RealtimeChannel = {
  id: string
  name: string
  url: string
}

export type RealtimeMessage = {
  event: string
  schema: string
  table: string
  commit_timestamp: string
  type: string
  payload: {
    data: any
    schema: string
    table: string
    errors: any[]
  }
}

// Custom types for application logic
export interface CreateDeliveryParams {
  business_id: string
  customer_name: string
  customer_phone?: string
  delivery_address: string
  delivery_coordinates?: { lat: number; lng: number }
  notes?: string
  estimated_delivery_time?: string
}

export interface DriverLocation {
  latitude: number
  longitude: number
  speed?: number
  heading?: number
  timestamp: string
}

export interface DeliveryWithDetails extends Delivery {
  business?: Business
  driver?: Driver | null
  location_updates?: LocationUpdate[]
}

export interface DriverWithDetails extends Driver {
  business?: Business
  deliveries?: Delivery[]
}

export interface BusinessStats {
  total_deliveries: number
  completed_deliveries: number
  pending_deliveries: number
  on_route_deliveries: number
  average_delivery_time_minutes: number | null
  active_drivers: number
}

export interface DriverStats {
  total_deliveries: number
  completed_deliveries: number
  average_time_minutes: number | null
  total_distance_km: number
}

export interface DeliveryRoutePoint {
  timestamp: string
  latitude: number
  longitude: number
  speed?: number
  heading?: number
}