import { useState } from 'react'
import { useDeliveries } from '../context/DeliveriesContext.ts'
import {
  type DeliveryDraft,
  deliveryToDraft,
  draftToDelivery,
  EMPTY_DRAFT,
  isSameDraft,
} from '../utils/delivery.ts'
import { usePersistentState } from './usePersistentState.ts'

// What the panel next to the list shows: details, or the form
type PanelMode = 'view' | 'add' | 'edit'

// Everything the Home page can do with deliveries: selecting, adding and
// editing. The state is persisted, so a refresh keeps the selection and a
// half-filled form.
export function useDeliveryEditor() {
  const { deliveries, addDelivery, updateDelivery } = useDeliveries()

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
  // The form values when adding or editing started. Comparing against this
  // (not the live data) tells the user's own changes apart from changes
  // that came in through the socket meanwhile.
  const [originalDraft, setOriginalDraft] = usePersistentState<DeliveryDraft>(
    'home:originalDraft',
    EMPTY_DRAFT
  )

  // What to do once the user agrees to discard their changes
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [hasEditConflict, setHasEditConflict] = useState(false)

  // Look up by id so the panel reflects live socket updates
  const selectedDelivery = deliveries.find(
    (delivery) => delivery.id === selectedId
  )

  const isAdding = panelMode === 'add'
  // The edit form belongs to the selected delivery
  const isEditing = panelMode === 'edit' && selectedDelivery !== undefined
  const hasUnsavedChanges =
    (isAdding || isEditing) && !isSameDraft(draft, originalDraft)

  // Runs the action straight away, or first asks to discard unsaved changes
  function confirmDiscard(action: () => void) {
    if (!hasUnsavedChanges) {
      action()
      return
    }

    // Wrapped in a function, because React would call a function passed to
    // a state setter directly
    setPendingAction(() => action)
  }

  function openForm(mode: PanelMode, values: DeliveryDraft) {
    setDraft(values)
    setOriginalDraft(values)
    setPanelMode(mode)
  }

  // Back to the details (or the empty panel when nothing is selected)
  function showDetails() {
    setPanelMode('view')
  }

  // Details and form share one panel, so selecting always leaves the form
  function selectDelivery(id: string) {
    confirmDiscard(() => {
      setSelectedId(id)
      showDetails()
    })
  }

  function closeDetails() {
    setSelectedId(null)
    showDetails()
  }

  // The form takes the place of the details, so the selection is cleared
  function startAdding() {
    confirmDiscard(() => {
      setSelectedId(null)
      openForm('add', EMPTY_DRAFT)
    })
  }

  function startEditing() {
    if (!selectedDelivery) {
      return
    }

    openForm('edit', deliveryToDraft(selectedDelivery))
  }

  function save() {
    if (isAdding) {
      const newDelivery = draftToDelivery(crypto.randomUUID(), draft)
      addDelivery(newDelivery)
      setSelectedId(newDelivery.id)
      showDetails()
    }

    if (isEditing) {
      const changedWhileEditing = !isSameDraft(
        deliveryToDraft(selectedDelivery),
        originalDraft
      )

      if (changedWhileEditing) {
        setHasEditConflict(true)
        return
      }

      saveEdit()
    }
  }

  function saveEdit() {
    if (!selectedDelivery) {
      return
    }

    updateDelivery(draftToDelivery(selectedDelivery.id, draft))
    setHasEditConflict(false)
    showDetails()
  }

  // Replaces the user's changes with the latest data, so they can make
  // their change again on top of it
  function loadLatestVersion() {
    if (!selectedDelivery) {
      return
    }

    openForm('edit', deliveryToDraft(selectedDelivery))
    setHasEditConflict(false)
  }

  return {
    deliveries,
    selectedId,
    selectedDelivery,
    isAdding,
    isEditing,
    draft,
    setDraft,
    selectDelivery,
    closeDetails,
    startAdding,
    startEditing,
    cancelForm: showDetails,
    save,
    discardDialog: {
      isOpen: pendingAction !== null,
      discard() {
        pendingAction?.()
        setPendingAction(null)
      },
      keepEditing() {
        setPendingAction(null)
      },
    },
    conflictDialog: {
      isOpen: hasEditConflict,
      saveMyVersion: saveEdit,
      loadLatestVersion,
      keepEditing() {
        setHasEditConflict(false)
      },
    },
  }
}
