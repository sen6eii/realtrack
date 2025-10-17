import { Delivery, Driver, BusinessStats } from '@/types'

interface DeliveryState {
  deliveries: Delivery[]
  drivers: Driver[]
  selectedDelivery: Delivery | null
  stats: BusinessStats | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setDeliveries: (deliveries: Delivery[]) => void
  setDrivers: (drivers: Driver[]) => void
  setSelectedDelivery: (delivery: Delivery | null) => void
  setStats: (stats: BusinessStats) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addDelivery: (delivery: Delivery) => void
  updateDelivery: (id: string, updates: Partial<Delivery>) => void
  removeDelivery: (id: string) => void
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  deliveries: [],
  drivers: [],
  selectedDelivery: null,
  stats: null,
  isLoading: false,
  error: null,

  setDeliveries: (deliveries) => set({ deliveries }),
  setDrivers: (drivers) => set({ drivers }),
  setSelectedDelivery: (selectedDelivery) => set({ selectedDelivery }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addDelivery: (delivery) => set((state) => ({
    deliveries: [delivery, ...state.deliveries]
  })),

  updateDelivery: (id, updates) => set((state) => ({
    deliveries: state.deliveries.map(d => 
      d.id === id ? { ...d, ...updates } : d
    ),
    selectedDelivery: state.selectedDelivery?.id === id 
      ? { ...state.selectedDelivery, ...updates }
      : state.selectedDelivery
  })),

  removeDelivery: (id) => set((state) => ({
    deliveries: state.deliveries.filter(d => d.id !== id),
    selectedDelivery: state.selectedDelivery?.id === id ? null : state.selectedDelivery
  })),
}))