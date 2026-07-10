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
  salaryAnalytics?: {
    average: number
    min: number
    max: number
    totalPipelineValue: number
  }
}

export const Route = createFileRoute('/')({
  component: DashboardComponent,
})

import { API_BASE, apiFetch, friendlyError } from '../lib/api'

function DashboardComponent() {
  const { data, isLoading, isError, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      return apiFetch<DashboardData>(`${API_BASE}/dashboard`)
    },
    refetchInterval: 10000, // Refetch every 10 seconds to keep stats live
  })

  if (isLoading) {
    return <div className="p-8 text-center text-choco-500 font-serif italic">Loading dashboard metrics...</div>
  }

  if (isError || !data) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-md text-sm">
        {friendlyError(error) || 'Could not load dashboard data. The server may be temporarily unavailable.'}
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
      <div className="border-b border-choco-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-extrabold text-choco-900 tracking-tight">Search Overview</h2>
          <p className="text-choco-600 mt-1">Real-time status of your active application funnel.</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`${API_BASE}/export?format=json`}
            download="job_tracker_backup.json"
            className="px-4 py-2 text-xs font-bold rounded-lg border border-choco-300 text-choco-700 bg-white hover:bg-cream-50 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            Export Backup (JSON)
          </a>
          <a
            href={`${API_BASE}/export?format=csv`}
            download="job_tracker_backup.csv"
            className="px-4 py-2 text-xs font-bold rounded-lg border border-choco-850 bg-choco-900 text-cream-100 hover:bg-choco-800 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Analytical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-choco-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-choco-400">Active Funnel</p>
            <h3 className="text-3xl font-serif font-bold text-choco-800 mt-1">{summary.active}</h3>
          </div>
          <div className="p-3 bg-cream-100 text-choco-700 rounded-lg">
            <Briefcase size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-choco-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-choco-400">Offers Secured</p>
            <h3 className="text-3xl font-serif font-bold text-emerald-800 mt-1">{summary.offered}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-choco-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-choco-400">Rejections</p>
            <h3 className="text-3xl font-serif font-bold text-choco-800 mt-1">{summary.rejected}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <XCircle size={20} />
          </div>
        </div>

        <div className="bg-choco-900 p-6 rounded-xl border border-choco-850 shadow-sm flex items-center justify-between hover:bg-choco-800 transition-colors">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-choco-300">Conversion Rate</p>
            <h3 className="text-3xl font-serif font-bold text-cream-200 mt-1">{summary.conversionRate}%</h3>
          </div>
          <div className="p-3 bg-choco-800 text-cream-200 rounded-lg">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Stage Breakdown Progress report */}
      <div className="bg-white p-6 rounded-xl border border-choco-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-choco-400 font-serif">Application Funnel Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {(Object.keys(summary.counts) as Array<keyof typeof summary.counts>).map((stage) => {
            const count = summary.counts[stage]
            const total = summary.total || 1
            const pct = Math.round((count / total) * 100)
            return (
              <div key={stage} className="bg-cream-50/50 p-4 rounded-lg border border-choco-50 flex flex-col justify-between">
                <span className="text-xs font-bold text-choco-600">{stage}</span>
                <div className="mt-2">
                  <div className="text-xl font-serif font-bold text-choco-900">{count}</div>
                  <div className="text-xxs text-choco-400 mt-0.5 font-medium">{pct}% of total</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Salary Insights Widget */}
      {data.salaryAnalytics && (
        <div className="bg-white p-6 rounded-xl border border-choco-100 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-choco-400 font-serif">Salary Insights & Pipeline Value</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-cream-50/50 p-4 rounded-lg border border-choco-50 flex flex-col justify-between">
              <span className="text-xs font-bold text-choco-600">Average Expected Salary</span>
              <div className="text-2xl font-serif font-bold text-choco-900 mt-2">
                {data.salaryAnalytics.average > 0 ? `Rp ${data.salaryAnalytics.average.toLocaleString('id-ID')}` : 'Rp 0'}
              </div>
            </div>
            <div className="bg-cream-50/50 p-4 rounded-lg border border-choco-50 flex flex-col justify-between">
              <span className="text-xs font-bold text-choco-600">Minimum Expected Salary</span>
              <div className="text-2xl font-serif font-bold text-choco-900 mt-2">
                {data.salaryAnalytics.min > 0 ? `Rp ${data.salaryAnalytics.min.toLocaleString('id-ID')}` : 'Rp 0'}
              </div>
            </div>
            <div className="bg-cream-50/50 p-4 rounded-lg border border-choco-50 flex flex-col justify-between">
              <span className="text-xs font-bold text-choco-600">Maximum Expected Salary</span>
              <div className="text-2xl font-serif font-bold text-choco-900 mt-2">
                {data.salaryAnalytics.max > 0 ? `Rp ${data.salaryAnalytics.max.toLocaleString('id-ID')}` : 'Rp 0'}
              </div>
            </div>
            <div className="bg-choco-900 p-4 rounded-lg border border-choco-850 flex flex-col justify-between">
              <span className="text-xs font-bold text-choco-300">Total Pipeline Value</span>
              <div className="text-2xl font-serif font-bold text-cream-200 mt-2">
                {data.salaryAnalytics.totalPipelineValue > 0 ? `Rp ${data.salaryAnalytics.totalPipelineValue.toLocaleString('id-ID')}` : 'Rp 0'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events Widget */}
        <div className="bg-white p-6 rounded-xl border border-choco-100 shadow-sm flex flex-col h-[420px]">
          <div className="flex items-center gap-2 border-b border-choco-100 pb-3 mb-4">
            <Calendar className="text-choco-600" size={18} />
            <h3 className="text-lg font-serif font-bold text-choco-900">Upcoming Events (7 Days)</h3>
            <span className="ml-auto bg-choco-100 text-choco-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {upcomingEvents.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {upcomingEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-choco-400 text-sm font-serif italic text-center p-6">
                <Calendar size={36} className="mb-2 text-choco-200" />
                No interviews or assessments scheduled in the next 7 days.
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 bg-cream-50/30 rounded-lg border border-choco-100/50 space-y-2 hover:bg-cream-50/60 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-serif font-bold text-choco-900 text-sm leading-tight">{event.application.company.name}</h4>
                      <p className="text-xs text-choco-600 font-medium">{event.application.jobTitle}</p>
                    </div>
                    <span className={`text-xxs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      event.type === 'INTERVIEW' ? 'bg-indigo-50 text-indigo-850' : 'bg-amber-50 text-amber-850'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                  <div className="text-xs text-choco-600 font-bold flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(event.eventDate)}
                  </div>
                  <div className="text-xs text-choco-750 bg-white p-2.5 rounded border border-choco-100/50 font-medium leading-relaxed">
                    <div className="font-serif font-bold text-choco-900">{event.title}</div>
                    <div className="text-choco-600 mt-0.5">{event.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stagnant Applications Widget */}
        <div className="bg-white p-6 rounded-xl border border-choco-100 shadow-sm flex flex-col h-[420px]">
          <div className="flex items-center gap-2 border-b border-choco-100 pb-3 mb-4">
            <AlertCircle className="text-choco-600" size={18} />
            <h3 className="text-lg font-serif font-bold text-choco-900">Stagnant Applications (14+ Days)</h3>
            <span className="ml-auto bg-choco-100 text-choco-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {stagnantApplications.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {stagnantApplications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-choco-400 text-sm font-serif italic text-center p-6">
                <CheckCircle2 size={36} className="mb-2 text-emerald-600" />
                All applications are active and up to date!
              </div>
            ) : (
              stagnantApplications.map((app) => (
                <div key={app.id} className="p-4 bg-cream-50/40 rounded-lg border border-choco-100/60 flex items-center justify-between hover:bg-cream-50/70 transition-colors">
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-choco-900 text-sm">{app.company.name}</h4>
                    <div className="text-xs text-choco-600 flex items-center gap-1.5 font-medium">
                      <span>{app.jobTitle}</span>
                      <span className="w-1 h-1 rounded-full bg-choco-200"></span>
                      <span className="text-xxs uppercase tracking-wider font-bold text-choco-700 bg-cream-100 px-1.5 py-0.5 rounded">
                        {app.stage}
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs font-bold text-choco-500">Inactive {formatDaysAgo(app.updatedAt)}</div>
                    <Link
                      to="/board"
                      className="text-xxs font-bold text-choco-600 hover:text-choco-800 flex items-center gap-0.5 justify-end underline transition-colors"
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
