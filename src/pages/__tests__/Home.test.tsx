import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SocketActionsEnum } from '../../api/types.ts'
import { DeliveriesProvider } from '../../context/DeliveriesProvider.tsx'
import { setupFakeSocket } from '../../test/fakeSocket.ts'
import { Home } from '../Home.tsx'

vi.mock('../../api/data-socket.ts')

function renderHome() {
  return render(
    <DeliveriesProvider>
      <Home />
    </DeliveriesProvider>
  )
}

function getPanel() {
  return screen.getByRole('region', { name: 'Delivery details' })
}

describe('Home page', () => {
  let socketFn: ReturnType<typeof setupFakeSocket>

  beforeEach(() => {
    vi.clearAllMocks()
    socketFn = setupFakeSocket()
  })

  it('shows the deliveries from the socket', async () => {
    renderHome()

    expect(
      await screen.findByRole('option', { name: 'Audio - Headphones' })
    ).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('shows the details of the selected delivery', async () => {
    const user = userEvent.setup()
    renderHome()

    expect(
      within(getPanel()).getByText('Select a delivery to see its details.')
    ).toBeInTheDocument()

    await user.click(
      await screen.findByRole('option', { name: 'Books - Handbook' })
    )

    const panel = getPanel()
    expect(within(panel).getByRole('heading')).toHaveTextContent(
      'Books - Handbook'
    )
    expect(within(panel).getByText('Books')).toBeInTheDocument()
    expect(within(panel).getByText('Handbook')).toBeInTheDocument()
    expect(within(panel).getByText('In transit')).toBeInTheDocument()
  })

  it('adds a new delivery', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole('button', { name: '+ Add delivery' }))
    await user.type(screen.getByLabelText(/Product type/), 'Pets')
    await user.type(screen.getByLabelText(/Product model/), 'Dog Food')
    await user.click(screen.getByRole('radio', { name: 'In transit' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const newOption = screen.getByRole('option', { name: 'Pets - Dog Food' })
    expect(newOption).toHaveAttribute('aria-selected', 'true')
    expect(within(getPanel()).getByRole('heading')).toHaveTextContent(
      'Pets - Dog Food'
    )
    expect(socketFn).toHaveBeenCalledWith(
      SocketActionsEnum.ADD,
      expect.objectContaining({
        name: 'Pets - Dog Food',
        inTransit: true,
        delivered: false,
      })
    )
  })

  it('does not save a delivery with empty fields', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole('button', { name: '+ Add delivery' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByLabelText(/Product type/)).toBeInvalid()
    expect(socketFn).not.toHaveBeenCalled()
  })

  it('edits an existing delivery', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(
      await screen.findByRole('option', { name: 'Audio - Headphones' })
    )
    await user.click(screen.getByRole('button', { name: 'Edit delivery' }))

    const modelInput = screen.getByLabelText(/Product model/)
    expect(modelInput).toHaveValue('Headphones')

    await user.clear(modelInput)
    await user.type(modelInput, 'Speakers')
    await user.click(screen.getByRole('radio', { name: 'Delivered' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(within(getPanel()).getByRole('heading')).toHaveTextContent(
      'Audio - Speakers'
    )
    expect(socketFn).toHaveBeenCalledWith(SocketActionsEnum.UPDATE, {
      id: '1',
      name: 'Audio - Speakers',
      inTransit: false,
      delivered: true,
    })
  })

  it('cancelling an edit keeps the delivery unchanged', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(
      await screen.findByRole('option', { name: 'Audio - Headphones' })
    )
    await user.click(screen.getByRole('button', { name: 'Edit delivery' }))
    await user.type(screen.getByLabelText(/Product model/), ' Pro')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(within(getPanel()).getByRole('heading')).toHaveTextContent(
      'Audio - Headphones'
    )
    expect(socketFn).not.toHaveBeenCalled()
  })

  it('asks before discarding unsaved changes', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(
      await screen.findByRole('option', { name: 'Audio - Headphones' })
    )
    await user.click(screen.getByRole('button', { name: 'Edit delivery' }))
    await user.type(screen.getByLabelText(/Product model/), ' Pro')
    await user.click(screen.getByRole('option', { name: 'Books - Handbook' }))

    const dialog = screen.getByRole('alertdialog', {
      name: 'Discard unsaved changes?',
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Keep editing' })
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Product model/)).toHaveValue('Headphones Pro')

    await user.click(screen.getByRole('option', { name: 'Books - Handbook' }))
    await user.click(screen.getByRole('button', { name: 'Discard' }))

    expect(within(getPanel()).getByRole('heading')).toHaveTextContent(
      'Books - Handbook'
    )
    expect(socketFn).not.toHaveBeenCalled()
  })

  it('does not ask when the form has no changes', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(
      await screen.findByRole('option', { name: 'Audio - Headphones' })
    )
    await user.click(screen.getByRole('button', { name: 'Edit delivery' }))
    await user.click(screen.getByRole('option', { name: 'Books - Handbook' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(within(getPanel()).getByRole('heading')).toHaveTextContent(
      'Books - Handbook'
    )
  })

  it('keeps the selection and a half-filled form after a refresh', async () => {
    const user = userEvent.setup()
    const { unmount } = renderHome()

    await user.click(
      await screen.findByRole('option', { name: 'Books - Handbook' })
    )
    await user.click(screen.getByRole('button', { name: 'Edit delivery' }))
    await user.clear(screen.getByLabelText(/Product model/))
    await user.type(screen.getByLabelText(/Product model/), 'Half typed')

    // Unmounting and rendering again is what a page refresh does to React
    unmount()
    renderHome()

    expect(screen.getByLabelText(/Product model/)).toHaveValue('Half typed')
    expect(
      screen.getByRole('option', { name: 'Books - Handbook' })
    ).toHaveAttribute('aria-selected', 'true')
  })
})
