import {
  Button,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components'
import { primaryButton, secondaryButton } from './styles.ts'

interface DiscardChangesDialogProps {
  isOpen: boolean
  onDiscard: () => void
  onKeepEditing: () => void
}

export function DiscardChangesDialog({
  isOpen,
  onDiscard,
  onKeepEditing,
}: DiscardChangesDialogProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable
      onOpenChange={(open) => {
        if (!open) {
          onKeepEditing()
        }
      }}
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40
        p-4"
    >
      <Modal className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <Dialog role="alertdialog" className="outline-none">
          <Heading slot="title" className="mb-2 text-xl font-bold">
            Discard unsaved changes?
          </Heading>
          <p className="mb-6">
            The changes you made to this delivery haven't been saved yet.
          </p>
          <div className="flex justify-end gap-2">
            <Button onPress={onKeepEditing} className={secondaryButton}>
              Keep editing
            </Button>
            <Button onPress={onDiscard} className={primaryButton}>
              Discard
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
