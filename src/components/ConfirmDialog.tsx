import {
  Button,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components'
import { primaryButton, secondaryButton } from './styles.ts'

interface ConfirmDialogProps {
  isOpen: boolean
  heading: string
  message: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
  // Escape or a click outside the dialog
  onDismiss: () => void
}

export function ConfirmDialog({
  isOpen,
  heading,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onDismiss,
}: ConfirmDialogProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable
      onOpenChange={(open) => {
        if (!open) {
          onDismiss()
        }
      }}
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40
        p-4"
    >
      <Modal className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <Dialog role="alertdialog" className="outline-none">
          <Heading slot="title" className="mb-2 text-xl font-bold">
            {heading}
          </Heading>
          <p className="mb-6">{message}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button onPress={onSecondary} className={secondaryButton}>
              {secondaryLabel}
            </Button>
            <Button onPress={onPrimary} className={primaryButton}>
              {primaryLabel}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
