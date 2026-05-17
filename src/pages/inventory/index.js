// src/pages/inventory/index.js
import { useState, useEffect } from 'react'
import {
  Search, Plus, Package, LayoutGrid, List,
  CheckCircle, CheckCircle2, AlertTriangle, XCircle,
  Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import ProductModal       from '@/components/inventory/ProductModal'
import DeleteConfirmModal from '@/components/inventory/DeleteConfirmModal'

const fmt = (n) =>
  Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const getStatus = (stock, threshold) => {
  if (stock === 0)        return { label: 'Out of stock', style: 'bg-red-50 text-red-700 border border-red-200'            }
  if (stock <= threshold) return { label: 'Low stock',    style: 'bg-amber-50 text-amber-700 border border-amber-200'      }
  return                         { label: 'In stock',     style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
}

const ITEMS_PER_PAGE = 10

export default function InventoryPage() {
  const [products,     setProducts]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [categories,   setCategories]   = useState([])
  const [search,       setSearch]       = useState('')
  const [category,     setCategory]     = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [view,         setView]         = useState('table')
  const [page,         setPage]         = useState(1)

  // Modal state
  const [modalOpen,  setModalOpen]  = useState(false)
  const [modalMode,  setModalMode]  = useState('add')
  const [selected,   setSelected]   = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError('')
      const res  = await fetch('/api/products')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch.')
      setProducts(data.products)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setModalMode('add')
    setSelected(null)
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setModalMode('edit')
    setSelected(product)
    setModalOpen(true)
  }

  const openDelete = (product) => {
    setSelected(product)
    setDeleteOpen(true)
  }

  const handleModalSuccess = (product, mode) => {
    if (mode === 'add') {
      setProducts(prev => [product, ...prev])
      showToast(`${product.name} added successfully.`)
    } else {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p))
      showToast(`${product.name} updated successfully.`)
    }
  }

  const handleDeleteSuccess = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    showToast('Product deleted successfully.')
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const categoryOptions = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()]

  const inStock    = products.filter(p => p.stock > p.threshold).length
  const lowStock   = products.filter(p => p.stock > 0 && p.stock <= p.threshold).length
  const outOfStock = products.filter(p => p.stock === 0).length

  const filtered = products.filter(p => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || p.category === category
    const matchStatus   =
      statusFilter === 'All'          ? true :
      statusFilter === 'In Stock'     ? p.stock > p.threshold :
      statusFilter === 'Low Stock'    ? p.stock > 0 && p.stock <= p.threshold :
      statusFilter === 'Out of Stock' ? p.stock === 0 : true
    return matchSearch && matchCategory && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // ── Pagination page numbers (show max 7 pages around current) ──────────────
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []
    if (page <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (page >= totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = page - 1; i <= page + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const resetFilters = () => {
    setSearch('')
    setCategory('All')
    setStatusFilter('All')
    setPage(1)
  }

  const stats = [
    {
      label: 'Total products',
      value: products.length,
      icon: <Package size={16} className="text-slate-500" />,
      iconBg: 'bg-slate-100',
      valueColor: 'text-slate-800',
    },
    {
      label: 'In stock',
      value: inStock,
      icon: <CheckCircle size={16} className="text-emerald-600" />,
      iconBg: 'bg-emerald-50',
      valueColor: 'text-emerald-700',
    },
    {
      label: 'Low stock',
      value: lowStock,
      icon: <AlertTriangle size={16} className="text-amber-500" />,
      iconBg: 'bg-amber-50',
      valueColor: 'text-amber-700',
    },
    {
      label: 'Out of stock',
      value: outOfStock,
      icon: <XCircle size={16} className="text-red-500" />,
      iconBg: 'bg-red-50',
      valueColor: 'text-red-700',
    },
  ]

  const selectStyle = "border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none cursor-pointer bg-white"

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
          {toast.type === 'success'
            ? <CheckCircle2 size={15} />
            : <XCircle size={15} />
          }
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Inventory</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? 'Loading…' : `${products.length} products`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#14532d' }}
        >
          <Plus size={16} />
          Add product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.iconBg}`}>
              {s.icon}
            </div>
            <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold ${s.valueColor}`}>
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

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search name or Code"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
            />
          </div>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className={selectStyle}
          >
            {categoryOptions.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className={selectStyle}
          >
            {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          {(search || category !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={resetFilters}
              className="text-sm text-slate-400 hover:text-slate-600 transition underline underline-offset-2"
            >
              Clear
            </button>
          )}

          <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView('table')}
              title="Table view"
              className={`p-1.5 rounded-md transition ${view === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setView('grid')}
              title="Grid view"
              className={`p-1.5 rounded-md transition ${view === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error} —{' '}
            <button onClick={fetchProducts} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {view === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col style={{ width: '150px' }} />
                <col style={{ width: '260px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '110px' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product name</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit price</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total retail value</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>

                {/* Loading skeleton */}
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-3 py-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: '75%' }} />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Rows */}
                {!loading && paginated.map((p) => {
                  const totalRetail = p.stock * (p.unit_price || 0)
                  const status      = getStatus(p.stock, p.threshold)
                  const stockColor  =
                    p.stock === 0            ? 'text-red-600'
                    : p.stock <= p.threshold ? 'text-amber-600'
                    : 'text-slate-800'

                  return (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3.5 font-mono text-xs text-slate-400 truncate">{p.sku}</td>
                      <td className="px-3 py-3.5 font-medium text-slate-800 truncate" title={p.name}>{p.name}</td>
                      <td className="px-3 py-3.5 text-slate-500 truncate">{p.category || '—'}</td>
                      <td className="px-3 py-3.5 text-right text-slate-700">₱{fmt(p.unit_price)}</td>
                      <td className={`px-3 py-3.5 text-right font-semibold ${stockColor}`}>
                        {p.stock} <span className="text-slate-400 text-xs font-normal">{p.unit}</span>
                      </td>
                      <td className={`px-3 py-3.5 text-right font-semibold ${p.stock === 0 ? 'text-slate-300' : 'text-slate-800'}`}>
                        ₱{fmt(totalRetail)}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${status.style}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDelete(p)}
                            aria-label={`Delete ${p.name}`}
                            className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {/* Empty state */}
                {!loading && !error && paginated.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-16">
                        <Package size={32} className="text-slate-300 mb-3" />
                        <p className="text-sm font-medium text-slate-400">
                          {search || category !== 'All' || statusFilter !== 'All'
                            ? 'No products match your filters.'
                            : 'No products yet'}
                        </p>
                        <p className="text-xs text-slate-300 mt-1 mb-4">
                          {search || category !== 'All' || statusFilter !== 'All'
                            ? <button onClick={resetFilters} className="underline hover:text-slate-400">Clear filters</button>
                            : 'Add your first product to start tracking stock.'}
                        </p>
                        {!search && category === 'All' && statusFilter === 'All' && (
                          <button
                            onClick={openAdd}
                            className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition"
                            style={{ backgroundColor: '#14532d' }}
                          >
                            <Plus size={13} /> Add first product
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Grand Total */}
              {!loading && filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={5} className="px-3 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Total retail value
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-slate-800">
                      ₱{fmt(filtered.reduce((s, p) => s + p.stock * (p.unit_price || 0), 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {view === 'grid' && (
          <div className="p-5">
            {loading && (
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {!loading && paginated.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {paginated.map(p => {
                  const status     = getStatus(p.stock, p.threshold)
                  const stockColor =
                    p.stock === 0            ? 'text-red-600'
                    : p.stock <= p.threshold ? 'text-amber-600'
                    : 'text-slate-700'
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-3 border border-slate-100" />
                        : <div className="w-full h-24 rounded-lg mb-3 bg-slate-100 border border-slate-100 flex items-center justify-center">
                            <Package size={24} className="text-slate-300" />
                          </div>
                      }
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.style}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-slate-400 font-mono truncate ml-2">{p.sku}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 mb-0.5 leading-snug line-clamp-2">{p.name}</h3>
                      <p className="text-xs text-slate-400 mb-3">{p.category || '—'}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm font-bold text-slate-800">₱{fmt(p.unit_price)}</span>
                        <span className={`text-xs font-semibold ${stockColor}`}>{p.stock} <span className="font-normal text-slate-400">{p.unit}</span></span>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(p)}
                          className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {!loading && !error && paginated.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <Package size={32} className="text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-400">No products match your filters.</p>
                <button onClick={resetFilters} className="text-xs text-slate-400 underline mt-1">Clear filters</button>
              </div>
            )}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={15} /> Prev
              </button>

              {getPageNumbers().map((n, i) =>
                n === '...'
                  ? <span key={`dots-${i}`} className="text-slate-400 px-1">…</span>
                  : <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${n === page ? 'text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                      style={n === page ? { backgroundColor: '#14532d' } : {}}
                    >
                      {n}
                    </button>
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={modalOpen}
        mode={modalMode}
        product={selected}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      <DeleteConfirmModal
        isOpen={deleteOpen}
        product={selected}
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