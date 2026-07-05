import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Calendar, Trash2, Link2, DollarSign, Building, AlertCircle, X } from 'lucide-react'

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
  notes?: Note[]
  createdAt: string
  updatedAt: string
}

export const Route = createFileRoute('/board')({
  component: KanbanBoardComponent,
})

const API_BASE = 'http://localhost:5000/api'
const STAGES = ['WISHLIST', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFERED', 'REJECTED'] as const
type StageType = typeof STAGES[number]

function KanbanBoardComponent() {
  const queryClient = useQueryClient()
  
  // State for modals and panels
  const [isAddAppOpen, setIsAddAppOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null)
  
  // New application form state
  const [newCompanyId, setNewCompanyId] = useState('')
  const [newJobTitle, setNewJobTitle] = useState('')
  const [newDateApplied, setNewDateApplied] = useState('')
  const [newSource, setNewSource] = useState('')
  const [newPostingUrl, setNewPostingUrl] = useState('')
  const [newExpectedSalary, setNewExpectedSalary] = useState('')
  const [newStage, setNewStage] = useState<StageType>('WISHLIST')

  // New Note form state
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState<'GENERAL' | 'INTERVIEW' | 'ASSESSMENT' | 'FEEDBACK'>('GENERAL')
  const [noteEventDate, setNoteEventDate] = useState('')

  // Queries
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/companies`)
      if (!res.ok) throw new Error('Failed to fetch companies')
      return res.json()
    },
  })

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/applications`)
      if (!res.ok) throw new Error('Failed to fetch applications')
      return res.json()
    },
  })

  // Detailed single application query (when panel is open)
  const { data: selectedApplication } = useQuery<Application>({
    queryKey: ['applications', selectedAppId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/applications/${selectedAppId}`)
      if (!res.ok) throw new Error('Failed to fetch application details')
      return res.json()
    },
    enabled: selectedAppId !== null,
  })

  // Mutations
  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: number; stage: StageType }) => {
      const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
      if (!res.ok) throw new Error('Failed to update stage')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const createAppMutation = useMutation({
    mutationFn: async (newApp: any) => {
      const res = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      })
      if (!res.ok) throw new Error('Failed to create application')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setIsAddAppOpen(false)
      // reset form
      setNewCompanyId('')
      setNewJobTitle('')
      setNewDateApplied('')
      setNewSource('')
      setNewPostingUrl('')
      setNewExpectedSalary('')
      setNewStage('WISHLIST')
    },
  })

  const deleteAppMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete application')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setSelectedAppId(null)
    },
  })

  const createNoteMutation = useMutation({
    mutationFn: async (newNote: any) => {
      const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      })
      if (!res.ok) throw new Error('Failed to create note')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', selectedAppId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setNoteTitle('')
      setNoteContent('')
      setNoteType('GENERAL')
      setNoteEventDate('')
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const res = await fetch(`${API_BASE}/notes/${noteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete note')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', selectedAppId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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
      updateStageMutation.mutate({ id, stage: targetStage })
    }
  }

  // Handle application submit
  const handleCreateAppSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCompanyId || !newJobTitle.trim()) return

    createAppMutation.mutate({
      companyId: parseInt(newCompanyId, 10),
      jobTitle: newJobTitle.trim(),
      dateApplied: newDateApplied || null,
      source: newSource.trim() || null,
      postingUrl: newPostingUrl.trim() || null,
      expectedSalary: newExpectedSalary ? parseInt(newExpectedSalary, 10) : null,
      stage: newStage,
    })
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

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Board Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Application Pipeline</h2>
          <p className="text-slate-500 mt-1">Drag and drop cards to progress stage status.</p>
        </div>
        <button
          onClick={() => setIsAddAppOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={16} /> New Application
        </button>
      </div>

      {/* Board Layout */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500 flex-1 flex items-center justify-center">
          Loading kanban pipeline...
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto flex gap-6 pb-6 items-start h-[calc(100vh-190px)] min-h-[500px]">
          {STAGES.map((stage) => {
            const stageApps = applications?.filter((app) => app.stage === stage) || []
            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className="w-80 flex-shrink-0 bg-slate-100 rounded-xl border border-slate-200 flex flex-col max-h-full"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">{stage}</span>
                  <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {stageApps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageApps.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                      Empty column
                    </div>
                  ) : (
                    stageApps.map((app) => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => setSelectedAppId(app.id)}
                        className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:shadow-md cursor-pointer transition-shadow space-y-3 relative group"
                      >
                        {isStagnant(app.updatedAt, app.stage) && (
                          <div className="absolute top-2 right-2 text-amber-500 flex items-center gap-0.5" title="Stagnant: No update in 14 days">
                            <AlertCircle size={14} />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm tracking-tight">{app.company.name}</h4>
                          <p className="text-xs text-slate-500 font-medium">{app.jobTitle}</p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {app.source && (
                            <span className="text-xxs font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                              {app.source}
                            </span>
                          )}
                          {app.expectedSalary && (
                            <span className="text-xxs font-semibold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded flex items-center">
                              <DollarSign size={10} />
                              {app.expectedSalary.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {app.dateApplied && (
                          <div className="text-xxs text-slate-400 font-medium flex items-center gap-1">
                            <Calendar size={10} />
                            Applied: {new Date(app.dateApplied).toLocaleDateString()}
                          </div>
                        )}
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 transition-opacity">
          <div className="w-[500px] bg-white h-full shadow-2xl flex flex-col animate-slide-in relative">
            <button
              onClick={() => setSelectedAppId(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            {selectedApplication ? (
              <div className="flex flex-col h-full overflow-hidden p-8 space-y-6">
                {/* Panel Header */}
                <div className="border-b border-slate-100 pb-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider">
                    <Building size={14} /> {selectedApplication.company.name}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 leading-tight">{selectedApplication.jobTitle}</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                      {selectedApplication.stage}
                    </span>
                    {selectedApplication.source && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        Source: {selectedApplication.source}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedApplication.dateApplied && (
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-xxs">Date Applied</span>
                      <span className="font-semibold text-slate-700">{new Date(selectedApplication.dateApplied).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedApplication.expectedSalary && (
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-xxs">Expected Salary</span>
                      <span className="font-semibold text-slate-700">${selectedApplication.expectedSalary.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedApplication.postingUrl && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block font-semibold uppercase tracking-wider text-xxs">Job Posting</span>
                      <a
                        href={selectedApplication.postingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:underline inline-flex items-center gap-1 font-semibold"
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
                    className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Delete Application
                  </button>
                </div>

                {/* Notes/Timeline Section */}
                <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Notes & Event Logs</h4>

                  {/* Add Note Form */}
                  <form onSubmit={handleNoteSubmit} className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Note/Event Title"
                        required
                        className="col-span-2 px-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500"
                      />
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value as any)}
                        className="px-2 py-1.5 border border-slate-200 rounded text-xs bg-white focus:outline-none"
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
                        className="px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none"
                      />
                    </div>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Type details, questions, or updates..."
                      required
                      rows={2}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-teal-500 resize-none"
                    ></textarea>
                    <button
                      type="submit"
                      disabled={createNoteMutation.isPending}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-1.5 rounded font-semibold transition-colors disabled:opacity-50"
                    >
                      Log Note / Event
                    </button>
                  </form>

                  {/* Notes List */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {!selectedApplication.notes || selectedApplication.notes.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-8">
                        No logs or notes. Add one above.
                      </div>
                    ) : (
                      selectedApplication.notes.map((note) => (
                        <div key={note.id} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 relative group hover:border-slate-350 transition-colors">
                          <button
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            className="absolute top-3 right-3 text-slate-350 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className={`text-xxs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              note.type === 'INTERVIEW'
                                ? 'bg-indigo-100 text-indigo-800'
                                : note.type === 'ASSESSMENT'
                                ? 'bg-amber-100 text-amber-800'
                                : note.type === 'FEEDBACK'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {note.type}
                            </span>
                            <span className="text-xxs text-slate-400">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h5 className="font-semibold text-slate-800 text-xs">{note.title}</h5>
                          <p className="text-xs text-slate-500">{note.content}</p>
                          {note.eventDate && (
                            <div className="text-xxs font-semibold text-teal-600 pt-1 flex items-center gap-0.5">
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
              <div className="p-8 text-center text-slate-500">Loading details...</div>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog: Add Application */}
      {isAddAppOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xl w-[450px] max-w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Add New Application</h3>
              <button onClick={() => setIsAddAppOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAppSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Target Company *
                </label>
                <select
                  value={newCompanyId}
                  onChange={(e) => setNewCompanyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                >
                  <option value="">-- Select Company --</option>
                  {companies?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="text-xxs text-slate-400 mt-1">
                  Don't see the company? Register it in the{' '}
                  <a href="/companies" className="text-teal-600 hover:underline">
                    Company Directory
                  </a>{' '}
                  first.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  required
                  placeholder="e.g. Frontend Engineer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Date Applied
                  </label>
                  <input
                    type="date"
                    value={newDateApplied}
                    onChange={(e) => setNewDateApplied(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Stage Status
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as StageType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2"
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Expected Salary ($)
                  </label>
                  <input
                    type="number"
                    value={newExpectedSalary}
                    onChange={(e) => setNewExpectedSalary(e.target.value)}
                    placeholder="e.g. 120000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="e.g. LinkedIn"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  value={newPostingUrl}
                  onChange={(e) => setNewPostingUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAppOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAppMutation.isPending}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
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
