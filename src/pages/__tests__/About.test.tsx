import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { About } from '../About'

describe('About component', () => {
  it('renders heading, description text, and navigation link', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    )

    screen.getByRole('heading', {
      level: 1,
      name: 'About Offroad Package Delivery',
    })

    screen.getByText(/You are stuck in the jungle and you need new stationary/i)

    screen.getByText(/Normally you'd be in\.\.\.\.\. TROUBLE!!!!/i)

    screen.getByText(
      /But fear not, Offroad Package Delivery is here to save the day!/i
    )

    const homeLink = screen.getByRole('link', { name: /back to home/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('uses a React Aria link to go back home', () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    )

    // React Aria marks every element it renders with data-rac
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute(
      'data-rac'
    )
  })
})
