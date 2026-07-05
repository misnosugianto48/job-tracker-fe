import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: DashboardComponent,
})

function DashboardComponent() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Welcome to your Job Search CMS</h2>
        <p className="text-slate-600">
          Track company profiles, job applications, assessments, interview notes, and pipelines in one central place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-2">Relational Data</h3>
          <p className="text-sm text-slate-500">
            Decoupled structure connecting Companies, Applications, and Notes dynamically.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-2">Visual Pipeline</h3>
          <p className="text-sm text-slate-500">
            A Kanban-style board tracking stages from wishlist to offers and rejections.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-2">Dashboard Metrics</h3>
          <p className="text-sm text-slate-500">
            Key insights like conversion rates, stagnant applications, and upcoming interviews.
          </p>
        </div>
      </div>
    </div>
  )
}
