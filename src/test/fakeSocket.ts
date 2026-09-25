import { vi } from 'vitest'
import { deliveriesSocketSubscribe } from '../api/data-socket.ts'
import type { IDelivery, SocketActionsEnum } from '../api/types.ts'

export const testDeliveries: IDelivery[] = [
  { id: '1', name: 'Audio - Headphones', inTransit: false, delivered: false },
  { id: '2', name: 'Books - Handbook', inTransit: true, delivered: false },
  { id: '3', name: 'Garden - Tool Set', inTransit: false, delivered: true },
]

// Replaces the mock socket with one that pushes `deliveries` once and
// records every action sent to it. The test file must call
// vi.mock('<path>/api/data-socket') for this to work.
export function setupFakeSocket(deliveries: IDelivery[] = testDeliveries) {
  const socketFn =
    vi.fn<(action: SocketActionsEnum, payload: IDelivery) => void>()

  vi.mocked(deliveriesSocketSubscribe).mockImplementation((callback) => {
    callback(deliveries)
    return Promise.resolve(socketFn)
  })

  return socketFn
}
