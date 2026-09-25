import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// State is persisted to localStorage, so tests must not leak into each other
afterEach(() => {
  localStorage.clear()
})
