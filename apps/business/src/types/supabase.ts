// Copy the generated types from Supabase here for now
// In production, you would generate these using: supabase gen types typescript --project-id=your-project-id > src/types/supabase.ts

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