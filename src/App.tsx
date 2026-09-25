import { NavLink, Outlet } from 'react-router-dom'
import { DeliveriesProvider } from './context/DeliveriesProvider.tsx'

export function App() {
  return (
    <div className="h-screen flex flex-col text-offroad-text">
      <header
        className="self-start flex flex-wrap items-center gap-6 p-4 bg-white
          w-full"
      >
        <NavLink to="/">
          <img
            src="/Logo_Offroad-Apps-BV.png"
            alt="Offroad Apps BV logo"
            className="h-20"
          />
        </NavLink>

        <nav
          className="flex items-center gap-4 text-lg"
          aria-label="Main navigation"
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'font-semibold underline underline-offset-4' : ''
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? 'font-semibold underline underline-offset-4' : ''
            }
          >
            About
          </NavLink>
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
  )
}

export default App
