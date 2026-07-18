import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { LayoutDashboard, Building, Columns } from 'lucide-react'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="flex h-screen bg-cream-50 text-choco-900 font-sans antialiased overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 bg-choco-900 text-cream-100 flex-col justify-between border-r border-choco-800 shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-10 border-b border-choco-800 pb-6">
            <Link to="/" className="flex items-center justify-start w-full transition-transform duration-250 hover:scale-[1.03]">
              <img 
                src="/jobtracker-logo.png" 
                alt="JobTracker" 
                className="h-10 w-auto object-contain max-w-full rounded-xl border border-choco-700/50 shadow-sm" 
              />
            </Link>
          </div>
          
          <nav className="space-y-2">
            <Link
              to="/"
              activeProps={{ className: 'bg-choco-800 text-cream-50 font-bold border-l-4 border-cream-200 pl-3' }}
              inactiveProps={{ className: 'text-choco-300 hover:text-cream-50 hover:bg-choco-800/50 pl-4' }}
              className="flex items-center gap-3 py-3 rounded-r-lg text-sm font-medium transition-all"
            >
              Dashboard
            </Link>
            <Link
              to="/companies"
              activeProps={{ className: 'bg-choco-800 text-cream-50 font-bold border-l-4 border-cream-200 pl-3' }}
              inactiveProps={{ className: 'text-choco-300 hover:text-cream-50 hover:bg-choco-800/50 pl-4' }}
              className="flex items-center gap-3 py-3 rounded-r-lg text-sm font-medium transition-all"
            >
              Companies
            </Link>
            <Link
              to="/board"
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
            <Link to="/" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-90">
              <img 
                src="/jobtracker-logo.png" 
                alt="JobTracker" 
                className="h-8 w-auto object-contain md:hidden rounded-lg border border-choco-100 shadow-xs" 
              />
              <h1 className="text-lg md:text-xl font-serif font-bold text-choco-800 italic">Career Journal CMS</h1>
            </Link>
          </div>
        </header>

        {/* Scrollable Container with bottom padding for mobile layout */}
        <div className="flex-1 overflow-auto p-4 pb-24 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-choco-900 border-t border-choco-800 text-cream-100 flex items-center justify-around z-40 md:hidden shadow-lg">
        <Link
          to="/"
          activeProps={{ className: 'text-cream-200 font-bold scale-105' }}
          inactiveProps={{ className: 'text-choco-300' }}
          className="flex flex-col items-center gap-1 py-1.5 transition-all text-[10px] font-medium w-full"
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/companies"
          activeProps={{ className: 'text-cream-200 font-bold scale-105' }}
          inactiveProps={{ className: 'text-choco-300' }}
          className="flex flex-col items-center gap-1 py-1.5 transition-all text-[10px] font-medium w-full"
        >
          <Building size={20} />
          <span>Companies</span>
        </Link>
        <Link
          to="/board"
          activeProps={{ className: 'text-cream-200 font-bold scale-105' }}
          inactiveProps={{ className: 'text-choco-300' }}
          className="flex flex-col items-center gap-1 py-1.5 transition-all text-[10px] font-medium w-full"
        >
          <Columns size={20} />
          <span>Board</span>
        </Link>
      </nav>
    </div>
  )
}
