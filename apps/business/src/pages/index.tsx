import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/auth'
import { getCurrentUser } from '@/lib/supabase'
import { deliveryService } from '@/lib/services'

export default function IndexPage() {
  const router = useRouter()
  const { setUser, setBusiness, isAuthenticated } = useAuthStore()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await getCurrentUser()
        if (user) {
          setUser(user)
          // In a real app, you'd fetch the user's business profile here
          // For now, we'll redirect to dashboard
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, setUser, setBusiness])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}