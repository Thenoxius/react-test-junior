import { useState } from 'react'
import { Button, Heading } from 'react-aria-components'
import { panel, primaryButton } from '../components/styles.ts'
import { DeliveryDetails } from '../components/DeliveryDetails.tsx'
import { DeliveryForm } from '../components/DeliveryForm.tsx'
import { DeliveryList } from '../components/DeliveryList.tsx'
import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
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
  // The form values at the moment adding or editing started. Comparing
  // against this (not the live data) tells the user's own changes apart
  // from changes that came in through the socket meanwhile.
  const [originalDraft, setOriginalDraft] = usePersistentState<DeliveryDraft>(
    'home:originalDraft',
    EMPTY_DRAFT
  )

  // The action waiting for the user to confirm discarding their changes
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  // Shown when saving a delivery that changed while it was being edited
  const [showEditConflict, setShowEditConflict] = useState(false)

  // Look up by id so the panel reflects live socket updates
  const selectedDelivery = deliveries.find(
    (delivery) => delivery.id === selectedId
  )

  const isFormOpen =
    panelMode === 'add' ||
    (panelMode === 'edit' && selectedDelivery !== undefined)
  const hasUnsavedChanges = isFormOpen && !isSameDraft(draft, originalDraft)

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
    setOriginalDraft(EMPTY_DRAFT)
    setPanelMode('add')
  }

  function startEditing() {
    if (!selectedDelivery) {
      return
    }

    const currentValues = deliveryToDraft(selectedDelivery)
    setDraft(currentValues)
    setOriginalDraft(currentValues)
    setPanelMode('edit')
  }

  function saveDraft() {
    if (panelMode === 'add') {
      const newDelivery = draftToDelivery(crypto.randomUUID(), draft)
      addDelivery(newDelivery)
      setSelectedId(newDelivery.id)
      setPanelMode('view')
    }

    if (panelMode === 'edit' && selectedDelivery) {
      const changedWhileEditing = !isSameDraft(
        deliveryToDraft(selectedDelivery),
        originalDraft
      )

      if (changedWhileEditing) {
        setShowEditConflict(true)
        return
      }

      saveEditedDelivery()
    }
  }

  function saveEditedDelivery() {
    if (!selectedDelivery) {
      return
    }

    updateDelivery(draftToDelivery(selectedDelivery.id, draft))
    setShowEditConflict(false)
    setPanelMode('view')
  }

  // Replaces the user's changes with the latest data, so they can make
  // their change again on top of it
  function loadLatestVersion() {
    if (!selectedDelivery) {
      return
    }

    const latestValues = deliveryToDraft(selectedDelivery)
    setDraft(latestValues)
    setOriginalDraft(latestValues)
    setShowEditConflict(false)
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
      <Heading level={1} className="mb-8 w-full text-center text-3xl font-bold">
        Welcome to Offroad package delivery!
      </Heading>
      {/* Above both columns, so the list and details start at the same height */}
      <div className="mb-4">
        <Button onPress={requestAdd} className={primaryButton}>
          + Add delivery
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className={panel}>
          <DeliveryList
            deliveries={deliveries}
            selectedId={selectedId}
            onSelect={requestSelect}
          />
        </div>
        <section
          aria-label="Delivery details"
          className={`${panel} md:sticky md:top-6`}
        >
          {renderPanel()}
        </section>
      </div>
      <ConfirmDialog
        isOpen={pendingAction !== null}
        heading="Discard unsaved changes?"
        message="The changes you made to this delivery haven't been saved yet."
        primaryLabel="Discard"
        onPrimary={discardChanges}
        secondaryLabel="Keep editing"
        onSecondary={() => setPendingAction(null)}
        onDismiss={() => setPendingAction(null)}
      />
      <ConfirmDialog
        isOpen={showEditConflict}
        heading="This delivery was changed while you were editing"
        message="Someone else updated this delivery after you started editing. Save your version to overwrite their change, or load the latest version and make your change again."
        primaryLabel="Save my version"
        onPrimary={saveEditedDelivery}
        secondaryLabel="Load latest version"
        onSecondary={loadLatestVersion}
        onDismiss={() => setShowEditConflict(false)}
      />
    </div>
  )
}
