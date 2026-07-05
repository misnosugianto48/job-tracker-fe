import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="flex h-screen bg-cream-50 text-choco-900 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-choco-900 text-cream-100 flex flex-col justify-between border-r border-choco-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 border-b border-choco-800 pb-6">
            <span className="text-xl font-serif font-extrabold tracking-widest text-cream-200">
              TRACKER.CMS
            </span>
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
        <header className="h-16 border-b border-choco-100 bg-cream-100/50 backdrop-blur-md flex items-center justify-between px-8 shadow-xs">
          <h1 className="text-xl font-serif font-bold text-choco-800 italic">Job Search Editorial</h1>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
