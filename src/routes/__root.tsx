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
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              TRACKER.CMS
            </span>
          </div>
          
          <nav className="space-y-1">
            <Link
              to="/"
              activeProps={{ className: 'bg-slate-800 text-teal-400 font-semibold' }}
              inactiveProps={{ className: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/companies"
              activeProps={{ className: 'bg-slate-800 text-teal-400 font-semibold' }}
              inactiveProps={{ className: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Companies
            </Link>
            <Link
              to="/board"
              activeProps={{ className: 'bg-slate-800 text-teal-400 font-semibold' }}
              inactiveProps={{ className: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Kanban Board
            </Link>
          </nav>
        </div>
        <div className="p-6 border-t border-slate-800 text-xs text-slate-500">
          Personal CMS v1.0.0
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-800">Job Search CMS</h1>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
