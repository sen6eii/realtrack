import { useState } from 'react'
import { useRouter } from 'next/router'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingState, ErrorState } from '@/components/LoadingStates'
import { validateTrackingCode } from '@/utils/helpers'
import { 
  MagnifyingGlassIcon,
  QrCodeIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const router = useRouter()
  const [trackingCode, setTrackingCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trackingCode.trim()) {
      setError('Please enter a tracking code')
      return
    }

    if (!validateTrackingCode(trackingCode.trim())) {
      setError('Invalid tracking code format')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      // Navigate to tracking page
      await router.push(`/track/${trackingCode.trim().toUpperCase()}`)
    } catch (err) {
      setError('Failed to navigate to tracking page')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setTrackingCode(value)
    if (error) setError('')
  }

  const handleQRCodeScan = () => {
    // In a real implementation, this would open a QR code scanner
    // For now, we'll show an alert
    alert('QR code scanning would be implemented here using the device camera')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RealTrack</h1>
                <p className="text-sm text-gray-600">Real-time delivery tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Track Your Delivery
          </h2>
          <p className="text-xl text-gray-600 max-w-lg mx-auto">
            Enter your tracking code to see real-time updates on your delivery status and location.
          </p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="tracking-code" className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="tracking-code"
                  type="text"
                  placeholder="Enter tracking code (e.g., RT123ABC)"
                  value={trackingCode}
                  onChange={handleInputChange}
                  className="pl-10 text-lg font-mono"
                  maxLength={10}
                  required
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                loading={isLoading}
                className="flex-1"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Track Delivery
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleQRCodeScan}
                className="flex-1"
              >
                <QrCodeIcon className="h-5 w-5 mr-2" />
                Scan QR Code
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Don't have a tracking code?
              </p>
              <p className="text-xs text-gray-500">
                Contact the business that sent your package to get your tracking code.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl">📍</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Live Tracking
            </h3>
            <p className="text-gray-600">
              See your driver's real-time location on an interactive map.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl">⏰</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Real-time Updates
            </h3>
            <p className="text-gray-600">
              Get instant notifications as your delivery status changes.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl">📱</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Mobile Friendly
            </h3>
            <p className="text-gray-600">
              Track your deliveries on any device, anywhere, anytime.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-16 bg-white/80 backdrop-blur rounded-xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            How to Track Your Delivery
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                1
              </div>
              <p className="text-sm font-medium text-gray-900">
                Find your tracking code
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Check your email or receipt
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                2
              </div>
              <p className="text-sm font-medium text-gray-900">
                Enter the code above
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Or scan the QR code
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                3
              </div>
              <p className="text-sm font-medium text-gray-900">
                View live tracking
              </p>
              <p className="text-xs text-gray-600 mt-1">
                See driver location and ETA
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                4
              </div>
              <p className="text-sm font-medium text-gray-900">
                Receive your delivery
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Get notified on arrival
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Powered by RealTrack - Making delivery tracking simple and transparent.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}