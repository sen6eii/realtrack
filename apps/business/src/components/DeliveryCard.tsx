import { Card } from '@/components/ui/Card'
import { Delivery } from '@/types'
import { StatusBadge } from './StatusBadge'
import { formatTimestamp, generateTrackingLink } from '@/utils/helpers'
import { MapPinIcon, PhoneIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline'

interface DeliveryCardProps {
  delivery: Delivery
  onSelect?: (delivery: Delivery) => void
  isSelected?: boolean
}

export function DeliveryCard({ delivery, onSelect, isSelected = false }: DeliveryCardProps) {
  const trackingLink = generateTrackingLink(delivery.tracking_code)

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary-500' : ''
      }`}
      onClick={() => onSelect?.(delivery)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                {delivery.customer_name}
              </h3>
              <StatusBadge status={delivery.status} />
            </div>
            <p className="text-sm text-gray-500">
              Tracking: {delivery.tracking_code}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm font-medium">{formatTimestamp(delivery.created_at)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">
                {delivery.delivery_address}
              </p>
            </div>
          </div>

          {delivery.customer_phone && (
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-900">{delivery.customer_phone}</p>
            </div>
          )}

          {delivery.driver && (
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  {delivery.driver.name}
                  {delivery.driver.vehicle_type && (
                    <span className="text-gray-500 ml-1">
                      ({delivery.driver.vehicle_type})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {delivery.estimated_delivery_time && (
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-900">ETA</p>
                <p className="text-sm font-medium">
                  {formatTimestamp(delivery.estimated_delivery_time)}
                </p>
              </div>
            </div>
          )}
        </div>

        {delivery.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">{delivery.notes}</p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Public link:{' '}
            <a
              href={trackingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 ml-1"
              onClick={(e) => e.stopPropagation()}
            >
              {trackingLink}
            </a>
          </div>
          {delivery.actual_delivery_time && (
            <div className="text-xs text-green-600">
              Delivered: {formatTimestamp(delivery.actual_delivery_time)}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}