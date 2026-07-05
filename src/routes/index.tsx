import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Calendar, CheckCircle2, ArrowRight, TrendingUp, XCircle, Briefcase } from 'lucide-react'

interface DashboardData {
  summary: {
    counts: {
      WISHLIST: number
      APPLIED: number
      ASSESSMENT: number
      INTERVIEW: number
      OFFERED: number
      REJECTED: number
    }
    active: number
    rejected: number
    offered: number
    total: number
    conversionRate: number
  }
  upcomingEvents: Array<{
    id: number
    title: string
    content: string
    type: 'GENERAL' | 'INTERVIEW' | 'ASSESSMENT' | 'FEEDBACK'
    eventDate: string
    application: {
      id: number
      jobTitle: string
      company: {
        name: string
      }
    }
  }>
  stagnantApplications: Array<{
    id: number
    jobTitle: string
    stage: 'WISHLIST' | 'APPLIED' | 'ASSESSMENT' | 'INTERVIEW' | 'OFFERED' | 'REJECTED'
    updatedAt: string
    company: {
      name: string
    }
  }>
}

export const Route = createFileRoute('/')({
  component: DashboardComponent,
})

const API_BASE = 'http://localhost:5000/api'

function DashboardComponent() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard`)
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      return res.json()
    },
    refetchInterval: 10000, // Refetch every 10 seconds to keep stats live
  })

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard metrics...</div>
  }

  if (isError || !data) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-md text-sm">
        Failed to load dashboard data. Make sure the backend server is running.
      </div>
    )
  }

  const { summary, upcomingEvents, stagnantApplications } = data

  // Format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDaysAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    return `${days} days ago`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Search Overview</h2>
        <p className="text-slate-500 mt-1">Real-time status of your active application funnel.</p>
      </div>

      {/* Analytical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Funnel</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{summary.active}</h3>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <Briefcase size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Offers Secured</p>
            <h3 className="text-2xl font-bold text-teal-600 mt-1">{summary.offered}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rejections</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{summary.rejected}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <XCircle size={20} />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex items-center justify-between hover:bg-slate-850 transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-450 text-slate-400">Conversion Rate</p>
            <h3 className="text-2xl font-bold text-teal-400 mt-1">{summary.conversionRate}%</h3>
          </div>
          <div className="p-3 bg-slate-800 text-teal-400 rounded-lg">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Stage Breakdown Progress report */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Application Funnel Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {(Object.keys(summary.counts) as Array<keyof typeof summary.counts>).map((stage) => {
            const count = summary.counts[stage]
            const total = summary.total || 1
            const pct = Math.round((count / total) * 100)
            return (
              <div key={stage} className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-500">{stage}</span>
                <div className="mt-2">
                  <div className="text-lg font-bold text-slate-800">{count}</div>
                  <div className="text-xxs text-slate-450 mt-0.5 text-slate-400">{pct}% of total</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events Widget */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Calendar className="text-teal-600" size={18} />
            <h3 className="text-lg font-bold text-slate-800">Upcoming Events (7 Days)</h3>
            <span className="ml-auto bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-semibold">
              {upcomingEvents.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {upcomingEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <Calendar size={36} className="mb-2 text-slate-300" />
                No interviews or assessments scheduled in the next 7 days.
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2 hover:bg-slate-100/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{event.application.company.name}</h4>
                      <p className="text-xs text-slate-500">{event.application.jobTitle}</p>
                    </div>
                    <span className={`text-xxs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      event.type === 'INTERVIEW' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                  <div className="text-xs text-teal-600 font-semibold flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(event.eventDate)}
                  </div>
                  <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 font-medium">
                    <div className="font-semibold text-slate-700">{event.title}</div>
                    <div className="text-slate-500 mt-0.5">{event.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stagnant Applications Widget */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <AlertCircle className="text-amber-500" size={18} />
            <h3 className="text-lg font-bold text-slate-800">Stagnant Applications (14+ Days)</h3>
            <span className="ml-auto bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-semibold">
              {stagnantApplications.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {stagnantApplications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <CheckCircle2 size={36} className="mb-2 text-emerald-350 text-emerald-500" />
                All applications are active and up to date!
              </div>
            ) : (
              stagnantApplications.map((app) => (
                <div key={app.id} className="p-4 bg-amber-50/30 rounded-lg border border-amber-100 flex items-center justify-between hover:bg-amber-50/50 transition-colors">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-800 text-sm">{app.company.name}</h4>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span>{app.jobTitle}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-xxs uppercase tracking-wider font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {app.stage}
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs font-semibold text-amber-600">Inactive {formatDaysAgo(app.updatedAt)}</div>
                    <Link
                      to="/board"
                      className="text-xxs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 justify-end"
                    >
                      Update <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
