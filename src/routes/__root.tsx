import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-cream-50 text-choco-900 font-sans antialiased overflow-hidden">
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-choco-950/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-choco-900 text-cream-100 flex flex-col justify-between border-r border-choco-800 z-50 transform transition-transform duration-300 md:translate-x-0 md:static md:z-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between gap-3 mb-10 border-b border-choco-800 pb-6">
            <span className="text-xl font-serif font-extrabold tracking-widest text-cream-200">
              TRACKER.CMS
            </span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="text-choco-300 hover:text-cream-50 md:hidden p-1 rounded-md focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="space-y-2">
            <Link
              to="/"
              onClick={() => setIsSidebarOpen(false)}
              activeProps={{ className: 'bg-choco-800 text-cream-50 font-bold border-l-4 border-cream-200 pl-3' }}
              inactiveProps={{ className: 'text-choco-300 hover:text-cream-50 hover:bg-choco-800/50 pl-4' }}
              className="flex items-center gap-3 py-3 rounded-r-lg text-sm font-medium transition-all"
            >
              Dashboard
            </Link>
            <Link
              to="/companies"
              onClick={() => setIsSidebarOpen(false)}
              activeProps={{ className: 'bg-choco-800 text-cream-50 font-bold border-l-4 border-cream-200 pl-3' }}
              inactiveProps={{ className: 'text-choco-300 hover:text-cream-50 hover:bg-choco-800/50 pl-4' }}
              className="flex items-center gap-3 py-3 rounded-r-lg text-sm font-medium transition-all"
            >
              Companies
            </Link>
            <Link
              to="/board"
              onClick={() => setIsSidebarOpen(false)}
              activeProps={{ className: 'bg-choco-800 text-cream-50 font-bold border-l-4 border-cream-200 pl-3' }}
              inactiveProps={{ className: 'text-choco-300 hover:text-cream-50 hover:bg-choco-800/50 pl-4' }}
              className="flex items-center gap-3 py-3 rounded-r-lg text-sm font-medium transition-all"
            >
              Kanban Board
            </Link>
          </nav>
        </div>
        <div className="p-6 border-t border-choco-800 text-xs text-choco-400 font-semibold tracking-wider">
          EDITORIAL CMS v1.0.0
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-cream-50">
        <header className="h-16 border-b border-choco-100 bg-cream-100/50 backdrop-blur-md flex items-center justify-between px-6 md:px-8 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-choco-800 hover:text-choco-900 md:hidden p-1 rounded-md focus:outline-none"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-serif font-bold text-choco-800 italic">Job Search Editorial</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
