// src/pages/categories/index.js
import { useState, useEffect } from 'react'
import { Search, Plus, Tag } from 'lucide-react'
import CategoryModal       from '@/components/categories/CategoryModal'
import CategoryDeleteModal from '@/components/categories/CategoryDeleteModal'

const STATUS_STYLE = {
  active:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border border-slate-200',
}

const ITEMS_PER_PAGE = 8

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [status,     setStatus]     = useState('All')
  const [page,       setPage]       = useState(1)

  const [modalOpen,  setModalOpen]  = useState(false)
  const [modalMode,  setModalMode]  = useState('add')
  const [selected,   setSelected]   = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toast,      setToast]      = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError('')
      const res  = await fetch('/api/categories')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch.')
      setCategories(data.categories)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openAdd = () => { setModalMode('add'); setSelected(null); setModalOpen(true) }
  const openEdit = (cat) => { setModalMode('edit'); setSelected(cat); setModalOpen(true) }
  const openDelete = (cat) => { setSelected(cat); setDeleteOpen(true) }

  const handleModalSuccess = (category, mode) => {
    if (mode === 'add') {
      setCategories(prev => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))
      showToast(`"${category.name}" added successfully.`)
    } else {
      setCategories(prev => prev.map(c => c.id === category.id ? category : c))
      showToast(`"${category.name}" updated successfully.`)
    }
  }

  const handleDeleteSuccess = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id))
    showToast('Category deleted successfully.')
  }

  const filtered = categories.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        (c.description || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = status === 'All' || c.status === status.toLowerCase()
    return matchSearch && matchStatus
  })

  const totalPages  = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated   = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const totalActive = categories.filter(c => c.status === 'active').length

  const stats = [
    { label: 'Total Categories', value: categories.length,               bg: 'bg-violet-50',  iconColor: 'text-violet-600'  },
    { label: 'Active',           value: totalActive,                     bg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Inactive',         value: categories.length - totalActive, bg: 'bg-slate-100',  iconColor: 'text-slate-500'   },
  ]

  return (
    <div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg
            ${toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
            }`}
          style={{ animation: 'fadeIn .25s ease' }}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Category Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage product categories used across inventory.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#14532d' }}
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}>
              <Tag size={18} className={s.iconColor} />
            </div>
            <p className="text-sm text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-800">
              {loading
                ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
                : s.value
              }
            </p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-slate-200">

        {/* Filters */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-72">
            <Search size={14} className="text-slate-400" />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search category name or description"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
            />
          </div>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none cursor-pointer bg-white"
          >
            {['All', 'Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error} —{' '}
            <button onClick={fetchCategories} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="text-sm" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
              <th className="text-left px-5 py-3 font-medium">#</th>
              <th className="text-left px-5 py-3 font-medium">Category Name</th>
              <th className="text-left px-5 py-3 font-medium">Description</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Date Added</th>
              <th className="text-left px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>

            {/* Loading skeleton */}
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-slate-100">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 5 ? 80 : '75%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {/* Rows */}
            {!loading && paginated.map((c, i) => (
              <tr key={c.id} className={`text-sm border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">
                  {(page - 1) * ITEMS_PER_PAGE + i + 1}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0fdf4' }}>
                      <Tag size={14} style={{ color: '#14532d' }} />
                    </div>
                    <span className="font-semibold text-slate-800">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                  {c.description || <span className="text-slate-300 italic">No description</span>}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[c.status]}`}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-xs">
                  {new Date(c.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDelete(c)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Empty */}
            {!loading && !error && paginated.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <Tag size={32} className="text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-400">
                      {search || status !== 'All' ? 'No categories match your search.' : 'No categories yet'}
                    </p>
                    <p className="text-xs text-slate-300 mt-1 mb-4">
                      {search || status !== 'All' ? 'Try adjusting your filters.' : 'Add your first category to get started'}
                    </p>
                    {!search && status === 'All' && (
                      <button
                        onClick={openAdd}
                        className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
                        style={{ backgroundColor: '#14532d' }}
                      >
                        <Plus size={13} /> Add First Category
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} categories
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 transition">← Previous</button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${p === page ? 'text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    style={p === page ? { backgroundColor: '#14532d' } : {}}
                  >{p}</button>
                ))}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 transition">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={modalOpen}
        mode={modalMode}
        category={selected}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      <CategoryDeleteModal
        isOpen={deleteOpen}
        category={selected}
        onClose={() => setDeleteOpen(false)}
        onSuccess={handleDeleteSuccess}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}