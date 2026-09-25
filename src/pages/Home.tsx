import { useState } from 'react'
import { Button } from 'react-aria-components'
import { primaryButton } from '../components/styles.ts'
import { DeliveryDetails } from '../components/DeliveryDetails.tsx'
import { DeliveryForm } from '../components/DeliveryForm.tsx'
import { DeliveryList } from '../components/DeliveryList.tsx'
import { DiscardChangesDialog } from '../components/DiscardChangesDialog.tsx'
import { useDeliveries } from '../context/DeliveriesContext.ts'
import { usePersistentState } from '../hooks/usePersistentState.ts'
import {
  type DeliveryDraft,
  deliveryToDraft,
  draftToDelivery,
  EMPTY_DRAFT,
  isSameDraft,
} from '../utils/delivery.ts'

type PanelMode = 'view' | 'edit' | 'add'

type PendingAction = { type: 'select'; id: string } | { type: 'add' }

export function Home() {
  const { deliveries, addDelivery, updateDelivery } = useDeliveries()

  // Persisted so a refresh keeps the selection and any half-filled form
  const [selectedId, setSelectedId] = usePersistentState<string | null>(
    'home:selectedId',
    null
  )
  const [panelMode, setPanelMode] = usePersistentState<PanelMode>(
    'home:panelMode',
    'view'
  )
  const [draft, setDraft] = usePersistentState<DeliveryDraft>(
    'home:draft',
    EMPTY_DRAFT
  )

  // The action waiting for the user to confirm discarding their changes
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  // Look up by id so the panel reflects live socket updates
  const selectedDelivery = deliveries.find(
    (delivery) => delivery.id === selectedId
  )

  const hasUnsavedChanges = getHasUnsavedChanges()

  function getHasUnsavedChanges() {
    if (panelMode === 'add') {
      return !isSameDraft(draft, EMPTY_DRAFT)
    }

    if (panelMode === 'edit' && selectedDelivery) {
      return !isSameDraft(draft, deliveryToDraft(selectedDelivery))
    }

    return false
  }

  function runAction(action: PendingAction) {
    if (action.type === 'select') {
      selectDelivery(action.id)
    }

    if (action.type === 'add') {
      startAdding()
    }
  }

  // Ask before throwing away unsaved changes in the form
  function requestAction(action: PendingAction) {
    if (hasUnsavedChanges) {
      setPendingAction(action)
      return
    }

    runAction(action)
  }

  function discardChanges() {
    if (pendingAction) {
      runAction(pendingAction)
    }

    setPendingAction(null)
  }

  function requestSelect(id: string) {
    requestAction({ type: 'select', id })
  }

  function requestAdd() {
    requestAction({ type: 'add' })
  }

  function selectDelivery(id: string) {
    setSelectedId(id)
    setPanelMode('view')
  }

  function closeDetails() {
    setSelectedId(null)
    setPanelMode('view')
  }

  function startAdding() {
    setSelectedId(null)
    setDraft(EMPTY_DRAFT)
    setPanelMode('add')
  }

  function startEditing() {
    if (!selectedDelivery) {
      return
    }

    setDraft(deliveryToDraft(selectedDelivery))
    setPanelMode('edit')
  }

  function saveDraft() {
    if (panelMode === 'add') {
      const newDelivery = draftToDelivery(crypto.randomUUID(), draft)
      addDelivery(newDelivery)
      setSelectedId(newDelivery.id)
    }

    if (panelMode === 'edit' && selectedDelivery) {
      updateDelivery(draftToDelivery(selectedDelivery.id, draft))
    }

    setPanelMode('view')
  }

  function renderPanel() {
    if (panelMode === 'add') {
      return (
        <DeliveryForm
          heading="New delivery"
          draft={draft}
          onDraftChange={setDraft}
          onSave={saveDraft}
          onCancel={closeDetails}
        />
      )
    }

    if (panelMode === 'edit' && selectedDelivery) {
      return (
        <DeliveryForm
          heading={selectedDelivery.name}
          deliveryId={selectedDelivery.id}
          draft={draft}
          onDraftChange={setDraft}
          onSave={saveDraft}
          onCancel={() => setPanelMode('view')}
        />
      )
    }

    return (
      <DeliveryDetails
        delivery={selectedDelivery}
        onEdit={startEditing}
        onClose={closeDetails}
      />
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-8 w-full text-center text-3xl font-bold">
        Welcome to Offroad package delivery!
      </h1>
      {/* Above both columns, so the list and details start at the same height */}
      <div className="mb-4">
        <Button onPress={requestAdd} className={primaryButton}>
          + Add delivery
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <DeliveryList
          deliveries={deliveries}
          selectedId={selectedId}
          onSelect={requestSelect}
        />
        <section
          aria-label="Delivery details"
          className="self-start rounded-lg bg-white p-4 shadow md:sticky
            md:top-6"
        >
          {renderPanel()}
        </section>
      </div>
      <DiscardChangesDialog
        isOpen={pendingAction !== null}
        onDiscard={discardChanges}
        onKeepEditing={() => setPendingAction(null)}
      />
    </div>
  )
}
