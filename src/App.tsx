import type { ReactNode } from 'react'
import { Link, RouterProvider } from 'react-aria-components'
import { Outlet, useHref, useMatch, useNavigate } from 'react-router-dom'
import { DeliveriesProvider } from './context/DeliveriesProvider.tsx'

const linkFocus =
  'rounded outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2'

interface NavigationLinkProps {
  to: string
  children: ReactNode
}

// A React Aria link that marks itself as the current page, which React
// Router's NavLink used to do: bold and underlined, and aria-current for
// screen readers.
function NavigationLink({ to, children }: NavigationLinkProps) {
  const isCurrentPage = useMatch({ path: to, end: true }) !== null

  return (
    <Link
      href={to}
      aria-current={isCurrentPage ? 'page' : undefined}
      className={`${linkFocus} ${
        isCurrentPage ? 'font-semibold underline underline-offset-4' : ''
      }`}
    >
      {children}
    </Link>
  )
}

export function App() {
  const navigate = useNavigate()

  return (
    // Lets React Aria links navigate through React Router, without a
    // full page reload
    <RouterProvider navigate={navigate} useHref={useHref}>
      <div className="h-screen flex flex-col text-offroad-text">
        <header
          className="self-start flex flex-wrap items-center gap-6 p-4 bg-white
            w-full"
        >
          <Link href="/" className={linkFocus}>
            <img
              src="/Logo_Offroad-Apps-BV.png"
              alt="Offroad Apps BV logo"
              className="h-20"
            />
          </Link>

          <nav
            className="flex items-center gap-4 text-lg"
            aria-label="Main navigation"
          >
            <NavigationLink to="/">Home</NavigationLink>
            <NavigationLink to="/about">About</NavigationLink>
          </nav>
        </header>

        <main
          id="app"
          className="w-full px-4 bg-offroad-yellow text-offroad-text"
        >
          {/* Lives here, not in Home, so the socket stays subscribed while
              navigating between pages */}
          <DeliveriesProvider>
            <Outlet />
          </DeliveriesProvider>
        </main>
      </div>
    </RouterProvider>
  )
}

export default App
