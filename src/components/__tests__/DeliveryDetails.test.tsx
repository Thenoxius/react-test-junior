import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { testDeliveries } from '../../test/fakeSocket.ts'
import { DeliveryDetails } from '../DeliveryDetails.tsx'

const handbook = testDeliveries[1]

describe('DeliveryDetails', () => {
  it('asks to select a delivery when none is selected', () => {
    render(<DeliveryDetails delivery={undefined} onEdit={vi.fn()} />)

    expect(
      screen.getByText('Select a delivery to see its details.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows every detail of the delivery', () => {
    render(<DeliveryDetails delivery={handbook} onEdit={vi.fn()} />)

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Books - Handbook'
    )
    expect(screen.getByText('ID').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('Product type').nextSibling).toHaveTextContent(
      'Books'
    )
    expect(screen.getByText('Product model').nextSibling).toHaveTextContent(
      'Handbook'
    )
    expect(screen.getByText('Status').nextSibling).toHaveTextContent(
      'In transit'
    )
  })

  it('calls onEdit from the Edit button', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<DeliveryDetails delivery={handbook} onEdit={onEdit} />)

    await user.click(screen.getByRole('button', { name: 'Edit delivery' }))

    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('has no close button, only the Edit button', () => {
    render(<DeliveryDetails delivery={handbook} onEdit={vi.fn()} />)

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(
      screen.queryByRole('button', { name: 'Close details' })
    ).not.toBeInTheDocument()
  })
})
