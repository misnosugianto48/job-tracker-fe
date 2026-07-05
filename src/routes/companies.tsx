import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface Company {
  id: number
  name: string
  industry: string | null
  location: string | null
  url: string | null
  createdAt: string
  updatedAt: string
}

export const Route = createFileRoute('/companies')({
  component: CompaniesComponent,
})

const API_BASE = 'http://localhost:5000/api'

function CompaniesComponent() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Search query state
  const [searchQuery, setSearchQuery] = useState('')

  // Edit mode state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editIndustry, setEditIndustry] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editUrl, setEditUrl] = useState('')

  // Query to get all companies
  const { data: companies, isLoading, isError } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/companies`)
      if (!res.ok) {
        throw new Error('Failed to fetch companies')
      }
      return res.json()
    },
  })

  // Mutation to create a company
  const createMutation = useMutation({
    mutationFn: async (newCompany: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await fetch(`${API_BASE}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCompany),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to create company')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setName('')
      setIndustry('')
      setLocation('')
      setUrl('')
      setError(null)
    },
    onError: (err: any) => {
      setError(err.message)
    },
  })

  // Mutation to update a company
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<Company, 'id' | 'createdAt' | 'updatedAt'>> }) => {
      const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to update company')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setEditingId(null)
      setError(null)
    },
    onError: (err: any) => {
      setError(err.message)
    },
  })

  // Mutation to delete a company
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete company')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({
      name,
      industry: industry.trim() || null,
      location: location.trim() || null,
      url: url.trim() || null,
    })
  }

  const handleStartEdit = (company: Company) => {
    setEditingId(company.id)
    setEditName(company.name)
    setEditIndustry(company.industry || '')
    setEditLocation(company.location || '')
    setEditUrl(company.url || '')
  }

  const handleUpdate = (id: number) => {
    if (!editName.trim()) return
    updateMutation.mutate({
      id,
      data: {
        name: editName,
        industry: editIndustry.trim() || null,
        location: editLocation.trim() || null,
        url: editUrl.trim() || null,
      },
    })
  }

  // Filtered companies list
  const filteredCompanies = companies?.filter((c) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      c.name.toLowerCase().includes(query) ||
      (c.industry && c.industry.toLowerCase().includes(query)) ||
      (c.location && c.location.toLowerCase().includes(query))
    )
  }) || []

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header and Summary */}
      <div className="border-b border-choco-200 pb-6">
        <h2 className="text-3xl font-serif font-extrabold text-choco-900 tracking-tight">Company Directory</h2>
        <p className="text-choco-600 mt-1">Manage and track organizations you are targeting or applying to.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Company creation form */}
        <div className="bg-white p-6 rounded-xl border border-choco-100 shadow-sm h-fit">
          <h3 className="text-lg font-serif font-bold text-choco-800 border-b border-choco-50 pb-3 mb-4">Add Company</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-choco-200 bg-cream-50/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20 focus:border-choco-500 transition-all duration-200"
                placeholder="e.g. Google"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-choco-200 bg-cream-50/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20 focus:border-choco-500 transition-all duration-200"
                placeholder="e.g. Technology"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-choco-200 bg-cream-50/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20 focus:border-choco-500 transition-all duration-200"
                placeholder="e.g. Mountain View, CA"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-choco-500 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-choco-200 bg-cream-50/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20 focus:border-choco-500 transition-all duration-200"
                placeholder="e.g. https://google.com"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-choco-800 hover:bg-choco-750 text-cream-50 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 mt-2 shadow-sm"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Company'}
            </button>
          </form>
        </div>

        {/* Companies List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Input */}
          <div className="bg-white p-4 rounded-xl border border-choco-100/60 shadow-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies by name, industry, or location..."
              className="w-full px-4 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20 focus:border-choco-500 transition-all duration-200"
            />
          </div>

          <div className="bg-white rounded-xl border border-choco-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-choco-500">Loading companies...</div>
            ) : isError ? (
              <div className="p-8 text-center text-red-500">Failed to load companies.</div>
            ) : !companies || companies.length === 0 ? (
              <div className="p-8 text-center text-choco-400">No companies added yet. Start by adding one.</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="p-8 text-center text-choco-400">No companies match your search.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cream-100/50 border-b border-choco-100 text-xs font-bold uppercase tracking-wider text-choco-600 font-serif">
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-choco-50">
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-cream-50/30 transition-colors text-sm">
                      <td className="px-6 py-4">
                        {editingId === company.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-3 py-1.5 border border-choco-200 bg-cream-50/20 rounded text-sm w-full focus:outline-none focus:border-choco-500"
                          />
                        ) : (
                          <div className="font-serif font-bold text-choco-850 text-base">{company.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {editingId === company.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editIndustry}
                              onChange={(e) => setEditIndustry(e.target.value)}
                              placeholder="Industry"
                              className="px-3 py-1.5 border border-choco-200 bg-cream-50/20 rounded text-xs w-full focus:outline-none"
                            />
                            <input
                              type="text"
                              value={editLocation}
                              onChange={(e) => setEditLocation(e.target.value)}
                              placeholder="Location"
                              className="px-3 py-1.5 border border-choco-200 bg-cream-50/20 rounded text-xs w-full focus:outline-none"
                            />
                            <input
                              type="url"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              placeholder="Website"
                              className="px-3 py-1.5 border border-choco-200 bg-cream-50/20 rounded text-xs w-full focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div className="text-xs text-choco-600 space-y-0.5 font-medium">
                            {company.industry && <div><span className="font-semibold text-choco-400">Industry:</span> {company.industry}</div>}
                            {company.location && <div><span className="font-semibold text-choco-400">Location:</span> {company.location}</div>}
                            {company.url && (
                              <div>
                                <a
                                  href={company.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-choco-500 hover:text-choco-700 underline font-semibold transition-colors"
                                >
                                  {company.url}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingId === company.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdate(company.id)}
                              className="bg-choco-700 hover:bg-choco-650 text-cream-50 text-xs px-3 py-1.5 rounded transition-colors font-bold shadow-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-cream-100 hover:bg-cream-200 text-choco-750 text-xs px-3 py-1.5 rounded transition-colors font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3 text-choco-400">
                            <button
                              onClick={() => handleStartEdit(company)}
                              className="hover:text-choco-700 font-semibold text-xs transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure? This will delete all linked applications.')) {
                                  deleteMutation.mutate(company.id)
                                }
                              }}
                              className="hover:text-red-750 font-semibold text-xs transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
