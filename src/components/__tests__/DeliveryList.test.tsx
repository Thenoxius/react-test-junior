import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { testDeliveries } from '../../test/fakeSocket.ts'
import { DeliveryList } from '../DeliveryList.tsx'

describe('DeliveryList', () => {
  it('shows each status under its own heading', () => {
    render(
      <DeliveryList
        deliveries={testDeliveries}
        selectedId={null}
        onSelect={vi.fn()}
      />
    )

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3)

    const newList = screen.getByRole('listbox', { name: 'New packages' })
    expect(within(newList).getByRole('option')).toHaveTextContent(
      'Audio - Headphones'
    )

    const inTransitList = screen.getByRole('listbox', {
      name: 'Upcoming deliveries',
    })
    expect(within(inTransitList).getByRole('option')).toHaveTextContent(
      'Books - Handbook'
    )

    const deliveredList = screen.getByRole('listbox', {
      name: 'Delivered packages',
    })
    expect(within(deliveredList).getByRole('option')).toHaveTextContent(
      'Garden - Tool Set'
    )
  })

  it('tells the parent which delivery was selected', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <DeliveryList
        deliveries={testDeliveries}
        selectedId={null}
        onSelect={onSelect}
      />
    )

    await user.click(screen.getByRole('option', { name: 'Books - Handbook' }))

    expect(onSelect).toHaveBeenCalledWith('2')
  })

  it('marks the selected delivery', () => {
    render(
      <DeliveryList
        deliveries={testDeliveries}
        selectedId="3"
        onSelect={vi.fn()}
      />
    )

    expect(
      screen.getByRole('option', { name: 'Garden - Tool Set' })
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('option', { name: 'Audio - Headphones' })
    ).toHaveAttribute('aria-selected', 'false')
  })

  it('can be used with the keyboard', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const twoNewDeliveries = [
      testDeliveries[0],
      { ...testDeliveries[0], id: '4', name: 'Audio - Speakers' },
    ]
    render(
      <DeliveryList
        deliveries={twoNewDeliveries}
        selectedId={null}
        onSelect={onSelect}
      />
    )

    // Tab into the first list, arrow down to the next item, select it
    await user.tab()
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onSelect).toHaveBeenCalledWith('4')
  })

  it('says so when a section has no deliveries', () => {
    render(
      <DeliveryList
        deliveries={[testDeliveries[0]]}
        selectedId={null}
        onSelect={vi.fn()}
      />
    )

    expect(screen.getAllByText('No deliveries')).toHaveLength(2)
  })
})
