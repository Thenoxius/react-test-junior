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

    // Tab past the section button into the first list, arrow down to the
    // next item, select it
    await user.tab()
    await user.tab()
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onSelect).toHaveBeenCalledWith('4')
  })

  it('shows how many deliveries each section has', () => {
    render(
      <DeliveryList
        deliveries={[
          ...testDeliveries,
          { ...testDeliveries[0], id: '4', name: 'Audio - Speakers' },
        ]}
        selectedId={null}
        onSelect={vi.fn()}
      />
    )

    expect(
      screen.getByRole('button', { name: 'New packages (2)' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Upcoming deliveries (1)' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Delivered packages (1)' })
    ).toBeInTheDocument()
  })

  it('collapses and expands a section', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryList
        deliveries={testDeliveries}
        selectedId={null}
        onSelect={vi.fn()}
      />
    )
    const sectionButton = screen.getByRole('button', {
      name: /New packages/,
    })
    expect(sectionButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(sectionButton)

    expect(sectionButton).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('option', { name: 'Audio - Headphones' })
    ).not.toBeInTheDocument()
    // The other sections stay open
    expect(
      screen.getByRole('option', { name: 'Books - Handbook' })
    ).toBeInTheDocument()

    await user.click(sectionButton)

    expect(sectionButton).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('option', { name: 'Audio - Headphones' })
    ).toBeInTheDocument()
  })

  it('remembers collapsed sections after a refresh', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <DeliveryList
        deliveries={testDeliveries}
        selectedId={null}
        onSelect={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /Delivered packages/ }))
    unmount()
    render(
      <DeliveryList
        deliveries={testDeliveries}
        selectedId={null}
        onSelect={vi.fn()}
      />
    )

    expect(
      screen.getByRole('button', { name: /Delivered packages/ })
    ).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.getByRole('button', { name: /New packages/ })
    ).toHaveAttribute('aria-expanded', 'true')
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
