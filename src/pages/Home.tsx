import { Button, Heading } from 'react-aria-components'
import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { DeliveryDetails } from '../components/DeliveryDetails.tsx'
import { DeliveryForm } from '../components/DeliveryForm.tsx'
import { DeliveryList } from '../components/DeliveryList.tsx'
import { panel, primaryButton } from '../components/styles.ts'
import { useDeliveryEditor } from '../hooks/useDeliveryEditor.ts'

export function Home() {
  const editor = useDeliveryEditor()

  function renderForm() {
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
          heading={`Edit ${editor.selectedDelivery.name}`}
          deliveryId={editor.selectedDelivery.id}
          draft={editor.draft}
          onDraftChange={editor.setDraft}
          onSave={editor.save}
          onCancel={editor.cancelForm}
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
        <Button onPress={editor.startAdding} className={primaryButton}>
          + Add delivery
        </Button>
      </div>
      {/* LIST OF DELIVERIES | DELIVERY DETAILS | ADD/EDIT DELIVERY FORM */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-label="Deliveries" className={panel}>
          <DeliveryList
            deliveries={editor.deliveries}
            selectedId={editor.selectedId}
            onSelect={editor.selectDelivery}
          />
        </section>
        <section
          aria-label="Delivery details"
          className={`${panel} lg:sticky lg:top-6`}
        >
          <DeliveryDetails
            delivery={editor.selectedDelivery}
            onEdit={editor.startEditing}
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
