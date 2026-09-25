import { describe, expect, it } from 'vitest'
import type { IDelivery } from '../../api/types.ts'
import {
  deliveryToDraft,
  draftToDelivery,
  getProductModel,
  getProductType,
  getStatus,
  isSameDraft,
} from '../delivery.ts'

const headphones: IDelivery = {
  id: '1',
  name: 'Audio - Noise-Cancelling Headphones',
  inTransit: true,
  delivered: false,
}

describe('delivery helpers', () => {
  it('splits the name into product type and model', () => {
    expect(getProductType(headphones)).toBe('Audio')
    expect(getProductModel(headphones)).toBe('Noise-Cancelling Headphones')
  })

  it('returns an empty model when the name has no separator', () => {
    const delivery = { ...headphones, name: 'Mystery box' }

    expect(getProductType(delivery)).toBe('Mystery box')
    expect(getProductModel(delivery)).toBe('')
  })

  it('turns the status booleans into a readable status', () => {
    const base = { ...headphones, inTransit: false, delivered: false }

    expect(getStatus(base)).toBe('New')
    expect(getStatus({ ...base, inTransit: true })).toBe('In transit')
    expect(getStatus({ ...base, delivered: true })).toBe('Delivered')
  })

  it('converts a delivery to a draft and back without changes', () => {
    const draft = deliveryToDraft(headphones)

    expect(draft).toEqual({
      productType: 'Audio',
      productModel: 'Noise-Cancelling Headphones',
      status: 'In transit',
    })
    expect(draftToDelivery('1', draft)).toEqual(headphones)
  })

  it('compares drafts field by field', () => {
    const draft = deliveryToDraft(headphones)

    expect(isSameDraft(draft, { ...draft })).toBe(true)
    expect(isSameDraft(draft, { ...draft, status: 'Delivered' })).toBe(false)
  })

  it('trims whitespace when building a delivery from a draft', () => {
    const delivery = draftToDelivery('2', {
      productType: '  Books ',
      productModel: ' Handbook  ',
      status: 'Delivered',
    })

    expect(delivery).toEqual({
      id: '2',
      name: 'Books - Handbook',
      inTransit: false,
      delivered: true,
    })
  })
})
