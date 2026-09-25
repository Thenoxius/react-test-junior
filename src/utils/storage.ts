// localStorage can be blocked or full (private windows, strict settings).
// The app should keep working without it, so errors are swallowed here.

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const storedValue = localStorage.getItem(key)

    if (storedValue === null) {
      return fallback
    }

    return JSON.parse(storedValue) as T
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Nothing to do: the value just won't survive a refresh
  }
}
