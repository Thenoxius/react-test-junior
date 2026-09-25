import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SocketActionsEnum } from '../../api/types.ts'
import { DeliveriesProvider } from '../../context/DeliveriesProvider.tsx'
import {
  pushFromSocket,
  setupFakeSocket,
  testDeliveries,
} from '../../test/fakeSocket.ts'
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

// React Aria moves focus into a dialog a moment after it opens. Keyboard
// input before that goes to the page behind it, so wait like a user would.
async function waitForDialogFocus() {
  const dialog = await screen.findByRole('alertdialog')
  await waitFor(() =>
    expect(dialog.contains(document.activeElement)).toBe(true)
  )
}

// crypto.randomUUID(), e.g. "3b241101-e2bb-4255-8caf-4136c566a962"
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

interface ExpectedDetails {
  id: string | RegExp
  productType: string
  productModel: string
  status: string
}

// Checks every row of the details panel: each value next to its own label
function expectDetails(expected: ExpectedDetails) {
  const panel = within(getPanel())

  function getValue(label: string) {
    return panel.getByText(label, { selector: 'dt' }).nextElementSibling
  }

  expect(getValue('ID')).toHaveTextContent(expected.id)
  expect(getValue('Product type')).toHaveTextContent(expected.productType)
  expect(getValue('Product model')).toHaveTextContent(expected.productModel)
  expect(getValue('Status')).toHaveTextContent(expected.status)
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

    expect(within(getPanel()).getByRole('heading')).toHaveTextContent(
      'Books - Handbook'
    )
    expectDetails({
      id: '2',
      productType: 'Books',
      productModel: 'Handbook',
      status: 'In transit',
    })
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
    expectDetails({
      id: UUID_PATTERN,
      productType: 'Pets',
      productModel: 'Dog Food',
      status: 'In transit',
    })
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
    expectDetails({
      id: '1',
      productType: 'Audio',
      productModel: 'Speakers',
      status: 'Delivered',
    })
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

  it('updates the open details when the socket changes that delivery', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(
      await screen.findByRole('option', { name: 'Books - Handbook' })
    )

    pushFromSocket([
      testDeliveries[0],
      { ...testDeliveries[1], inTransit: false, delivered: true },
      testDeliveries[2],
    ])

    expect(within(getPanel()).getByText('Delivered')).toBeInTheDocument()
  })

  it('asks before discarding unsaved changes when adding a delivery', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(
      await screen.findByRole('option', { name: 'Audio - Headphones' })
    )
    await user.click(screen.getByRole('button', { name: 'Edit delivery' }))
    await user.type(screen.getByLabelText(/Product model/), ' Pro')
    await user.click(screen.getByRole('button', { name: '+ Add delivery' }))
    await user.click(screen.getByRole('button', { name: 'Discard' }))

    expect(within(getPanel()).getByRole('heading')).toHaveTextContent(
      'New delivery'
    )
    expect(screen.getByLabelText(/Product model/)).toHaveValue('')
  })

  it('keeps editing when the dialog is closed with Escape', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(
      await screen.findByRole('option', { name: 'Audio - Headphones' })
    )
    await user.click(screen.getByRole('button', { name: 'Edit delivery' }))
    await user.type(screen.getByLabelText(/Product model/), ' Pro')
    await user.click(screen.getByRole('option', { name: 'Books - Handbook' }))
    await waitForDialogFocus()
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Product model/)).toHaveValue('Headphones Pro')
  })

  it('goes back to the empty panel when adding is cancelled', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole('button', { name: '+ Add delivery' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(
      within(getPanel()).getByText('Select a delivery to see its details.')
    ).toBeInTheDocument()
  })

  it('clears the selection when the details are closed', async () => {
    const user = userEvent.setup()
    renderHome()

    const option = await screen.findByRole('option', {
      name: 'Books - Handbook',
    })
    await user.click(option)
    await user.click(screen.getByRole('button', { name: 'Close details' }))

    expect(
      within(getPanel()).getByText('Select a delivery to see its details.')
    ).toBeInTheDocument()
    expect(option).toHaveAttribute('aria-selected', 'false')
  })

  describe('when the socket changes a delivery that is being edited', () => {
    const headphonesDelivered = {
      ...testDeliveries[0],
      delivered: true,
    }

    // Opens Headphones in the form, changes the model, and then lets the
    // socket mark Headphones as delivered before saving
    async function editWhileSocketChangesIt() {
      const user = userEvent.setup()
      renderHome()

      await user.click(
        await screen.findByRole('option', { name: 'Audio - Headphones' })
      )
      await user.click(screen.getByRole('button', { name: 'Edit delivery' }))
      const modelInput = screen.getByLabelText(/Product model/)
      await user.clear(modelInput)
      await user.type(modelInput, 'Speakers')

      pushFromSocket([
        headphonesDelivered,
        testDeliveries[1],
        testDeliveries[2],
      ])
      await user.click(screen.getByRole('button', { name: 'Save' }))

      return user
    }

    it('warns instead of overwriting the change', async () => {
      await editWhileSocketChangesIt()

      expect(
        screen.getByRole('alertdialog', {
          name: 'This delivery was changed while you were editing',
        })
      ).toBeInTheDocument()
      expect(socketFn).not.toHaveBeenCalled()
    })

    it('saves my version when I choose to', async () => {
      const user = await editWhileSocketChangesIt()

      await user.click(screen.getByRole('button', { name: 'Save my version' }))

      expect(socketFn).toHaveBeenCalledWith(SocketActionsEnum.UPDATE, {
        id: '1',
        name: 'Audio - Speakers',
        inTransit: false,
        delivered: false,
      })
      expectDetails({
        id: '1',
        productType: 'Audio',
        productModel: 'Speakers',
        status: 'New',
      })
    })

    it('loads the latest version into the form when I choose to', async () => {
      const user = await editWhileSocketChangesIt()

      await user.click(
        screen.getByRole('button', { name: 'Load latest version' })
      )

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(screen.getByLabelText(/Product model/)).toHaveValue('Headphones')
      expect(screen.getByRole('radio', { name: 'Delivered' })).toBeChecked()
      expect(socketFn).not.toHaveBeenCalled()
    })

    it('keeps editing when the warning is closed with Escape', async () => {
      const user = await editWhileSocketChangesIt()

      await waitForDialogFocus()
      await user.keyboard('{Escape}')

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(screen.getByLabelText(/Product model/)).toHaveValue('Speakers')
      expect(socketFn).not.toHaveBeenCalled()
    })

    it('does not count the socket change as my unsaved change', async () => {
      const user = userEvent.setup()
      renderHome()

      await user.click(
        await screen.findByRole('option', { name: 'Audio - Headphones' })
      )
      await user.click(screen.getByRole('button', { name: 'Edit delivery' }))
      pushFromSocket([
        headphonesDelivered,
        testDeliveries[1],
        testDeliveries[2],
      ])
      await user.click(screen.getByRole('option', { name: 'Books - Handbook' }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(within(getPanel()).getByRole('heading')).toHaveTextContent(
        'Books - Handbook'
      )
    })
  })

  it('keeps an added delivery after a refresh', async () => {
    const user = userEvent.setup()
    const { unmount } = renderHome()

    await user.click(screen.getByRole('button', { name: '+ Add delivery' }))
    await user.type(screen.getByLabelText(/Product type/), 'Pets')
    await user.type(screen.getByLabelText(/Product model/), 'Dog Food')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    // After a refresh the real socket starts over without the new delivery
    unmount()
    socketFn = setupFakeSocket(testDeliveries)
    renderHome()

    expect(
      await screen.findByRole('option', { name: 'Pets - Dog Food' })
    ).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(socketFn).toHaveBeenCalledWith(
        SocketActionsEnum.ADD,
        expect.objectContaining({ name: 'Pets - Dog Food' })
      )
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
