import { type ReactNode, useEffect, useRef } from 'react'
import { deliveriesSocketSubscribe } from '../api/data-socket.ts'
import { type IDelivery, SocketActionsEnum } from '../api/types.ts'
import { usePersistentState } from '../hooks/usePersistentState.ts'
import { loadFromStorage } from '../utils/storage.ts'
import { DeliveriesContext } from './DeliveriesContext.ts'

export const DELIVERIES_STORAGE_KEY = 'deliveries'

type SocketFn = (action: SocketActionsEnum, payload: IDelivery) => void

function isSameDelivery(first: IDelivery, second: IDelivery) {
  return (
    first.name === second.name &&
    first.inTransit === second.inTransit &&
    first.delivered === second.delivered
  )
}

// After a refresh the mock socket starts over with its original data.
// Send it every delivery that was added or changed before the refresh.
function replayStoredDeliveries(
  socketFn: SocketFn,
  socketDeliveries: IDelivery[],
  storedDeliveries: IDelivery[]
) {
  for (const storedDelivery of storedDeliveries) {
    const socketDelivery = socketDeliveries.find(
      (delivery) => delivery.id === storedDelivery.id
    )

    if (!socketDelivery) {
      socketFn(SocketActionsEnum.ADD, storedDelivery)
    } else if (!isSameDelivery(socketDelivery, storedDelivery)) {
      socketFn(SocketActionsEnum.UPDATE, storedDelivery)
    }
  }
}

export function DeliveriesProvider({ children }: { children: ReactNode }) {
  const [deliveries, setDeliveries] = usePersistentState<IDelivery[]>(
    DELIVERIES_STORAGE_KEY,
    []
  )
  const socketFn = useRef<SocketFn | null>(null)
  const hasSubscribed = useRef(false)

  useEffect(() => {
    // The socket may only be subscribed to once. StrictMode runs effects
    // twice in development, so guard against that. There is no unsubscribe
    // on cleanup either: this provider lives as long as the app does.
    if (hasSubscribed.current) {
      return
    }
    hasSubscribed.current = true

    const storedDeliveries = loadFromStorage<IDelivery[]>(
      DELIVERIES_STORAGE_KEY,
      []
    )
    let initialSocketDeliveries: IDelivery[] = []

    function handleSocketDeliveries(latestDeliveries: IDelivery[]) {
      // The first push arrives before the socket is ready. Keep it aside so
      // the stored deliveries can be compared against it below.
      if (!socketFn.current) {
        initialSocketDeliveries = latestDeliveries
        return
      }

      setDeliveries(latestDeliveries)
    }

    deliveriesSocketSubscribe(handleSocketDeliveries).then((actionFn) => {
      socketFn.current = actionFn

      if (storedDeliveries.length === 0) {
        setDeliveries(initialSocketDeliveries)
        return
      }

      replayStoredDeliveries(
        actionFn,
        initialSocketDeliveries,
        storedDeliveries
      )
    })
  }, [setDeliveries])

  // Both actions update the screen straight away (optimistic), instead of
  // waiting up to 5 seconds for the next socket push.
  function addDelivery(delivery: IDelivery) {
    socketFn.current?.(SocketActionsEnum.ADD, delivery)
    setDeliveries((current) => [...current, delivery])
  }

  function updateDelivery(delivery: IDelivery) {
    socketFn.current?.(SocketActionsEnum.UPDATE, delivery)
    setDeliveries((current) =>
      current.map((existing) =>
        existing.id === delivery.id ? delivery : existing
      )
    )
  }

  return (
    <DeliveriesContext value={{ deliveries, addDelivery, updateDelivery }}>
      {children}
    </DeliveriesContext>
  )
}
