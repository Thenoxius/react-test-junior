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

// What the form column shows
type FormMode = 'closed' | 'edit' | 'add'

// Actions that can throw away unsaved changes in the form
type PendingAction =
  { type: 'select'; id: string } | { type: 'add' } | { type: 'edit' }

export function Home() {
  const { deliveries, addDelivery, updateDelivery } = useDeliveries()

  // Persisted so a refresh keeps the selection and any half-filled form
  const [selectedId, setSelectedId] = usePersistentState<string | null>(
    'home:selectedId',
    null
  )
  const [formMode, setFormMode] = usePersistentState<FormMode>(
    'home:formMode',
    'closed'
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

  // Look up by id so the details reflect live socket updates
  const selectedDelivery = deliveries.find(
    (delivery) => delivery.id === selectedId
  )

  // The edit form belongs to the selected delivery, so it can only be open
  // while that delivery is selected
  const isEditing = formMode === 'edit' && selectedDelivery !== undefined
  const isFormOpen = formMode === 'add' || isEditing
  const hasUnsavedChanges = isFormOpen && !isSameDraft(draft, originalDraft)

  // Selecting another delivery only leaves the form when it is editing the
  // selected delivery. A new delivery being added has nothing to do with
  // the selection, so browsing keeps that form.
  function leavesForm(action: PendingAction) {
    if (action.type === 'select') {
      return isEditing
    }

    return true
  }

  // Ask before throwing away unsaved changes in the form
  function requestAction(action: PendingAction) {
    if (hasUnsavedChanges && leavesForm(action)) {
      setPendingAction(action)
      return
    }

    runAction(action)
  }

  function runAction(action: PendingAction) {
    if (action.type === 'select') {
      selectDelivery(action.id)
    }

    if (action.type === 'add') {
      startAdding()
    }

    if (action.type === 'edit') {
      startEditing()
    }
  }

  function discardChanges() {
    if (pendingAction) {
      runAction(pendingAction)
    }

    setPendingAction(null)
  }

  function selectDelivery(id: string) {
    if (isEditing) {
      closeForm()
    }

    setSelectedId(id)
  }

  function closeForm() {
    setFormMode('closed')
  }

  function startAdding() {
    setDraft(EMPTY_DRAFT)
    setOriginalDraft(EMPTY_DRAFT)
    setFormMode('add')
  }

  function startEditing() {
    if (!selectedDelivery) {
      return
    }

    const currentValues = deliveryToDraft(selectedDelivery)
    setDraft(currentValues)
    setOriginalDraft(currentValues)
    setFormMode('edit')
  }

  function saveDraft() {
    if (formMode === 'add') {
      const newDelivery = draftToDelivery(crypto.randomUUID(), draft)
      addDelivery(newDelivery)
      setSelectedId(newDelivery.id)
      closeForm()
    }

    if (isEditing) {
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
    closeForm()
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

  function renderForm() {
    if (formMode === 'add') {
      return (
        <DeliveryForm
          heading="New delivery"
          draft={draft}
          onDraftChange={setDraft}
          onSave={saveDraft}
          onCancel={closeForm}
        />
      )
    }

    if (isEditing) {
      return (
        <DeliveryForm
          heading={`Edit ${selectedDelivery.name}`}
          deliveryId={selectedDelivery.id}
          draft={draft}
          onDraftChange={setDraft}
          onSave={saveDraft}
          onCancel={closeForm}
        />
      )
    }

    return (
      <p className="text-gray-600">
        Press "+ Add delivery" or "Edit delivery" to open the form.
      </p>
    )
  }

  return (
    <div className="p-6">
      <Heading level={1} className="mb-8 w-full text-center text-3xl font-bold">
        Welcome to Offroad package delivery!
      </Heading>
      {/* Above all columns, so the three boxes start at the same height */}
      <div className="mb-4">
        <Button
          onPress={() => requestAction({ type: 'add' })}
          className={primaryButton}
        >
          + Add delivery
        </Button>
      </div>
      {/* LIST OF DELIVERIES | DELIVERY DETAILS | ADD/EDIT DELIVERY FORM */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-label="Deliveries" className={panel}>
          <DeliveryList
            deliveries={deliveries}
            selectedId={selectedId}
            onSelect={(id) => requestAction({ type: 'select', id })}
          />
        </section>
        <section
          aria-label="Delivery details"
          className={`${panel} lg:sticky lg:top-6`}
        >
          <DeliveryDetails
            delivery={selectedDelivery}
            onEdit={() => requestAction({ type: 'edit' })}
          />
        </section>
        <section
          aria-label="Delivery form"
          className={`${panel} lg:sticky lg:top-6`}
        >
          {renderForm()}
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
