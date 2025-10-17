import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createDeliverySchema, CreateDeliveryInput } from '@/lib/validations'
import { useDeliveryStore } from '@/store/delivery'
import { deliveryService } from '@/lib/services'
import { toast } from 'react-hot-toast'

interface CreateDeliveryModalProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
}

export function CreateDeliveryModal({ isOpen, onClose, businessId }: CreateDeliveryModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { drivers, addDelivery } = useDeliveryStore()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDeliveryInput>({
    resolver: zodResolver(createDeliverySchema),
  })

  const onSubmit = async (data: CreateDeliveryInput) => {
    try {
      setIsLoading(true)
      const delivery = await deliveryService.createDelivery(businessId, data)
      addDelivery(delivery)
      toast.success('Delivery created successfully!')
      reset()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create delivery')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      reset()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Delivery" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Customer Name"
            placeholder="Enter customer name"
            {...register('customer_name')}
            error={errors.customer_name?.message}
            required
          />

          <Input
            label="Customer Phone"
            placeholder="Enter phone number"
            {...register('customer_phone')}
            error={errors.customer_phone?.message}
          />
        </div>

        <Textarea
          label="Delivery Address"
          placeholder="Enter full delivery address"
          {...register('delivery_address')}
          error={errors.delivery_address?.message}
          required
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Estimated Delivery Time"
            type="datetime-local"
            {...register('estimated_delivery_time')}
            error={errors.estimated_delivery_time?.message}
          />

          <Select
            label="Assign Driver (Optional)"
            {...register('driver_id')}
            error={errors.driver_id?.message}
          >
            <option value="">Select a driver</option>
            {drivers
              .filter(driver => driver.is_active)
              .map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} {driver.vehicle_type && `(${driver.vehicle_type})`}
                </option>
              ))}
          </Select>
        </div>

        <Textarea
          label="Delivery Notes (Optional)"
          placeholder="Any special instructions for the delivery"
          {...register('notes')}
          error={errors.notes?.message}
          rows={3}
        />

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Create Delivery
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}