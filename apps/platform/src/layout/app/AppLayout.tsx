import { Outlet } from '@tanstack/react-router'

import { Footer } from './components/Footer'
import { Header } from './components/Header'

export const AppLayout = () => (
  <>
    <Header />
    <div className="layout-section isolate min-h-0 flex-1 overflow-x-hidden p-0!">
      <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden pt-4 pb-12 lg:ml-78">
        <Outlet />
      </main>
    </div>
    <Footer />
  </>
)
