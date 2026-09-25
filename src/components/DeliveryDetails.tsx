import { Button, Heading } from 'react-aria-components'
import type { IDelivery } from '../api/types.ts'
import {
  getProductModel,
  getProductType,
  getStatus,
} from '../utils/delivery.ts'
import {
  closeButton,
  fieldGrid,
  fieldLabel,
  fieldRow,
  fieldValue,
  panelActions,
  panelHeader,
  panelHeading,
  primaryButton,
} from './styles.ts'

interface DeliveryDetailsProps {
  delivery: IDelivery | undefined
  onEdit: () => void
  onClose: () => void
}

export function DeliveryDetails({
  delivery,
  onEdit,
  onClose,
}: DeliveryDetailsProps) {
  if (!delivery) {
    return (
      <p className="text-gray-600">Select a delivery to see its details.</p>
    )
  }

  return (
    <>
      <div className={panelHeader}>
        <Heading level={2} className={panelHeading}>
          {delivery.name}
        </Heading>
        <Button
          onPress={onClose}
          aria-label="Close details"
          className={closeButton}
        >
          ✕
        </Button>
      </div>
      <dl className={fieldGrid}>
        <div className={fieldRow}>
          <dt className={fieldLabel}>ID</dt>
          <dd className={fieldValue}>{delivery.id}</dd>
        </div>
        <div className={fieldRow}>
          <dt className={fieldLabel}>Product type</dt>
          <dd className={fieldValue}>{getProductType(delivery)}</dd>
        </div>
        <div className={fieldRow}>
          <dt className={fieldLabel}>Product model</dt>
          <dd className={fieldValue}>{getProductModel(delivery)}</dd>
        </div>
        <div className={fieldRow}>
          <dt className={fieldLabel}>Status</dt>
          <dd className={fieldValue}>{getStatus(delivery)}</dd>
        </div>
      </dl>
      <div className={panelActions}>
        <Button onPress={onEdit} className={primaryButton}>
          Edit delivery
        </Button>
      </div>
    </>
  )
}
