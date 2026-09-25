import { useEffect, useState } from 'react'
import { loadFromStorage, saveToStorage } from '../utils/storage.ts'

// Works like useState, but the value is kept in localStorage so it
// survives a page refresh.
export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() =>
    loadFromStorage(key, initialValue)
  )

  useEffect(() => {
    saveToStorage(key, value)
  }, [key, value])

  return [value, setValue] as const
}
