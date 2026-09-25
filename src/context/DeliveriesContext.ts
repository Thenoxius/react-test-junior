import { createContext, useContext } from 'react'
import type { IDelivery } from '../api/types.ts'

interface DeliveriesContextValue {
  deliveries: IDelivery[]
  addDelivery: (delivery: IDelivery) => void
  updateDelivery: (delivery: IDelivery) => void
}

export const DeliveriesContext = createContext<DeliveriesContextValue | null>(
  null
)

export function useDeliveries() {
  const context = useContext(DeliveriesContext)

  if (!context) {
    throw new Error('useDeliveries must be used inside a DeliveriesProvider')
  }

  return context
}
