/**
 * 📚 LEARNER'S NOTE:
 * This component renders the main Kanban board pipeline for job applications.
 * It manages application states, drag-and-drop progression, inline editing of resume versions,
 * task checklists, and uses Zod schemas to validate data inputs before API submission.
 */

import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Calendar, Trash2, Link2, DollarSign, Building, AlertCircle, X } from 'lucide-react'
import { z } from 'zod'

interface Company {
  id: number
  name: string
}

interface Note {
  id: number
  title: string
  content: string
  type: 'GENERAL' | 'INTERVIEW' | 'ASSESSMENT' | 'FEEDBACK'
  eventDate: string | null
  createdAt: string
}

interface Todo {
  id: number
  applicationId: number
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

interface Application {
  id: number
  companyId: number
  company: Company
  jobTitle: string
  dateApplied: string | null
  source: string | null
  postingUrl: string | null
  expectedSalary: number | null
  stage: 'WISHLIST' | 'APPLIED' | 'ASSESSMENT' | 'INTERVIEW' | 'OFFERED' | 'REJECTED'
  resumeVersion: string | null
  notes?: Note[]
  todos?: Todo[]
  createdAt: string
  updatedAt: string
}

export const Route = createFileRoute('/board')({
  component: KanbanBoardComponent,
})

import { API_BASE, apiFetch, friendlyError } from '../lib/api'
const STAGES = ['WISHLIST', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFERED', 'REJECTED'] as const
type StageType = typeof STAGES[number]

function KanbanBoardComponent() {
  const queryClient = useQueryClient()
  
  // State for modals and panels
  const [isAddAppOpen, setIsAddAppOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null)
  const [activeMobileStage, setActiveMobileStage] = useState<StageType>('WISHLIST')
  const [searchQuery, setSearchQuery] = useState('')
  
  // New application form state
  const [newCompanyId, setNewCompanyId] = useState('')
  const [newJobTitle, setNewJobTitle] = useState('')
  const [newDateApplied, setNewDateApplied] = useState('')
  const [newSource, setNewSource] = useState('')
  const [newPostingUrl, setNewPostingUrl] = useState('')
  const [newExpectedSalary, setNewExpectedSalary] = useState('')
  const [newStage, setNewStage] = useState<StageType>('WISHLIST')
  const [newResumeVersion, setNewResumeVersion] = useState('')

  // Todo title state
  const [newTodoTitle, setNewTodoTitle] = useState('')

  // New Note form state
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState<'GENERAL' | 'INTERVIEW' | 'ASSESSMENT' | 'FEEDBACK'>('GENERAL')
  const [noteEventDate, setNoteEventDate] = useState('')

  // Queries
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      return apiFetch<Company[]>(`${API_BASE}/companies`)
    },
  })

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      return apiFetch<Application[]>(`${API_BASE}/applications`)
    },
  })

  // Detailed single application query (when panel is open)
  const { data: selectedApplication } = useQuery<Application>({
    queryKey: ['applications', selectedAppId],
    queryFn: async () => {
      return apiFetch<Application>(`${API_BASE}/applications/${selectedAppId}`)
    },
    enabled: selectedAppId !== null,
  })

  // Mutations
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<Application>) => {
      return apiFetch(`${API_BASE}/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['applications', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Application updated')
    },
    onError: (err) => {
      toast.error(friendlyError(err))
    },
  })

  const createTodoMutation = useMutation({
    mutationFn: async ({ appId, title }: { appId: number; title: string }) => {
      return apiFetch(`${API_BASE}/applications/${appId}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', selectedAppId] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Task added')
    },
    onError: (err) => {
      toast.error(friendlyError(err))
    },
  })

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, completed, title }: { id: number; completed?: boolean; title?: string }) => {
      return apiFetch(`${API_BASE}/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed, title }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', selectedAppId] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (err) => {
      toast.error(friendlyError(err))
    },
  })

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`${API_BASE}/todos/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', selectedAppId] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Task deleted')
    },
    onError: (err) => {
      toast.error(friendlyError(err))
    },
  })

  const createAppMutation = useMutation({
    mutationFn: async (newApp: any) => {
      return apiFetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Application created')
      setIsAddAppOpen(false)
      // reset form
      setNewCompanyId('')
      setNewJobTitle('')
      setNewDateApplied('')
      setNewSource('')
      setNewPostingUrl('')
      setNewExpectedSalary('')
      setNewStage('WISHLIST')
      setNewResumeVersion('')
    },
    onError: (err) => {
      toast.error(friendlyError(err))
    },
  })

  const deleteAppMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`${API_BASE}/applications/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Application deleted')
      setSelectedAppId(null)
    },
    onError: (err) => {
      toast.error(friendlyError(err))
    },
  })

  const createNoteMutation = useMutation({
    mutationFn: async (newNote: any) => {
      return apiFetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', selectedAppId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Note added')
      setNoteTitle('')
      setNoteContent('')
      setNoteType('GENERAL')
      setNoteEventDate('')
    },
    onError: (err) => {
      toast.error(friendlyError(err))
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return apiFetch(`${API_BASE}/notes/${noteId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', selectedAppId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Note deleted')
    },
    onError: (err) => {
      toast.error(friendlyError(err))
    },
  })

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStage: StageType) => {
    e.preventDefault()
    const id = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (!isNaN(id)) {
      updateApplicationMutation.mutate({ id, stage: targetStage })
    }
  }

  // Zod form validation schema
  const applicationFormSchema = z.object({
    companyId: z.number().int('Please select a company'),
    jobTitle: z.string().trim().min(1, 'Job title is required'),
    dateApplied: z.string().nullable().optional(),
    source: z.string().trim().nullable().optional(),
    postingUrl: z.string().trim().url('Job posting must be a valid URL').or(z.literal('')).nullable().optional(),
    expectedSalary: z.number().int().nonnegative().nullable().optional(),
    stage: z.enum(['WISHLIST', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFERED', 'REJECTED']),
    resumeVersion: z.string().trim().nullable().optional(),
  })

  // Handle application submit
  const handleCreateAppSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCompanyId) {
      toast.error('Please select a target company')
      return
    }

    const rawData = {
      companyId: parseInt(newCompanyId, 10),
      jobTitle: newJobTitle.trim(),
      dateApplied: newDateApplied || null,
      source: newSource.trim() || null,
      postingUrl: newPostingUrl.trim() || null,
      expectedSalary: newExpectedSalary ? parseInt(newExpectedSalary, 10) : null,
      stage: newStage,
      resumeVersion: newResumeVersion.trim() || null,
    }

    const validation = applicationFormSchema.safeParse(rawData)
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    createAppMutation.mutate(validation.data)
  }

  // Handle note submit
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppId || !noteTitle.trim() || !noteContent.trim()) return

    createNoteMutation.mutate({
      applicationId: selectedAppId,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      type: noteType,
      eventDate: noteEventDate || null,
    })
  }

  // Helper to check if stagnant
  const isStagnant = (updatedAtStr: string, stage: StageType) => {
    if (stage === 'OFFERED' || stage === 'REJECTED') return false
    const diff = Date.now() - new Date(updatedAtStr).getTime()
    const days = diff / (1000 * 60 * 60 * 24)
    return days >= 14
  }

  // Filtered applications by search query
  const filteredApplications = applications?.filter((app) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      app.company.name.toLowerCase().includes(query) ||
      app.jobTitle.toLowerCase().includes(query) ||
      (app.source && app.source.toLowerCase().includes(query))
    )
  }) || []

  return (
    <div className="h-full flex flex-col space-y-4 md:space-y-6">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-choco-200 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-extrabold text-choco-900 tracking-tight">Application Pipeline</h2>
          <p className="text-choco-600 mt-1 text-xs md:text-sm">Manage and status track application stages.</p>
        </div>
        <button
          onClick={() => setIsAddAppOpen(true)}
          className="bg-choco-800 hover:bg-choco-750 text-cream-50 font-bold text-xs md:text-sm px-4.5 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Plus size={16} /> New Application
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-choco-100/60 shadow-xs">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications by company, title, or source..."
            className="w-full px-4 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20 focus:border-choco-500 transition-all duration-200"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 text-xs font-bold text-choco-700 bg-cream-100 hover:bg-cream-200 rounded-lg transition-colors cursor-pointer"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Mobile Stage Selector Dropdown (visible only on mobile) */}
      <div className="md:hidden">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-choco-500 mb-1">
          Active Pipeline Stage:
        </label>
        <select
          value={activeMobileStage}
          onChange={(e) => setActiveMobileStage(e.target.value as StageType)}
          className="w-full px-3 py-2.5 border border-choco-200 bg-white rounded-lg text-sm text-choco-950 font-serif font-bold focus:outline-none focus:ring-2 focus:ring-choco-500/20 focus:border-choco-500"
        >
          {STAGES.map((s) => {
            const stageApps = filteredApplications.filter((app) => app.stage === s)
            return (
              <option key={s} value={s}>
                {s} ({stageApps.length} applications)
              </option>
            )
          })}
        </select>
      </div>

      {/* Board Layout */}
      {isLoading ? (
        <div className="p-8 text-center text-choco-500 flex-1 flex items-center justify-center font-serif italic">
          Loading kanban pipeline...
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto flex gap-6 pb-6 items-start h-[calc(100vh-230px)] md:h-[calc(100vh-190px)] min-h-[400px]">
          {STAGES.map((stage) => {
            const stageApps = filteredApplications.filter((app) => app.stage === stage)
            const isVisible = activeMobileStage === stage
            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className={`w-full md:w-80 flex-shrink-0 bg-cream-100/60 rounded-xl border border-choco-100/80 flex flex-col max-h-full ${
                  isVisible ? 'flex' : 'hidden md:flex'
                }`}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-choco-100 flex justify-between items-center bg-cream-100 rounded-t-xl">
                  <span className="text-xs font-serif font-bold uppercase tracking-wider text-choco-850">{stage}</span>
                  <span className="bg-choco-100 text-choco-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {stageApps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageApps.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-xs text-choco-400 border-2 border-dashed border-choco-200/55 rounded-lg bg-cream-50/30">
                      Empty column
                    </div>
                  ) : (
                    stageApps.map((app) => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => setSelectedAppId(app.id)}
                        className="bg-white p-4 rounded-lg border border-choco-100/60 shadow-xs hover:border-choco-300 hover:shadow-md cursor-pointer transition-all space-y-3 relative group"
                      >
                        {isStagnant(app.updatedAt, app.stage) && (
                          <div className="absolute top-3.5 right-3.5 text-amber-600 flex items-center gap-0.5" title="Stagnant: No update in 14 days">
                            <AlertCircle size={14} />
                          </div>
                        )}
                        <div>
                          <h4 className="font-serif font-bold text-choco-900 text-base leading-tight tracking-tight">{app.company.name}</h4>
                          <p className="text-xs text-choco-600 font-medium">{app.jobTitle}</p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {app.source && (
                            <span className="text-xxs font-semibold bg-cream-100 text-choco-700 px-2 py-0.5 rounded">
                              {app.source}
                            </span>
                          )}
                          {app.resumeVersion && (
                            <span className="text-xxs font-semibold bg-choco-55 bg-choco-50 text-choco-700 border border-choco-100 px-2 py-0.5 rounded">
                              CV: {app.resumeVersion}
                            </span>
                          )}
                          {app.expectedSalary && (
                            <span className="text-xxs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded flex items-center">
                              <DollarSign size={10} />
                              {app.expectedSalary.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {app.dateApplied && (
                          <div className="text-xxs text-choco-400 font-semibold flex items-center gap-1">
                            <Calendar size={10} />
                            Applied: {new Date(app.dateApplied).toLocaleDateString()}
                          </div>
                        )}

                        {/* Mobile Quick-stage Selection Select element */}
                        <div className="md:hidden pt-2.5 border-t border-choco-100 mt-2">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-choco-500 mb-1">
                            Quick Move Status:
                          </label>
                          <select
                            value={app.stage}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateApplicationMutation.mutate({ id: app.id, stage: e.target.value as StageType })
                            }}
                            className="w-full px-2 py-1.5 bg-cream-50/50 border border-choco-200 rounded text-xxs text-choco-900 font-bold focus:outline-none focus:border-choco-500"
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Side Panel: Application Detail / Timeline */}
      {selectedAppId && (
        <div className="fixed inset-0 bg-choco-950/45 backdrop-blur-xs flex justify-end z-50 transition-opacity">
          <div className="w-full sm:w-[520px] bg-white h-full shadow-2xl flex flex-col animate-slide-in relative border-l border-choco-100">
            <button
              onClick={() => setSelectedAppId(null)}
              className="absolute top-6 right-6 text-choco-400 hover:text-choco-700 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {selectedApplication ? (
              <div className="flex flex-col h-full overflow-hidden p-6 sm:p-8 space-y-6">
                {/* Panel Header */}
                <div className="border-b border-choco-100 pb-5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-choco-600 uppercase tracking-widest font-serif">
                    <Building size={14} /> {selectedApplication.company.name}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-extrabold text-choco-900 leading-tight">{selectedApplication.jobTitle}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Interactive Stage selector in detail panel */}
                    <select
                      value={selectedApplication.stage}
                      onChange={(e) => {
                        updateApplicationMutation.mutate({ id: selectedApplication.id, stage: e.target.value as StageType })
                      }}
                      className="bg-cream-100 text-choco-900 px-2.5 py-1 border border-choco-200 rounded font-bold uppercase tracking-wider text-xxs focus:outline-none focus:border-choco-500 cursor-pointer"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          STAGE: {s}
                        </option>
                      ))}
                    </select>
                    {selectedApplication.source && (
                      <span className="bg-cream-50 text-choco-600 px-2 py-0.5 rounded font-medium text-xxs">
                        Source: {selectedApplication.source}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-cream-50/50 p-4 rounded-xl border border-choco-100/50">
                  {selectedApplication.dateApplied && (
                    <div>
                      <span className="text-choco-400 block font-bold uppercase tracking-wider text-xxs">Date Applied</span>
                      <span className="font-semibold text-choco-800">{new Date(selectedApplication.dateApplied).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedApplication.expectedSalary && (
                    <div>
                      <span className="text-choco-400 block font-bold uppercase tracking-wider text-xxs">Expected Salary</span>
                      <span className="font-semibold text-choco-800">${selectedApplication.expectedSalary.toLocaleString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-choco-400 block font-bold uppercase tracking-wider text-xxs">Resume/CV Version</span>
                    <input
                      type="text"
                      key={selectedApplication.id}
                      defaultValue={selectedApplication.resumeVersion || ''}
                      placeholder="e.g. v1.0-swe"
                      onBlur={(e) => {
                        const val = e.target.value.trim()
                        if (val !== (selectedApplication.resumeVersion || '')) {
                          updateApplicationMutation.mutate({ id: selectedApplication.id, resumeVersion: val || null })
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim()
                          if (val !== (selectedApplication.resumeVersion || '')) {
                            updateApplicationMutation.mutate({ id: selectedApplication.id, resumeVersion: val || null })
                            ;(e.target as HTMLInputElement).blur()
                          }
                        }
                      }}
                      className="mt-0.5 w-full bg-transparent font-semibold text-choco-800 border-b border-transparent hover:border-choco-300 focus:border-choco-500 focus:outline-none py-0.5 transition-colors"
                    />
                  </div>
                  {selectedApplication.postingUrl && (
                    <div className="col-span-2 border-t border-choco-100/40 pt-2 mt-1">
                      <span className="text-choco-400 block font-bold uppercase tracking-wider text-xxs">Job Posting</span>
                      <a
                        href={selectedApplication.postingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-choco-600 hover:text-choco-800 underline inline-flex items-center gap-1 font-bold break-all"
                      >
                        View Original Posting <Link2 size={12} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Delete Application Option */}
                <div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this entire job application and all associated notes?')) {
                        deleteAppMutation.mutate(selectedApplication.id)
                      }
                    }}
                    className="text-red-755 hover:text-red-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete Application
                  </button>
                </div>

                {/* Checklist / Todos Section */}
                <div className="border-t border-choco-100 pt-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif font-bold text-choco-900 text-sm">Task Checklist</h4>
                    {selectedApplication.todos && selectedApplication.todos.length > 0 && (
                      <span className="text-xxs font-bold text-choco-500">
                        {selectedApplication.todos.filter((t) => t.completed).length}/{selectedApplication.todos.length} Done
                      </span>
                    )}
                  </div>

                  {/* Add Todo Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!newTodoTitle.trim()) return
                      createTodoMutation.mutate({ appId: selectedApplication.id, title: newTodoTitle.trim() })
                      setNewTodoTitle('')
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      placeholder="Add task (e.g. follow up with recruiter)..."
                      className="flex-1 px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none focus:border-choco-500"
                    />
                    <button
                      type="submit"
                      className="bg-choco-800 hover:bg-choco-750 text-cream-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </form>

                  {/* Todo List */}
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {!selectedApplication.todos || selectedApplication.todos.length === 0 ? (
                      <p className="text-xxs text-choco-400 italic">No checklist items yet.</p>
                    ) : (
                      selectedApplication.todos.map((todo) => (
                        <div key={todo.id} className="flex items-center justify-between p-2 bg-cream-50/40 border border-choco-100/50 rounded-lg group">
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={todo.completed}
                              onChange={(e) => updateTodoMutation.mutate({ id: todo.id, completed: e.target.checked })}
                              className="rounded border-choco-300 text-choco-600 focus:ring-choco-500 h-3.5 w-3.5 accent-choco-700"
                            />
                            <span className={`text-xs truncate ${todo.completed ? 'line-through text-choco-400 font-normal' : 'text-choco-800 font-medium'}`}>
                              {todo.title}
                            </span>
                          </label>
                          <button
                            onClick={() => deleteTodoMutation.mutate(todo.id)}
                            className="text-choco-300 hover:text-red-655 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Notes/Timeline Section */}
                <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                  <h4 className="font-serif font-bold text-choco-900 text-sm border-b border-choco-100 pb-2">Notes & Event Logs</h4>

                  {/* Add Note Form */}
                  <form onSubmit={handleNoteSubmit} className="bg-cream-50/30 p-4 rounded-lg border border-choco-100/60 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Note/Event Title"
                        required
                        className="col-span-2 px-3 py-1.5 border border-choco-200 bg-white rounded text-xs focus:outline-none focus:border-choco-500"
                      />
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value as any)}
                        className="px-2 py-1.5 border border-choco-200 rounded text-xs bg-white text-choco-800 focus:outline-none"
                      >
                        <option value="GENERAL">General Note</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="ASSESSMENT">Assessment</option>
                        <option value="FEEDBACK">Feedback</option>
                      </select>
                      <input
                        type="datetime-local"
                        value={noteEventDate}
                        onChange={(e) => setNoteEventDate(e.target.value)}
                        placeholder="Event Date"
                        className="px-2 py-1.5 border border-choco-200 bg-white rounded text-xs text-choco-800 focus:outline-none"
                      />
                    </div>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Type details, questions, or updates..."
                      required
                      rows={2}
                      className="w-full px-3 py-1.5 border border-choco-200 bg-white rounded text-xs focus:outline-none focus:border-choco-500 resize-none"
                    ></textarea>
                    <button
                      type="submit"
                      disabled={createNoteMutation.isPending}
                      className="w-full bg-choco-850 hover:bg-choco-800 text-cream-50 text-xs py-2 rounded font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      Log Note / Event
                    </button>
                  </form>

                  {/* Notes List */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {!selectedApplication.notes || selectedApplication.notes.length === 0 ? (
                      <div className="text-center text-xs text-choco-400 py-8 font-serif italic">
                        No logs or notes. Add one above.
                      </div>
                    ) : (
                      selectedApplication.notes.map((note) => (
                        <div key={note.id} className="p-3.5 bg-white border border-choco-100/60 rounded-lg space-y-1 relative group hover:border-choco-300 transition-colors">
                          <button
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            className="absolute top-3.5 right-3.5 text-choco-300 hover:text-red-650 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className={`text-xxs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              note.type === 'INTERVIEW'
                                ? 'bg-indigo-55 bg-indigo-50 text-indigo-855'
                                : note.type === 'ASSESSMENT'
                                ? 'bg-amber-50 text-amber-850 border border-amber-100'
                                : note.type === 'FEEDBACK'
                                ? 'bg-emerald-50 text-emerald-855'
                                : 'bg-cream-100 text-choco-800'
                            }`}>
                              {note.type}
                            </span>
                            <span className="text-xxs text-choco-400 font-semibold">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h5 className="font-serif font-bold text-choco-900 text-sm mt-1">{note.title}</h5>
                          <p className="text-xs text-choco-655 leading-relaxed font-medium">{note.content}</p>
                          {note.eventDate && (
                            <div className="text-xxs font-bold text-choco-500 pt-1 flex items-center gap-0.5">
                              <Calendar size={10} />
                              Scheduled: {new Date(note.eventDate).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-choco-500 font-serif italic">Loading details...</div>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog: Add Application */}
      {isAddAppOpen && (
        <div className="fixed inset-0 bg-choco-950/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl border border-choco-150 shadow-2xl w-[450px] max-w-[90%] sm:max-w-full space-y-4">
            <div className="flex justify-between items-center border-b border-choco-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-choco-900">Add New Application</h3>
              <button onClick={() => setIsAddAppOpen(false)} className="text-choco-400 hover:text-choco-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAppSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                  Target Company *
                </label>
                <select
                  value={newCompanyId}
                  onChange={(e) => setNewCompanyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm text-choco-800 focus:outline-none focus:ring-2 focus:ring-choco-500/20 focus:border-choco-500 transition-colors"
                >
                  <option value="">-- Select Company --</option>
                  {companies?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="text-xxs text-choco-500 mt-1.5 font-semibold">
                  Don't see the company? Register it in the{' '}
                  <a href="/companies" className="text-choco-700 underline hover:text-choco-900">
                    Company Directory
                  </a>{' '}
                  first.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  required
                  placeholder="e.g. Frontend Engineer"
                  className="w-full px-3 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20 focus:border-choco-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                    Date Applied
                  </label>
                  <input
                    type="date"
                    value={newDateApplied}
                    onChange={(e) => setNewDateApplied(e.target.value)}
                    className="w-full px-3 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm text-choco-800 focus:outline-none focus:ring-2 focus:ring-choco-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                    Stage Status
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as StageType)}
                    className="w-full px-3 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm text-choco-800 focus:outline-none focus:ring-2 focus:ring-choco-500/20"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                    Expected Salary ($)
                  </label>
                  <input
                    type="number"
                    value={newExpectedSalary}
                    onChange={(e) => setNewExpectedSalary(e.target.value)}
                    placeholder="e.g. 120000"
                    className="w-full px-3 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="e.g. LinkedIn"
                    className="w-full px-3 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                    Job Posting URL
                  </label>
                  <input
                    type="url"
                    value={newPostingUrl}
                    onChange={(e) => setNewPostingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                    Resume/CV Version
                  </label>
                  <input
                    type="text"
                    value={newResumeVersion}
                    onChange={(e) => setNewResumeVersion(e.target.value)}
                    placeholder="e.g. v1.0-swe"
                    className="w-full px-3 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-choco-100 pt-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAppOpen(false)}
                  className="px-4 py-2 border border-choco-200 rounded-lg text-xs font-semibold text-choco-650 hover:bg-cream-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAppMutation.isPending}
                  className="px-4 py-2 bg-choco-850 hover:bg-choco-800 text-cream-50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Create Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
