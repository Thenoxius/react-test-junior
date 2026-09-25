import { useId } from 'react'
import {
  Button,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
  type Key,
  ListBox,
  ListBoxItem,
  type Selection,
} from 'react-aria-components'
import type { IDelivery } from '../api/types.ts'
import { usePersistentState } from '../hooks/usePersistentState.ts'
import {
  DELIVERY_STATUSES,
  type DeliveryStatus,
  getStatus,
} from '../utils/delivery.ts'

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
  status: DeliveryStatus
  title: string
}

// One heading with its own list, so screen reader users can jump between
// the sections with heading navigation. The heading is also the button
// that collapses and expands the list.
function DeliverySection({
  status,
  title,
  deliveries,
  selectedId,
  onSelect,
}: DeliverySectionProps) {
  const titleId = useId()

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
    <section aria-labelledby={titleId} className="py-4 first:pt-0 last:pb-0">
      <Disclosure id={status} className="group">
        <Heading level={2} className="text-xl font-bold">
          <Button
            slot="trigger"
            className="flex w-full cursor-pointer items-center gap-2 rounded
              text-left outline-none focus-visible:ring-2
              focus-visible:ring-black"
          >
            <span
              aria-hidden="true"
              className="text-base transition-transform
                group-data-expanded:rotate-90"
            >
              ▸
            </span>
            <span>
              <span id={titleId}>{title}</span> ({deliveries.length})
            </span>
          </Button>
        </Heading>
        <DisclosurePanel className="mt-1">
          <ListBox
            aria-labelledby={titleId}
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
                  hover:bg-black/10 focus-visible:ring-2
                  focus-visible:ring-black selected:bg-black/15
                  selected:font-semibold"
              >
                {delivery.name}
              </ListBoxItem>
            )}
          </ListBox>
        </DisclosurePanel>
      </Disclosure>
    </section>
  )
}

export function DeliveryList({
  deliveries,
  selectedId,
  onSelect,
}: DeliveryListProps) {
  // All sections start expanded; which ones are open survives a refresh
  const [expandedSections, setExpandedSections] = usePersistentState<Key[]>(
    'deliveryList:expandedSections',
    [...DELIVERY_STATUSES]
  )

  return (
    <DisclosureGroup
      allowsMultipleExpanded
      expandedKeys={expandedSections}
      onExpandedChange={(keys) => setExpandedSections(Array.from(keys))}
      // A thin grey line between sections, with equal space above and below
      className="flex flex-col divide-y divide-gray-200"
    >
      {SECTIONS.map((section) => (
        <DeliverySection
          key={section.status}
          status={section.status}
          title={section.title}
          deliveries={deliveries.filter(
            (delivery) => getStatus(delivery) === section.status
          )}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </DisclosureGroup>
  )
}
