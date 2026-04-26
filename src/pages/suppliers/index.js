// src/pages/suppliers/index.js
import { useState, useEffect } from 'react'
import { Search, Plus, Truck, Phone, Mail, MapPin } from 'lucide-react'
import SupplierModal     from '@/components/suppliers/SupplierModal'
import DeleteConfirmModal from '@/components/suppliers/DeleteConfirmModal'

const STATUS_STYLE = {
  active:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border border-slate-200',
}

const ITEMS_PER_PAGE = 8

export default function SuppliersPage() {
  const [suppliers,  setSuppliers]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [status,     setStatus]     = useState('All')
  const [page,       setPage]       = useState(1)

  // Modal state
  const [modalOpen,   setModalOpen]   = useState(false)
  const [modalMode,   setModalMode]   = useState('add')       // 'add' | 'edit'
  const [selected,    setSelected]    = useState(null)        // supplier being edited/deleted
  const [deleteOpen,  setDeleteOpen]  = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      setError('')
      const res  = await fetch('/api/suppliers')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch.')
      setSuppliers(data.suppliers)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Modal handlers ────────────────────────────────────────────────────────
  const openAdd = () => {
    setModalMode('add')
    setSelected(null)
    setModalOpen(true)
  }

  const openEdit = (supplier) => {
    setModalMode('edit')
    setSelected(supplier)
    setModalOpen(true)
  }

  const openDelete = (supplier) => {
    setSelected(supplier)
    setDeleteOpen(true)
  }

  const handleModalSuccess = (supplier, mode) => {
    if (mode === 'add') {
      setSuppliers(prev => [supplier, ...prev])
      showToast(`${supplier.full_name} added successfully.`)
    } else {
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s))
      showToast(`${supplier.full_name} updated successfully.`)
    }
  }

  const handleDeleteSuccess = (id) => {
    setSuppliers(prev => prev.filter(s => s.id !== id))
    showToast('Supplier deleted successfully.')
  }

  // ── Filtering & pagination ────────────────────────────────────────────────
  const filtered = suppliers.filter(s => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
                        s.company.toLowerCase().includes(search.toLowerCase()) ||
                        s.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = status === 'All' || s.status === status.toLowerCase()
    return matchSearch && matchStatus
  })

  const totalPages  = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated   = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const totalActive = suppliers.filter(s => s.status === 'active').length

  const stats = [
    { label: 'Total Suppliers', value: suppliers.length,              bg: 'bg-violet-50',  iconColor: 'text-violet-600'  },
    { label: 'Active',          value: totalActive,                   bg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Inactive',        value: suppliers.length - totalActive, bg: 'bg-slate-100', iconColor: 'text-slate-500'   },
  ]

  return (
    <div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg
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
          <h1 className="text-xl font-bold text-slate-800">Supplier Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your product suppliers and contacts.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#14532d' }}
        >
          <Plus size={16} />
          Add Supplier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}>
              <Truck size={18} className={s.iconColor} />
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
              placeholder="Search name, company, or email"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none cursor-pointer bg-white"
          >
            {['All', 'Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error} —{' '}
            <button onClick={fetchSuppliers} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="text-sm" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
              <th className="text-left px-5 py-3 font-medium">Full Name</th>
              <th className="text-left px-5 py-3 font-medium">Company</th>
              <th className="text-left px-5 py-3 font-medium">Contact No.</th>
              <th className="text-left px-5 py-3 font-medium">Email</th>
              <th className="text-left px-5 py-3 font-medium">Address</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>

            {/* Loading skeletons */}
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-t border-slate-100">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 6 ? 80 : '80%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {/* Data rows */}
            {!loading && paginated.map((s, i) => (
              <tr key={s.id} className={`text-sm border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                <td className="px-5 py-3.5 font-medium text-slate-800">{s.full_name}</td>
                <td className="px-5 py-3.5 text-slate-600">{s.company}</td>
                <td className="px-5 py-3.5 text-slate-600">
                  <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" />{s.contact_num}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-600">
                  <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" />{s.email}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-500">
                  <span className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" />{s.address ?? '—'}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[s.status]}`}>
                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDelete(s)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Empty state */}
            {!loading && !error && paginated.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <Truck size={32} className="text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-400">
                      {search || status !== 'All' ? 'No suppliers match your search.' : 'No suppliers yet'}
                    </p>
                    <p className="text-xs text-slate-300 mt-1 mb-4">
                      {search || status !== 'All' ? 'Try adjusting your filters.' : 'Add your first supplier to get started'}
                    </p>
                    {!search && status === 'All' && (
                      <button
                        onClick={openAdd}
                        className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
                        style={{ backgroundColor: '#14532d' }}
                      >
                        <Plus size={13} />
                        Add First Supplier
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
              Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} suppliers
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
      <SupplierModal
        isOpen={modalOpen}
        mode={modalMode}
        supplier={selected}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      <DeleteConfirmModal
        isOpen={deleteOpen}
        supplier={selected}
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