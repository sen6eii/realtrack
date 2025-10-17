import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { TrackingService, DeliveryTrackingData } from '@/lib/tracking-service'
import { TrackingMap } from '@/components/TrackingMap'
import { StatusBadge } from '@/components/StatusBadge'
import { TrackingTimeline } from '@/components/TrackingTimeline'
import { LoadingState, ErrorState } from '@/components/LoadingStates'
import { formatTimestamp, parseCoordinates, shareTrackingLink } from '@/utils/helpers'
import { 
  MapPinIcon, 
  PhoneIcon, 
  UserIcon, 
  ClockIcon,
  ShareIcon,
  RefreshIcon
} from '@heroicons/react/24/outline'

export default function TrackingPage() {
  const router = useRouter()
  const { trackingCode } = router.query

  const [delivery, setDelivery] = useState<DeliveryTrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [route, setRoute] = useState<Array<{ lat: number; lng: number }>>([])

  // Load delivery data
  useEffect(() => {
    if (trackingCode && typeof trackingCode === 'string') {
      loadDeliveryData(trackingCode)
    }
  }, [trackingCode])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!delivery) return

    const locationChannel = TrackingService.subscribeToLocationUpdates(
      delivery.id,
      (payload) => {
        console.log('Location update:', payload)
        loadDeliveryData(trackingCode as string) // Refresh data
      }
    )

    const statusChannel = TrackingService.subscribeToDeliveryStatus(
      delivery.id,
      (payload) => {
        console.log('Status update:', payload)
        loadDeliveryData(trackingCode as string) // Refresh data
      }
    )

    return () => {
      TrackingService.unsubscribe(locationChannel)
      TrackingService.unsubscribe(statusChannel)
    }
  }, [delivery?.id, trackingCode])

  const loadDeliveryData = async (code: string) => {
    try {
      setError(null)
      const data = await TrackingService.getDeliveryByTrackingCode(code)
      
      if (!data) {
        setError('Delivery not found. Please check your tracking code and try again.')
        return
      }

      setDelivery(data)

      // Load route history if delivery is active
      if (['assigned', 'on_route'].includes(data.status)) {
        const routeHistory = await TrackingService.getDeliveryRoute(data.id)
        setRoute(routeHistory)
      } else {
        setRoute([])
      }
    } catch (err) {
      setError('Failed to load tracking information. Please try again.')
      console.error('Error loading delivery:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    if (trackingCode) {
      setIsRefreshing(true)
      loadDeliveryData(trackingCode as string)
    }
  }

  const handleShare = async () => {
    if (trackingCode) {
      try {
        await shareTrackingLink(trackingCode as string)
        // Could show a success toast here
      } catch (err) {
        console.error('Error sharing:', err)
      }
    }
  }

  const deliveryLocation = delivery?.delivery_coordinates 
    ? parseCoordinates(delivery.delivery_coordinates)
    : null

  const driverLocation = delivery?.latest_location
    ? parseCoordinates(delivery.latest_location)
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingState message="Loading tracking information..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ErrorState
            title="Tracking Information Not Found"
            message={error}
            onRetry={() => router.push('/')}
          />
        </div>
      </div>
    )
  }

  if (!delivery) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Delivery Tracking
              </h1>
              <p className="text-gray-600">
                Tracking Code: <span className="font-mono font-medium">{trackingCode}</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Share tracking link"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Status Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {delivery.customer_name}
              </h2>
              <p className="text-gray-600">Delivery Status</p>
            </div>
            <StatusBadge status={delivery.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Delivery Address</p>
                  <p className="font-medium">{delivery.delivery_address}</p>
                </div>
              </div>

              {delivery.business_phone && (
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Business Contact</p>
                    <p className="font-medium">{delivery.business_phone}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Order Created</p>
                  <p className="font-medium">{formatTimestamp(delivery.created_at)}</p>
                </div>
              </div>

              {delivery.estimated_delivery_time && (
                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Estimated Delivery</p>
                    <p className="font-medium">{formatTimestamp(delivery.estimated_delivery_time)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Map */}
        {(deliveryLocation || driverLocation) && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Tracking</h3>
            {process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? (
              <TrackingMap
                accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                deliveryLocation={deliveryLocation}
                driverLocation={driverLocation}
                route={route}
                height="400px"
              />
            ) : (
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🗺️</div>
                  <p>Map view unavailable</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Driver Information */}
        {delivery.driver_name && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{delivery.driver_name}</p>
                {delivery.vehicle_type && (
                  <p className="text-sm text-gray-600">
                    Vehicle: {delivery.vehicle_type}
                  </p>
                )}
                {delivery.last_location_update && (
                  <p className="text-xs text-gray-500">
                    Last updated: {formatTimestamp(delivery.last_location_update)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tracking Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <TrackingTimeline
            status={delivery.status}
            createdAt={delivery.created_at}
            estimatedDeliveryTime={delivery.estimated_delivery_time}
            actualDeliveryTime={delivery.actual_delivery_time}
          />
        </div>

        {/* Delivered Message */}
        {delivery.status === 'delivered' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Package Delivered Successfully!
            </h3>
            <p className="text-green-700">
              Your package was delivered at {formatTimestamp(delivery.actual_delivery_time!)}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}