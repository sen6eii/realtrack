'use client'

import { useState, useEffect } from 'react'
import { TrackingMap } from './TrackingMap'
import { TrackingTimeline } from './TrackingTimeline'
import { LoadingStates } from './LoadingStates'
import { createRealtimeService, useRealtimeService } from '@realtrack/realtime-service'
import type { LocationUpdate, DeliveryUpdate } from '@realtrack/realtime-service'

interface CustomerTrackingProps {
  trackingCode: string
  supabaseUrl: string
  supabaseKey: string
  mapboxToken: string
}

interface DeliveryData {
  id: string
  tracking_code: string
  customer_name: string
  delivery_address: string
  status: string
  estimated_delivery_time?: string
  actual_delivery_time?: string
  business_name: string
  driver?: {
    id: string
    name: string
    vehicle_type: string
    license_plate: string
    phone: string
    rating: number
  }
  delivery_coordinates?: { lat: number; lng: number }
}

export function CustomerTrackingPage({ 
  trackingCode, 
  supabaseUrl, 
  supabaseKey, 
  mapboxToken 
}: CustomerTrackingProps) {
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [route, setRoute] = useState<Array<{ lat: number; lng: number }>>([])
  const [eta, setEta] = useState<string>('')
  const [distanceRemaining, setDistanceRemaining] = useState<number>(0)
  const [locationHistory, setLocationHistory] = useState<LocationUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const { service, connectionStatus } = useRealtimeService({
    supabaseUrl,
    supabaseKey,
  })

  // Load initial delivery data
  useEffect(() => {
    loadDeliveryData()
  }, [trackingCode])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!service || !delivery) return

    const subscriptionId = service.subscribeToDeliveryRealtime(trackingCode, {
      onLocationUpdate: (locationUpdate) => {
        setDriverLocation(locationUpdate.location)
        setLocationHistory(prev => [...prev.slice(-19), locationUpdate])
        setLastUpdate(new Date())
      },
      onStatusUpdate: (deliveryUpdate) => {
        setDelivery(prev => prev ? { ...prev, ...deliveryUpdate } : null)
      },
      onDriverInfoUpdate: (driverInfo) => {
        setDelivery(prev => prev ? { ...prev, driver: driverInfo } : null)
      },
      onEtaUpdate: (newEta, distance) => {
        setEta(newEta)
        if (distance !== undefined) {
          setDistanceRemaining(distance)
        }
      },
    })

    return () => {
      service.unsubscribe(subscriptionId)
    }
  }, [service, delivery, trackingCode])

  // Simulate route updates (in production, this would come from a routing service)
  useEffect(() => {
    if (!delivery || !driverLocation || delivery.status !== 'on_route') return

    const interval = setInterval(() => {
      // Update route with smooth animation
      if (delivery.delivery_coordinates) {
        setRoute(prev => {
          const newRoute = [...prev, driverLocation!].slice(-10) // Keep last 10 points
          return newRoute
        })
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [delivery, driverLocation])

  const loadDeliveryData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get delivery details
      const deliveryResponse = await fetch(
        `${supabaseUrl}/rest/v1/delivery_tracking?tracking_code=eq.${trackingCode}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      )

      if (!deliveryResponse.ok) {
        throw new Error('Delivery not found')
      }

      const deliveryData = await deliveryResponse.json()
      
      if (deliveryData.length === 0) {
        throw new Error('Invalid tracking code')
      }

      const deliveryInfo: DeliveryData = deliveryData[0]

      // Parse delivery coordinates
      if (deliveryInfo.delivery_coordinates) {
        const coords = deliveryInfo.delivery_coordinates.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/)
        if (coords) {
          deliveryInfo.delivery_coordinates = {
            lng: parseFloat(coords[1]),
            lat: parseFloat(coords[2]),
          }
        }
      }

      // Parse driver location
      if (deliveryInfo.latest_location) {
        const coords = deliveryInfo.latest_location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/)
        if (coords) {
          setDriverLocation({
            lng: parseFloat(coords[1]),
            lat: parseFloat(coords[2]),
          })
        }
      }

      // Set ETA if available
      if (deliveryInfo.estimated_delivery_time) {
        setEta(new Date(deliveryInfo.estimated_delivery_time).toLocaleTimeString())
      }

      // Load location history
      if (deliveryInfo.id) {
        const locationResponse = await fetch(
          `${supabaseUrl}/rest/v1/get_delivery_route?delivery_id=${deliveryInfo.id}`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        )
        
        if (locationResponse.ok) {
          const locationData = await locationResponse.json()
          setLocationHistory(locationData)
        }
      }

      setDelivery(deliveryInfo)
    } catch (error) {
      console.error('Error loading delivery data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load delivery information')
    } finally {
      setLoading(false)
    }
  }

  // Calculate delivery progress
  const getDeliveryProgress = () => {
    if (!delivery) return 0
    
    switch (delivery.status) {
      case 'pending': return 10
      case 'assigned': return 25
      case 'on_route': return driverLocation ? 60 : 40
      case 'delivered': return 100
      case 'cancelled': return 0
      default: return 0
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100'
      case 'assigned': return 'text-blue-600 bg-blue-100'
      case 'on_route': return 'text-amber-600 bg-amber-100'
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingStates type="spinner" size="large" />
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Delivery Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'We couldn\'t find a delivery with that tracking code.'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📦</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RealTrack</h1>
                <p className="text-sm text-gray-600">Live Delivery Tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-600 capitalize">
                  {connectionStatus === 'connected' ? 'Live' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Delivery #{delivery.tracking_code}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                    {delivery.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Delivery Progress</span>
                    <span>{getDeliveryProgress()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getDeliveryProgress()}%` }}
                    />
                  </div>
                </div>

                {/* Map */}
                <TrackingMap
                  accessToken={mapboxToken}
                  deliveryLocation={delivery.delivery_coordinates}
                  driverLocation={driverLocation}
                  driverInfo={delivery.driver}
                  route={route}
                  eta={eta}
                  distanceRemaining={distanceRemaining}
                  height="450px"
                  realTimeUpdates={connectionStatus === 'connected'}
                />
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Delivery Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Customer</div>
                  <div className="font-medium">{delivery.customer_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Delivery Address</div>
                  <div className="font-medium">{delivery.delivery_address}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Business</div>
                  <div className="font-medium">{delivery.business_name}</div>
                </div>
                {eta && (
                  <div>
                    <div className="text-sm text-gray-600">Estimated Arrival</div>
                    <div className="font-medium text-green-600">{eta}</div>
                  </div>
                )}
                {distanceRemaining > 0 && (
                  <div>
                    <div className="text-sm text-gray-600">Distance Remaining</div>
                    <div className="font-medium">{distanceRemaining.toFixed(1)} km</div>
                  </div>
                )}
              </div>
            </div>

            {/* Driver Information */}
            {delivery.driver && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">
                        {delivery.driver.vehicle_type === 'motorcycle' ? '🏍️' : 
                         delivery.driver.vehicle_type === 'bicycle' ? '🚴' : '🚗'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{delivery.driver.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{delivery.driver.vehicle_type}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rating</span>
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">⭐</span>
                      <span className="font-medium">{delivery.driver.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">License Plate</span>
                    <span className="font-mono">{delivery.driver.license_plate}</span>
                  </div>
                  {delivery.driver.phone && (
                    <div className="pt-3 border-t">
                      <a
                        href={`tel:${delivery.driver.phone}`}
                        className="w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        📞 Call Driver
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            {locationHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Timeline</h3>
                <TrackingTimeline 
                  events={[
                    {
                      time: delivery.created_at,
                      title: 'Order Created',
                      description: 'Your delivery has been created',
                      type: 'info'
                    },
                    ...(delivery.status !== 'pending' ? [{
                      time: delivery.updated_at,
                      title: 'Driver Assigned',
                      description: `${delivery.driver?.name} has been assigned to your delivery`,
                      type: 'success' as const
                    }] : []),
                    ...(delivery.status === 'on_route' ? [{
                      time: delivery.updated_at,
                      title: 'On Route',
                      description: 'Your driver is now on the way',
                      type: 'warning' as const
                    }] : []),
                    ...(delivery.status === 'delivered' ? [{
                      time: delivery.actual_delivery_time,
                      title: 'Delivered',
                      description: 'Your delivery has been completed',
                      type: 'success' as const
                    }] : []),
                    ...locationHistory.slice(-3).map((location, index) => ({
                      time: location.timestamp,
                      title: `Location Update ${index + 1}`,
                      description: `Driver at ${location.location.lat.toFixed(4)}, ${location.location.lng.toFixed(4)}`,
                      type: 'info' as const
                    }))
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}