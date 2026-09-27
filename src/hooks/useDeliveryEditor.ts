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

type FormMode = 'closed' | 'add' | 'edit'

// Everything the Home page can do with deliveries: selecting, adding and
// editing. The state is persisted, so a refresh keeps the selection and a
// half-filled form.
export function useDeliveryEditor() {
  const { deliveries, addDelivery, updateDelivery } = useDeliveries()

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

  // Look up by id so the details reflect live socket updates
  const selectedDelivery = deliveries.find(
    (delivery) => delivery.id === selectedId
  )

  const isAdding = formMode === 'add'
  // The edit form belongs to the selected delivery
  const isEditing = formMode === 'edit' && selectedDelivery !== undefined
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

  function openForm(mode: FormMode, values: DeliveryDraft) {
    setDraft(values)
    setOriginalDraft(values)
    setFormMode(mode)
  }

  function closeForm() {
    setFormMode('closed')
  }

  function selectDelivery(id: string) {
    // A new delivery being added has nothing to do with the selection, so
    // the add form stays open while browsing
    if (!isEditing) {
      setSelectedId(id)
      return
    }

    // The edit form belongs to the selected delivery, so it closes with it
    confirmDiscard(() => {
      closeForm()
      setSelectedId(id)
    })
  }

  function startAdding() {
    confirmDiscard(() => openForm('add', EMPTY_DRAFT))
  }

  function startEditing() {
    if (!selectedDelivery) {
      return
    }

    const currentValues = deliveryToDraft(selectedDelivery)
    confirmDiscard(() => openForm('edit', currentValues))
  }

  function save() {
    if (isAdding) {
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
    closeForm()
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
    startAdding,
    startEditing,
    cancelForm: closeForm,
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
