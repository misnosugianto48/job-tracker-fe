import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Mail, Phone, Link2, X, ExternalLink } from 'lucide-react'

interface Company {
  id: number
  name: string
  industry: string | null
  location: string | null
  url: string | null
  createdAt: string
  updatedAt: string
}

interface Contact {
  id: number
  companyId: number
  name: string
  role: string | null
  email: string | null
  phone: string | null
  linkedInUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export const Route = createFileRoute('/companies')({
  component: CompaniesComponent,
})

import { API_BASE, apiFetch, friendlyError } from '../lib/api'

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  interface CompaniesResponse {
    data: Company[]
    total: number
  }

  // Query to get paginated companies from BE
  const { data: paginatedCompanies, isLoading, isError } = useQuery<CompaniesResponse>({
    queryKey: ['companies', searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      params.append('page', currentPage.toString())
      params.append('limit', itemsPerPage.toString())
      return apiFetch<CompaniesResponse>(`${API_BASE}/companies?${params.toString()}`)
    },
  })

  const currentCompanies = paginatedCompanies?.data || []
  const totalCompanies = paginatedCompanies?.total || 0
  const totalPages = Math.ceil(totalCompanies / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage


  // Mutation to create a company
  const createMutation = useMutation({
    mutationFn: async (newCompany: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
      return apiFetch<Company>(`${API_BASE}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company added')
      setName('')
      setIndustry('')
      setLocation('')
      setUrl('')
      setError(null)
    },
    onError: (err: any) => {
      toast.error(friendlyError(err))
      setError(err.message)
    },
  })

  // Mutation to update a company
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<Company, 'id' | 'createdAt' | 'updatedAt'>> }) => {
      return apiFetch<Company>(`${API_BASE}/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company updated')
      setEditingId(null)
      setError(null)
    },
    onError: (err: any) => {
      toast.error(friendlyError(err))
      setError(err.message)
    },
  })

  // Mutation to delete a company
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`${API_BASE}/companies/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company deleted')
    },
    onError: (err) => {
      toast.error(friendlyError(err))
    },
  })

  // Contact state
  const [selectedCompanyForContacts, setSelectedCompanyForContacts] = useState<Company | null>(null)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactRole, setNewContactRole] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [newContactLinkedIn, setNewContactLinkedIn] = useState('')
  const [newContactNotes, setNewContactNotes] = useState('')

  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [editContactName, setEditContactName] = useState('')
  const [editContactRole, setEditContactRole] = useState('')
  const [editContactEmail, setEditContactEmail] = useState('')
  const [editContactPhone, setEditContactPhone] = useState('')
  const [editContactLinkedIn, setEditContactLinkedIn] = useState('')
  const [editContactNotes, setEditContactNotes] = useState('')

  // Query to get contacts for a company
  const { data: contacts, isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ['contacts', selectedCompanyForContacts?.id],
    queryFn: async () => {
      if (!selectedCompanyForContacts) return []
      return apiFetch<Contact[]>(`${API_BASE}/companies/${selectedCompanyForContacts.id}/contacts`)
    },
    enabled: selectedCompanyForContacts !== null,
  })

  // Mutation to create a contact
  const createContactMutation = useMutation({
    mutationFn: async (newContact: Omit<Contact, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
      if (!selectedCompanyForContacts) return
      return apiFetch<Contact>(`${API_BASE}/companies/${selectedCompanyForContacts.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', selectedCompanyForContacts?.id] })
      toast.success('Contact added')
      setNewContactName('')
      setNewContactRole('')
      setNewContactEmail('')
      setNewContactPhone('')
      setNewContactLinkedIn('')
      setNewContactNotes('')
      setIsAddingContact(false)
    },
    onError: (err: any) => {
      toast.error(friendlyError(err))
    },
  })

  // Mutation to update a contact
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<Contact, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>> }) => {
      return apiFetch<Contact>(`${API_BASE}/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', selectedCompanyForContacts?.id] })
      toast.success('Contact updated')
      setEditingContactId(null)
    },
    onError: (err: any) => {
      toast.error(friendlyError(err))
    },
  })

  // Mutation to delete a contact
  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`${API_BASE}/contacts/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', selectedCompanyForContacts?.id] })
      toast.success('Contact deleted')
    },
    onError: (err) => {
      toast.error(friendlyError(err))
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

  // Handled paginated list from backend

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
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search companies by name, industry, or location..."
              className="w-full px-4 py-2 border border-choco-200 bg-cream-50/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-choco-500/20 focus:border-choco-500 transition-all duration-200"
            />
          </div>

          <div className="bg-white rounded-xl border border-choco-100 shadow-sm overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div>
              {isLoading ? (
                <div className="p-8 text-center text-choco-500">Loading companies...</div>
              ) : isError ? (
                <div className="p-8 text-center text-red-500">Could not load companies. The server may be temporarily unavailable.</div>
              ) : totalCompanies === 0 ? (
                searchQuery ? (
                  <div className="p-8 text-center text-choco-400">No companies match your search.</div>
                ) : (
                  <div className="p-8 text-center text-choco-400">No companies added yet. Start by adding one.</div>
                )
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-cream-100/50 border-b border-choco-100 text-xs font-bold uppercase tracking-wider text-choco-600 font-serif">
                          <th className="px-6 py-4">Company</th>
                          <th className="px-6 py-4">Details</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-choco-50">
                        {currentCompanies.map((company) => (
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
                                    onClick={() => setSelectedCompanyForContacts(company)}
                                    className="hover:text-choco-750 font-semibold text-xs transition-colors underline cursor-pointer"
                                  >
                                    Contacts
                                  </button>
                                  <button
                                    onClick={() => handleStartEdit(company)}
                                    className="hover:text-choco-700 font-semibold text-xs transition-colors cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure? This will delete all linked applications.')) {
                                        deleteMutation.mutate(company.id)
                                      }
                                    }}
                                    className="hover:text-red-755 font-semibold text-xs transition-colors cursor-pointer"
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
                  </div>

                  {/* Mobile Card List View */}
                  <div className="md:hidden divide-y divide-choco-50">
                    {currentCompanies.map((company) => (
                      <div key={company.id} className="p-4 space-y-3 hover:bg-cream-50/20 transition-colors text-left">
                        {editingId === company.id ? (
                          <div className="space-y-3 p-1">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-choco-500 mb-1">
                                Company Name
                              </label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-3 py-2 border border-choco-200 bg-cream-50/20 rounded-lg text-sm focus:outline-none focus:border-choco-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-choco-500 mb-1">
                                Industry
                              </label>
                              <input
                                type="text"
                                value={editIndustry}
                                onChange={(e) => setEditIndustry(e.target.value)}
                                className="w-full px-3 py-2 border border-choco-200 bg-cream-50/20 rounded-lg text-sm focus:outline-none focus:border-choco-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-choco-500 mb-1">
                                Location
                              </label>
                              <input
                                type="text"
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                                className="w-full px-3 py-2 border border-choco-200 bg-cream-50/20 rounded-lg text-sm focus:outline-none focus:border-choco-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-choco-500 mb-1">
                                Website
                              </label>
                              <input
                                type="url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="w-full px-3 py-2 border border-choco-200 bg-cream-50/20 rounded-lg text-sm focus:outline-none focus:border-choco-500"
                              />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                              <button
                                onClick={() => handleUpdate(company.id)}
                                className="bg-choco-700 hover:bg-choco-650 text-cream-50 text-xs px-3 py-1.5 rounded transition-colors font-bold shadow-xs cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-cream-100 hover:bg-cream-200 text-choco-750 text-xs px-3 py-1.5 rounded transition-colors font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-serif font-bold text-choco-850 text-lg leading-tight">{company.name}</div>
                                <div className="text-xs text-choco-600 mt-1.5 space-y-1 font-medium">
                                  {company.industry && (
                                    <div>
                                      <span className="font-semibold text-choco-400">Industry:</span> {company.industry}
                                    </div>
                                  )}
                                  {company.location && (
                                    <div>
                                      <span className="font-semibold text-choco-400">Location:</span> {company.location}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {company.url && (
                                <a
                                  href={company.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-choco-500 hover:text-choco-700 bg-cream-100/50 p-2 rounded-lg transition-colors border border-choco-100/50"
                                  title="Visit website"
                                >
                                  <ExternalLink size={14} />
                                </a>
                              )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-choco-50">
                              <button
                                onClick={() => setSelectedCompanyForContacts(company)}
                                className="text-choco-750 hover:text-choco-950 font-bold text-xs bg-cream-100 px-3 py-1.5 rounded-lg border border-choco-200 transition-all cursor-pointer shadow-xs"
                              >
                                Contacts
                              </button>
                              <button
                                onClick={() => handleStartEdit(company)}
                                className="text-choco-700 hover:text-choco-900 font-bold text-xs bg-cream-100 px-3 py-1.5 rounded-lg border border-choco-200 transition-all cursor-pointer shadow-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure? This will delete all linked applications.')) {
                                    deleteMutation.mutate(company.id)
                                  }
                                }}
                                className="text-red-700 hover:text-red-900 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-all cursor-pointer shadow-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && !isError && totalCompanies > 0 && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-cream-100/30 p-4 border-t border-choco-100 text-xs">
                <span className="text-choco-600 font-medium">
                  Showing <span className="font-bold text-choco-800">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-bold text-choco-800">
                    {Math.min(indexOfLastItem, totalCompanies)}
                  </span>{' '}
                  of <span className="font-bold text-choco-800">{totalCompanies}</span> companies
                </span>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded bg-white border border-choco-200 text-choco-750 hover:bg-cream-100 transition-colors disabled:opacity-50 disabled:hover:bg-white font-bold cursor-pointer"
                  >
                    Previous
                  </button>
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded flex items-center justify-center font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-choco-800 text-cream-50'
                            : 'bg-white border border-choco-200 text-choco-750 hover:bg-cream-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <span className="sm:hidden font-bold text-choco-750 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded bg-white border border-choco-200 text-choco-750 hover:bg-cream-100 transition-colors disabled:opacity-50 disabled:hover:bg-white font-bold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sliding Side Panel for Contacts */}
      {selectedCompanyForContacts && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-choco-950/20 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedCompanyForContacts(null)}
            />
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md animate-slide-in">
                <div className="flex h-full flex-col overflow-y-scroll bg-cream-50 py-6 shadow-2xl border-l border-choco-100">
                  {/* Panel Header */}
                  <div className="px-6 border-b border-choco-150 pb-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-serif font-bold text-choco-900">Contacts</h2>
                      <p className="text-xs text-choco-600 mt-0.5">at {selectedCompanyForContacts.name}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCompanyForContacts(null)}
                      className="p-1 text-choco-400 hover:text-choco-800 rounded-full hover:bg-cream-100 transition-all cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Panel Content */}
                  <div className="relative flex-1 py-6 px-6 space-y-6">
                    {/* Add Contact Trigger/Form */}
                    {!isAddingContact ? (
                      <button
                        onClick={() => setIsAddingContact(true)}
                        className="w-full py-2 border border-dashed border-choco-300 rounded-lg text-xs font-bold text-choco-700 hover:bg-cream-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} /> Add Contact Person
                      </button>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          if (!newContactName.trim()) return
                          createContactMutation.mutate({
                            name: newContactName,
                            role: newContactRole.trim() || null,
                            email: newContactEmail.trim() || null,
                            phone: newContactPhone.trim() || null,
                            linkedInUrl: newContactLinkedIn.trim() || null,
                            notes: newContactNotes.trim() || null,
                          })
                        }}
                        className="bg-white p-4 rounded-xl border border-choco-100 shadow-xs space-y-3"
                      >
                        <h4 className="text-xs font-bold uppercase tracking-wider text-choco-500 font-serif">New Contact</h4>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Name *"
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Role / Title (e.g. Recruiter)"
                            value={newContactRole}
                            onChange={(e) => setNewContactRole(e.target.value)}
                            className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none"
                          />
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={newContactEmail}
                            onChange={(e) => setNewContactEmail(e.target.value)}
                            className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Phone Number"
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value)}
                            className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none"
                          />
                          <input
                            type="url"
                            placeholder="LinkedIn URL"
                            value={newContactLinkedIn}
                            onChange={(e) => setNewContactLinkedIn(e.target.value)}
                            className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none"
                          />
                          <textarea
                            placeholder="Notes"
                            value={newContactNotes}
                            onChange={(e) => setNewContactNotes(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none resize-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="submit"
                            disabled={createContactMutation.isPending}
                            className="px-3 py-1.5 bg-choco-800 hover:bg-choco-750 text-cream-50 text-xxs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingContact(false)}
                            className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-choco-750 text-xxs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Contacts List */}
                    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
                      {isLoadingContacts ? (
                        <div className="text-center py-8 text-xs text-choco-400 italic">Loading contacts...</div>
                      ) : !contacts || contacts.length === 0 ? (
                        <div className="text-center py-8 text-xs text-choco-400 italic">No contacts registered for this company yet.</div>
                      ) : (
                        contacts.map((contact) => (
                          <div key={contact.id} className="bg-white p-4 rounded-xl border border-choco-100 shadow-xs relative hover:border-choco-200 transition-colors">
                            {editingContactId === contact.id ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  if (!editContactName.trim()) return
                                  updateContactMutation.mutate({
                                    id: contact.id,
                                    data: {
                                      name: editContactName,
                                      role: editContactRole.trim() || null,
                                      email: editContactEmail.trim() || null,
                                      phone: editContactPhone.trim() || null,
                                      linkedInUrl: editContactLinkedIn.trim() || null,
                                      notes: editContactNotes.trim() || null,
                                    }
                                  })
                                }}
                                className="space-y-2.5"
                              >
                                <input
                                  type="text"
                                  value={editContactName}
                                  onChange={(e) => setEditContactName(e.target.value)}
                                  required
                                  className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={editContactRole}
                                  onChange={(e) => setEditContactRole(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none"
                                />
                                <input
                                  type="email"
                                  value={editContactEmail}
                                  onChange={(e) => setEditContactEmail(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={editContactPhone}
                                  onChange={(e) => setEditContactPhone(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none"
                                />
                                <input
                                  type="url"
                                  value={editContactLinkedIn}
                                  onChange={(e) => setEditContactLinkedIn(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none"
                                />
                                <textarea
                                  value={editContactNotes}
                                  onChange={(e) => setEditContactNotes(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-1.5 border border-choco-200 bg-cream-50/10 rounded-lg text-xs focus:outline-none resize-none"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    type="submit"
                                    disabled={updateContactMutation.isPending}
                                    className="px-2.5 py-1.25 bg-choco-800 hover:bg-choco-750 text-cream-50 text-xxs font-bold rounded transition-colors cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingContactId(null)}
                                    className="px-2.5 py-1.25 bg-cream-100 hover:bg-cream-200 text-choco-750 text-xxs font-bold rounded transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-serif font-bold text-choco-900 text-sm">{contact.name}</h4>
                                    {contact.role && <p className="text-xxs text-choco-500 font-semibold uppercase tracking-wider">{contact.role}</p>}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingContactId(contact.id)
                                        setEditContactName(contact.name)
                                        setEditContactRole(contact.role || '')
                                        setEditContactEmail(contact.email || '')
                                        setEditContactPhone(contact.phone || '')
                                        setEditContactLinkedIn(contact.linkedInUrl || '')
                                        setEditContactNotes(contact.notes || '')
                                      }}
                                      className="text-xxs text-choco-400 hover:text-choco-750 underline font-semibold transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Delete this contact?')) {
                                          deleteContactMutation.mutate(contact.id)
                                        }
                                      }}
                                      className="text-xxs text-choco-400 hover:text-red-750 underline font-semibold transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                <div className="text-xs text-choco-600 space-y-1 font-medium">
                                  {contact.email && (
                                    <div className="flex items-center gap-1.5">
                                      <Mail size={12} className="text-choco-400" />
                                      <a href={`mailto:${contact.email}`} className="hover:underline text-choco-700">{contact.email}</a>
                                    </div>
                                  )}
                                  {contact.phone && (
                                    <div className="flex items-center gap-1.5">
                                      <Phone size={12} className="text-choco-400" />
                                      <span className="text-choco-700">{contact.phone}</span>
                                    </div>
                                  )}
                                  {contact.linkedInUrl && (
                                    <div className="flex items-center gap-1.5">
                                      <Link2 size={12} className="text-choco-400" />
                                      <a
                                        href={contact.linkedInUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline text-choco-700 flex items-center gap-0.5"
                                      >
                                        LinkedIn Profile <ExternalLink size={10} />
                                      </a>
                                    </div>
                                  )}
                                </div>
                                {contact.notes && (
                                  <div className="text-xxs text-choco-600 bg-cream-50/50 p-2 rounded border border-choco-100/50 font-medium leading-relaxed mt-1">
                                    {contact.notes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
