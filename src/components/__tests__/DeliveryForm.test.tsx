import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { type DeliveryDraft, EMPTY_DRAFT } from '../../utils/delivery.ts'
import { DeliveryForm } from '../DeliveryForm.tsx'

const filledDraft: DeliveryDraft = {
  productType: 'Books',
  productModel: 'Handbook',
  status: 'New',
}

function renderForm(props: Partial<Parameters<typeof DeliveryForm>[0]> = {}) {
  const handlers = {
    onDraftChange: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
  }

  render(
    <DeliveryForm
      heading="New delivery"
      draft={filledDraft}
      {...handlers}
      {...props}
    />
  )

  return handlers
}

describe('DeliveryForm', () => {
  it('shows the draft values in the fields', () => {
    renderForm({ deliveryId: '2' })

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByLabelText(/Product type/)).toHaveValue('Books')
    expect(screen.getByLabelText(/Product model/)).toHaveValue('Handbook')
    expect(screen.getByRole('radio', { name: 'New' })).toBeChecked()
  })

  it('explains that a new delivery gets its ID on save', () => {
    renderForm()

    expect(screen.getByText('Assigned when saved')).toBeInTheDocument()
  })

  it('reports every change to the draft', async () => {
    const user = userEvent.setup()
    const { onDraftChange } = renderForm()

    await user.type(screen.getByLabelText(/Product type/), 's')
    expect(onDraftChange).toHaveBeenLastCalledWith({
      ...filledDraft,
      productType: 'Bookss',
    })

    await user.click(screen.getByRole('radio', { name: 'Delivered' }))
    expect(onDraftChange).toHaveBeenLastCalledWith({
      ...filledDraft,
      status: 'Delivered',
    })
  })

  it('saves a valid draft', async () => {
    const user = userEvent.setup()
    const { onSave } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledOnce()
  })

  it('does not save when required fields are empty', async () => {
    const user = userEvent.setup()
    const { onSave } = renderForm({ draft: EMPTY_DRAFT })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByLabelText(/Product type/)).toBeInvalid()
    expect(screen.getByLabelText(/Product model/)).toBeInvalid()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('does not save fields that only contain spaces', async () => {
    const user = userEvent.setup()
    const { onSave } = renderForm({
      draft: { ...filledDraft, productType: '   ', productModel: '  ' },
    })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByLabelText(/Product type/)).toBeInvalid()
    expect(screen.getByLabelText(/Product model/)).toBeInvalid()
    expect(screen.getAllByText("Can't be only spaces.")).toHaveLength(2)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves when pressing Enter in a field', async () => {
    const user = userEvent.setup()
    const { onSave } = renderForm()

    await user.click(screen.getByLabelText(/Product model/))
    await user.keyboard('{Enter}')

    expect(onSave).toHaveBeenCalledOnce()
  })

  it('does not allow the name separator inside a field', async () => {
    const user = userEvent.setup()
    const { onSave } = renderForm({
      draft: { ...filledDraft, productModel: 'Hand - book' },
    })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText(/Can't contain "-"/)).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('cancels from both the Cancel button and the close button', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Close form' }))

    expect(onCancel).toHaveBeenCalledTimes(2)
  })
})
