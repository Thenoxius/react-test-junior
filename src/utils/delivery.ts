import type { IDelivery } from '../api/types.ts'

// A delivery name looks like "Audio - Noise-Cancelling Headphones"
export const NAME_SEPARATOR = ' - '

export const DELIVERY_STATUSES = ['New', 'In transit', 'Delivered'] as const

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]

// The values of the add/edit form, which can be half filled in
export interface DeliveryDraft {
  productType: string
  productModel: string
  status: DeliveryStatus
}

export const EMPTY_DRAFT: DeliveryDraft = {
  productType: '',
  productModel: '',
  status: 'New',
}

export function getProductType(delivery: IDelivery) {
  const nameParts = delivery.name.split(NAME_SEPARATOR)
  return nameParts[0]
}

export function getProductModel(delivery: IDelivery) {
  const nameParts = delivery.name.split(NAME_SEPARATOR)
  return nameParts[1] ?? ''
}

export function getStatus(delivery: IDelivery): DeliveryStatus {
  if (delivery.delivered) {
    return 'Delivered'
  }

  if (delivery.inTransit) {
    return 'In transit'
  }

  return 'New'
}

export function deliveryToDraft(delivery: IDelivery): DeliveryDraft {
  return {
    productType: getProductType(delivery),
    productModel: getProductModel(delivery),
    status: getStatus(delivery),
  }
}

export function isSameDraft(first: DeliveryDraft, second: DeliveryDraft) {
  return (
    first.productType === second.productType &&
    first.productModel === second.productModel &&
    first.status === second.status
  )
}

export function draftToDelivery(id: string, draft: DeliveryDraft): IDelivery {
  const productType = draft.productType.trim()
  const productModel = draft.productModel.trim()

  return {
    id,
    name: productType + NAME_SEPARATOR + productModel,
    inTransit: draft.status === 'In transit',
    delivered: draft.status === 'Delivered',
  }
}
