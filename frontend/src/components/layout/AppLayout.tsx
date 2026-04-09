import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { FloatingWriteButton } from './FloatingWriteButton'

export const AppLayout = () => (
  <div className="flex h-screen flex-col">
    <Header />
    <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden bg-gray-50 shadow-xl">
      <TabBar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <FloatingWriteButton />
    </div>
  </div>
)
