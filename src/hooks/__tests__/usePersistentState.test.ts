import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePersistentState } from '../usePersistentState.ts'

describe('usePersistentState', () => {
  it('uses the initial value when nothing is stored', () => {
    const { result } = renderHook(() => usePersistentState('count', 1))

    expect(result.current[0]).toBe(1)
  })

  it('saves changes to localStorage', () => {
    const { result } = renderHook(() => usePersistentState('count', 1))

    act(() => result.current[1](5))

    expect(result.current[0]).toBe(5)
    expect(localStorage.getItem('count')).toBe('5')
  })

  it('loads a previously stored value', () => {
    localStorage.setItem('count', '42')

    const { result } = renderHook(() => usePersistentState('count', 1))

    expect(result.current[0]).toBe(42)
  })

  it('keeps working when localStorage is full or blocked', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      })
    const { result } = renderHook(() => usePersistentState('count', 1))

    act(() => result.current[1](5))

    expect(result.current[0]).toBe(5)
    setItem.mockRestore()
  })

  it('falls back to the initial value when the stored value is broken', () => {
    localStorage.setItem('count', '{not json')

    const { result } = renderHook(() => usePersistentState('count', 1))

    expect(result.current[0]).toBe(1)
  })
})
