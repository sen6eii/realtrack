'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Map } from './Map'
import { DeliveryCard } from './DeliveryCard'
import { createRealtimeService, useRealtimeService } from '@realtrack/realtime-service'
import { StatusBadge } from './StatusBadge'
import type { DriverStatus, DeliveryUpdate } from '@realtrack/realtime-service'

interface BusinessDashboardProps {
  businessId: string
  supabaseUrl: string
  supabaseKey: string
  mapboxToken: string
}

export function BusinessDashboard({ 
  businessId, 
  supabaseUrl, 
  supabaseKey, 
  mapboxToken 
}: BusinessDashboardProps) {
  const [activeDrivers, setActiveDrivers] = useState<DriverStatus[]>([])
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([])
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    todayDeliveries: 0,
    activeDrivers: 0,
    totalDeliveries: 0,
  })
  const [selectedDriver, setSelectedDriver] = useState<DriverStatus | null>(null)
  const [showLiveTracking, setShowLiveTracking] = useState(true)

  const { service, connectionStatus } = useRealtimeService({
    supabaseUrl,
    supabaseKey,
    businessId,
  })

  // Initialize real-time subscriptions
  useEffect(() => {
    if (!service || !businessId) return

    const subscriptionId = service.subscribeToBusinessRealtime({
      onDriverLocationUpdate: (driver) => {
        setActiveDrivers(prev => {
          const index = prev.findIndex(d => d.id === driver.id)
          if (index >= 0) {
            const updated = [...prev]
            updated[index] = driver
            return updated
          }
          return [...prev, driver]
        })
      },
      onDeliveryStatusUpdate: (delivery) => {
        // Update deliveries list
        setRecentDeliveries(prev => 
          prev.map(d => 
            d.id === delivery.id 
              ? { ...d, ...delivery }
              : d
          )
        )

        // Update stats
        updateStats()
      },
      onNewDelivery: (delivery) => {
        setRecentDeliveries(prev => [delivery, ...prev.slice(0, 9)])
        updateStats()
      },
      onDriverStatusChange: (driver) => {
        setActiveDrivers(prev => {
          const index = prev.findIndex(d => d.id === driver.id)
          if (index >= 0) {
            const updated = [...prev]
            updated[index] = driver
            return updated
          }
          return [...prev, driver]
        })
      },
    })

    // Load initial data
    loadInitialData()

    return () => {
      service.unsubscribe(subscriptionId)
    }
  }, [service, businessId])

  const loadInitialData = async () => {
    try {
      // Load active drivers
      const driversResponse = await fetch(`${supabaseUrl}/rest/v1/get_active_drivers_status?business_id=${businessId}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      })
      const drivers = await driversResponse.json()
      setActiveDrivers(drivers)

      // Load recent deliveries
      const deliveriesResponse = await fetch(`${supabaseUrl}/rest/v1/deliveries?business_id=eq.${businessId}&order=created_at.desc&limit=10`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      })
      const deliveries = await deliveriesResponse.json()
      setRecentDeliveries(deliveries)

      // Load stats
      await updateStats()
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  const updateStats = async () => {
    try {
      const statsResponse = await fetch(`${supabaseUrl}/rest/v1/get_business_analytics?business_id=${businessId}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      })
      const businessStats = await statsResponse.json()
      
      if (businessStats.length > 0) {
        const stats = businessStats[0]
        setStats({
          activeDeliveries: stats.on_route_deliveries,
          todayDeliveries: stats.total_deliveries,
          activeDrivers: stats.active_drivers,
          totalDeliveries: stats.total_deliveries,
        })
      }
    } catch (error) {
      console.error('Error updating stats:', error)
    }
  }

  // Prepare driver locations for map
  const driverLocations = activeDrivers
    .filter(driver => driver.location)
    .map(driver => ({
      id: driver.id,
      name: driver.name,
      coordinates: [driver.location!.lng, driver.location!.lat] as [number, number],
      status: driver.status,
      vehicleType: driver.vehicle_type,
      lastUpdate: driver.last_location_update || new Date().toISOString(),
    }))

  // Prepare delivery locations for map
  const deliveryMarkers = recentDeliveries
    .filter(delivery => delivery.delivery_coordinates && delivery.status !== 'delivered')
    .map(delivery => {
      const coords = delivery.delivery_coordinates.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/)
      if (coords) {
        return {
          id: delivery.id,
          coordinates: [parseFloat(coords[1]), parseFloat(coords[2])] as [number, number],
          popup: `
            <div class="p-2">
              <div class="font-semibold">Delivery #${delivery.tracking_code}</div>
              <div class="text-sm text-gray-600">${delivery.customer_name}</div>
              <div class="text-sm">${delivery.delivery_address}</div>
              <div class="mt-1">${StatusBadge({ status: delivery.status })}</div>
            </div>
          `,
          color: delivery.status === 'on_route' ? '#f59e0b' : '#3b82f6',
        }
      }
      return null
    })
    .filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
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
          <Button
            onClick={() => setShowLiveTracking(!showLiveTracking)}
            variant={showLiveTracking ? 'primary' : 'secondary'}
            size="sm"
          >
            {showLiveTracking ? '🔴 Live Tracking' : '▶️ Start Tracking'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  📦
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.activeDeliveries}</div>
                <div className="text-sm text-gray-600">Active Deliveries</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  ✅
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.todayDeliveries}</div>
                <div className="text-sm text-gray-600">Today's Deliveries</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  🚗
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.activeDrivers}</div>
                <div className="text-sm text-gray-600">Active Drivers</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  📊
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</div>
                <div className="text-sm text-gray-600">Total Deliveries</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Map */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Live Operations</h2>
                {selectedDriver && (
                  <div className="text-sm text-gray-600">
                    Selected: {selectedDriver.name}
                  </div>
                )}
              </div>
              <Map
                accessToken={mapboxToken}
                height="500px"
                markers={[...driverLocations, ...deliveryMarkers]}
                showLiveDrivers={showLiveTracking}
                driverLocations={driverLocations}
                onMarkerClick={(markerId) => {
                  const driver = activeDrivers.find(d => d.id === markerId)
                  if (driver) setSelectedDriver(driver)
                }}
              />
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                    Available
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-2" />
                    On Delivery
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full mr-2" />
                    Offline
                  </div>
                </div>
                <div>
                  {driverLocations.length} drivers active
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          {/* Active Drivers */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Drivers</h2>
              <div className="space-y-3">
                {activeDrivers.slice(0, 5).map((driver) => (
                  <div
                    key={driver.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      selectedDriver?.id === driver.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    } cursor-pointer hover:bg-gray-50`}
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        driver.status === 'available' ? 'bg-green-500' :
                        driver.status === 'on_delivery' ? 'bg-amber-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">{driver.name}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {driver.vehicle_type} • {driver.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    {driver.last_location_update && (
                      <div className="text-xs text-gray-500">
                        {new Date(driver.last_location_update).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ))}
                {activeDrivers.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No active drivers
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Recent Deliveries */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Deliveries</h2>
              <div className="space-y-3">
                {recentDeliveries.slice(0, 5).map((delivery) => (
                  <div key={delivery.id} className="border-b border-gray-200 pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">#{delivery.tracking_code}</div>
                        <div className="text-sm text-gray-600">{delivery.customer_name}</div>
                      </div>
                      <StatusBadge status={delivery.status} />
                    </div>
                  </div>
                ))}
                {recentDeliveries.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No recent deliveries
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}