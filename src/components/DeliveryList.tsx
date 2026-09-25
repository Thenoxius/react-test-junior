import { useId } from 'react'
import { ListBox, ListBoxItem, type Selection } from 'react-aria-components'
import type { IDelivery } from '../api/types.ts'
import { type DeliveryStatus, getStatus } from '../utils/delivery.ts'

const SECTIONS: { status: DeliveryStatus; title: string }[] = [
  { status: 'New', title: 'New packages' },
  { status: 'In transit', title: 'Upcoming deliveries' },
  { status: 'Delivered', title: 'Delivered packages' },
]

interface DeliveryListProps {
  deliveries: IDelivery[]
  selectedId: string | null
  onSelect: (id: string) => void
}

interface DeliverySectionProps extends DeliveryListProps {
  title: string
}

// One heading with its own list, so screen reader users can jump between
// the sections with heading navigation
function DeliverySection({
  title,
  deliveries,
  selectedId,
  onSelect,
}: DeliverySectionProps) {
  const headingId = useId()

  function handleSelectionChange(selection: Selection) {
    if (selection === 'all') {
      return
    }

    const selectedKey = Array.from(selection)[0]

    if (selectedKey !== undefined) {
      onSelect(String(selectedKey))
    }
  }

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-1 text-xl font-bold">
        {title}
      </h2>
      <ListBox
        aria-labelledby={headingId}
        items={deliveries}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={selectedId ? [selectedId] : []}
        onSelectionChange={handleSelectionChange}
        renderEmptyState={() => (
          <p className="px-2 py-1 text-gray-600">No deliveries</p>
        )}
        className="outline-none"
      >
        {(delivery) => (
          <ListBoxItem
            id={delivery.id}
            textValue={delivery.name}
            className="cursor-pointer rounded px-2 py-1 outline-none
              hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-black
              selected:bg-black/10 selected:font-semibold"
          >
            {delivery.name}
          </ListBoxItem>
        )}
      </ListBox>
    </section>
  )
}

export function DeliveryList({
  deliveries,
  selectedId,
  onSelect,
}: DeliveryListProps) {
  return (
    <div className="flex flex-col gap-6">
      {SECTIONS.map((section) => (
        <DeliverySection
          key={section.status}
          title={section.title}
          deliveries={deliveries.filter(
            (delivery) => getStatus(delivery) === section.status
          )}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
