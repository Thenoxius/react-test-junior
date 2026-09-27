import { Button, Heading } from 'react-aria-components'
import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { DeliveryDetails } from '../components/DeliveryDetails.tsx'
import { DeliveryForm } from '../components/DeliveryForm.tsx'
import { DeliveryList } from '../components/DeliveryList.tsx'
import { panel, primaryButton } from '../components/styles.ts'
import { useDeliveryEditor } from '../hooks/useDeliveryEditor.ts'

export function Home() {
  const editor = useDeliveryEditor()

  // Details and form share this panel
  function renderPanel() {
    if (editor.isAdding) {
      return (
        <DeliveryForm
          heading="New delivery"
          draft={editor.draft}
          onDraftChange={editor.setDraft}
          onSave={editor.save}
          onCancel={editor.cancelForm}
        />
      )
    }

    if (editor.isEditing && editor.selectedDelivery) {
      return (
        <DeliveryForm
          heading={editor.selectedDelivery.name}
          deliveryId={editor.selectedDelivery.id}
          draft={editor.draft}
          onDraftChange={editor.setDraft}
          onSave={editor.save}
          onCancel={editor.cancelForm}
        />
      )
    }

    return (
      <DeliveryDetails
        delivery={editor.selectedDelivery}
        onEdit={editor.startEditing}
        onClose={editor.closeDetails}
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
        <Button onPress={editor.startAdding} className={primaryButton}>
          + Add delivery
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className={panel}>
          <DeliveryList
            deliveries={editor.deliveries}
            selectedId={editor.selectedId}
            onSelect={editor.selectDelivery}
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
        isOpen={editor.discardDialog.isOpen}
        heading="Discard unsaved changes?"
        message="The changes you made to this delivery haven't been saved yet."
        primaryLabel="Discard"
        onPrimary={editor.discardDialog.discard}
        secondaryLabel="Keep editing"
        onSecondary={editor.discardDialog.keepEditing}
        onDismiss={editor.discardDialog.keepEditing}
      />
      <ConfirmDialog
        isOpen={editor.conflictDialog.isOpen}
        heading="This delivery was changed while you were editing"
        message="Someone else updated this delivery after you started editing. Save your version to overwrite their change, or load the latest version and make your change again."
        primaryLabel="Save my version"
        onPrimary={editor.conflictDialog.saveMyVersion}
        secondaryLabel="Load latest version"
        onSecondary={editor.conflictDialog.loadLatestVersion}
        onDismiss={editor.conflictDialog.keepEditing}
      />
    </div>
  )
}
