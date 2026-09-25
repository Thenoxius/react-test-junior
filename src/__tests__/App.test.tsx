import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deliveriesSocketSubscribe } from '../api/data-socket.ts'
import { App } from '../App.tsx'
import { About } from '../pages/About.tsx'
import { Home } from '../pages/Home.tsx'
import { setupFakeSocket } from '../test/fakeSocket.ts'

vi.mock('../api/data-socket.ts')

function renderApp() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupFakeSocket()
  })

  it('uses React Aria links for the navigation', async () => {
    renderApp()
    await screen.findByRole('option', { name: 'Audio - Headphones' })

    // React Aria marks every element it renders with data-rac
    for (const name of ['Offroad Apps BV logo', 'Home', 'About']) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('data-rac')
    }
  })

  it('marks the current page in the navigation', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByRole('option', { name: 'Audio - Headphones' })

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveAttribute(
      'aria-current'
    )

    await user.click(screen.getByRole('link', { name: 'About' }))

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current'
    )
  })

  it('subscribes to the socket only once while navigating', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByRole('option', { name: 'Audio - Headphones' })

    await user.click(screen.getByRole('link', { name: 'About' }))
    await user.click(screen.getByRole('link', { name: 'Home' }))

    expect(
      await screen.findByRole('option', { name: 'Audio - Headphones' })
    ).toBeInTheDocument()
    expect(deliveriesSocketSubscribe).toHaveBeenCalledTimes(1)
  })
})
