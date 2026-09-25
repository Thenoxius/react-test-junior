import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deliveriesSocketSubscribe } from '../../api/data-socket.ts'
import { type IDelivery, SocketActionsEnum } from '../../api/types.ts'
import {
  pushFromSocket,
  setupFakeSocket,
  testDeliveries,
} from '../../test/fakeSocket.ts'
import { useDeliveries } from '../DeliveriesContext.ts'
import {
  DELIVERIES_STORAGE_KEY,
  DeliveriesProvider,
} from '../DeliveriesProvider.tsx'

vi.mock('../../api/data-socket.ts')

const newDelivery: IDelivery = {
  id: '4',
  name: 'Pets - Dog Food',
  inTransit: false,
  delivered: false,
}

function DeliveryNames() {
  const { deliveries, addDelivery, updateDelivery } = useDeliveries()

  return (
    <>
      <ul>
        {deliveries.map((delivery) => (
          <li key={delivery.id}>{delivery.name}</li>
        ))}
      </ul>
      <button onClick={() => addDelivery(newDelivery)}>Add</button>
      <button
        onClick={() =>
          updateDelivery({ ...testDeliveries[0], name: 'Audio - Speakers' })
        }
      >
        Update
      </button>
    </>
  )
}

function renderProvider() {
  return render(
    <StrictMode>
      <DeliveriesProvider>
        <DeliveryNames />
      </DeliveriesProvider>
    </StrictMode>
  )
}

describe('DeliveriesProvider', () => {
  let socketFn: ReturnType<typeof setupFakeSocket>

  beforeEach(() => {
    vi.clearAllMocks()
    socketFn = setupFakeSocket()
  })

  it('subscribes to the socket only once, even in StrictMode', async () => {
    renderProvider()

    await screen.findByText('Audio - Headphones')
    expect(deliveriesSocketSubscribe).toHaveBeenCalledTimes(1)
  })

  it('shows a new delivery straight away and sends it to the socket', async () => {
    const user = userEvent.setup()
    renderProvider()
    await screen.findByText('Audio - Headphones')

    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Pets - Dog Food')).toBeInTheDocument()
    expect(socketFn).toHaveBeenCalledWith(SocketActionsEnum.ADD, newDelivery)
  })

  it('shows an updated delivery straight away and sends it to the socket', async () => {
    const user = userEvent.setup()
    renderProvider()
    await screen.findByText('Audio - Headphones')

    await user.click(screen.getByRole('button', { name: 'Update' }))

    expect(screen.getByText('Audio - Speakers')).toBeInTheDocument()
    expect(screen.queryByText('Audio - Headphones')).not.toBeInTheDocument()
    expect(socketFn).toHaveBeenCalledWith(SocketActionsEnum.UPDATE, {
      ...testDeliveries[0],
      name: 'Audio - Speakers',
    })
  })

  it('shows the deliveries from every later socket push', async () => {
    renderProvider()
    await screen.findByText('Audio - Headphones')

    pushFromSocket([...testDeliveries, newDelivery])

    expect(screen.getByText('Pets - Dog Food')).toBeInTheDocument()
  })

  it('throws a clear error when used outside the provider', () => {
    // React logs the thrown error; keep the test output clean
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<DeliveryNames />)).toThrow(
      'useDeliveries must be used inside a DeliveriesProvider'
    )

    consoleError.mockRestore()
  })

  it('replays changes from before a refresh to the socket', async () => {
    const changedDelivery = { ...testDeliveries[1], delivered: true }
    localStorage.setItem(
      DELIVERIES_STORAGE_KEY,
      JSON.stringify([
        testDeliveries[0],
        changedDelivery,
        testDeliveries[2],
        newDelivery,
      ])
    )

    renderProvider()

    // Stored deliveries are shown immediately, before the socket answers
    expect(screen.getByText('Pets - Dog Food')).toBeInTheDocument()
    await vi.waitFor(() => expect(socketFn).toHaveBeenCalledTimes(2))
    expect(socketFn).toHaveBeenCalledWith(
      SocketActionsEnum.UPDATE,
      changedDelivery
    )
    expect(socketFn).toHaveBeenCalledWith(SocketActionsEnum.ADD, newDelivery)
  })
})
