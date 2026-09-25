import type { FormEvent } from 'react'
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  RadioButton,
  RadioField,
  RadioGroup,
  TextField,
} from 'react-aria-components'
import {
  DELIVERY_STATUSES,
  type DeliveryDraft,
  type DeliveryStatus,
  NAME_SEPARATOR,
} from '../utils/delivery.ts'
import {
  closeButton,
  fieldError,
  fieldGrid,
  fieldInput,
  fieldLabel,
  fieldRow,
  fieldValue,
  panelActions,
  panelHeader,
  panelHeading,
  primaryButton,
  secondaryButton,
} from './styles.ts'

interface DeliveryFormProps {
  heading: string
  // Undefined for a delivery that hasn't been saved yet
  deliveryId?: string
  draft: DeliveryDraft
  onDraftChange: (draft: DeliveryDraft) => void
  onSave: () => void
  onCancel: () => void
}

// Type and model are joined with the separator into one name, so the
// separator itself would break the name apart again later.
function validateNamePart(value: string) {
  if (value.includes(NAME_SEPARATOR)) {
    return `Can't contain "${NAME_SEPARATOR.trim()}" with spaces around it.`
  }

  return null
}

export function DeliveryForm({
  heading,
  deliveryId,
  draft,
  onDraftChange,
  onSave,
  onCancel,
}: DeliveryFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave()
  }

  return (
    <>
      <div className={panelHeader}>
        <h2 className={panelHeading}>{heading}</h2>
        <Button
          onPress={onCancel}
          aria-label="Close form"
          className={closeButton}
        >
          ✕
        </Button>
      </div>
      <Form onSubmit={handleSubmit}>
        <div className={fieldGrid}>
          <div className={fieldRow}>
            <span className={fieldLabel}>ID</span>
            <span className={fieldValue}>
              {deliveryId ?? (
                <span className="text-gray-600">Assigned when saved</span>
              )}
            </span>
          </div>

          <TextField
            isRequired
            value={draft.productType}
            onChange={(productType) => onDraftChange({ ...draft, productType })}
            validate={validateNamePart}
            className={fieldRow}
          >
            <Label className={fieldLabel}>Product type</Label>
            <Input className={fieldInput} />
            <FieldError className={fieldError} />
          </TextField>

          <TextField
            isRequired
            value={draft.productModel}
            onChange={(productModel) =>
              onDraftChange({ ...draft, productModel })
            }
            validate={validateNamePart}
            className={fieldRow}
          >
            <Label className={fieldLabel}>Product model</Label>
            <Input className={fieldInput} />
            <FieldError className={fieldError} />
          </TextField>

          <RadioGroup
            orientation="horizontal"
            value={draft.status}
            onChange={(status) =>
              onDraftChange({ ...draft, status: status as DeliveryStatus })
            }
            className={fieldRow}
          >
            <Label className={fieldLabel}>Status</Label>
            <div className={`${fieldValue} flex flex-wrap gap-x-4`}>
              {DELIVERY_STATUSES.map((status) => (
                <RadioField key={status} value={status}>
                  <RadioButton
                    className="flex cursor-pointer items-center gap-2
                      outline-none before:size-4 before:rounded-full
                      before:border before:border-gray-500
                      focus-visible:before:ring-2
                      focus-visible:before:ring-offroad-primary
                      selected:before:border-4
                      selected:before:border-offroad-primary"
                  >
                    {status}
                  </RadioButton>
                </RadioField>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className={panelActions}>
          <Button type="submit" className={primaryButton}>
            Save
          </Button>
          <Button onPress={onCancel} className={secondaryButton}>
            Cancel
          </Button>
        </div>
      </Form>
    </>
  )
}
