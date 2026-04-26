// src/pages/inventory/index.js
import { useState, useEffect } from 'react'
import { Search, Plus, Package, LayoutGrid, List } from 'lucide-react'
import ProductModal      from '@/components/inventory/ProductModal'
import DeleteConfirmModal from '@/components/inventory/DeleteConfirmModal'

const getStatus = (stock, threshold) => {
  if (stock === 0)        return { label: 'Out of Stock', style: 'bg-red-50 text-red-600 border border-red-200'             }
  if (stock <= threshold) return { label: 'Low Stock',    style: 'bg-amber-50 text-amber-700 border border-amber-200'       }
  return                         { label: 'In Stock',     style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
}

const ITEMS_PER_PAGE = 8

export default function InventoryPage() {
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [tab,       setTab]       = useState('stock')
  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('All')
  const [view,      setView]      = useState('table')
  const [page,      setPage]      = useState(1)

  // Modal state
  const [modalOpen,  setModalOpen]  = useState(false)
  const [modalMode,  setModalMode]  = useState('add')   // 'add' | 'edit'
  const [selected,   setSelected]   = useState(null)    // product being edited/deleted
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Modal handlers ────────────────────────────────────────────────────────
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

  // ── Derived values ────────────────────────────────────────────────────────
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()]

  const filtered = products.filter(p => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || p.category === category
    return matchSearch && matchCategory
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const inStock    = products.filter(p => p.stock > p.threshold).length
  const lowStock   = products.filter(p => p.stock > 0 && p.stock <= p.threshold).length
  const outOfStock = products.filter(p => p.stock === 0).length

  const stats = [
    { label: 'Total Products', value: products.length, bg: 'bg-violet-50',  iconColor: 'text-violet-600'  },
    { label: 'In Stock',       value: inStock,          bg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Low Stock',      value: lowStock,         bg: 'bg-amber-50',   iconColor: 'text-amber-600'   },
    { label: 'Out of Stock',   value: outOfStock,       bg: 'bg-red-50',     iconColor: 'text-red-600'     },
  ]

  const handleTabChange = (t) => { setTab(t); setSearch(''); setCategory('All'); setPage(1) }

  const theadStyle = { backgroundColor: '#1e293b', color: '#f8fafc' }

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
          <h1 className="text-xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track and manage your product stock.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#14532d' }}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}>
              <Package size={18} className={s.iconColor} />
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

        {/* Tabs */}
        <div className="flex items-center justify-between px-5 border-b border-slate-100">
          <div className="flex">
            {[
              { key: 'stock',   label: 'Stock Levels'    },
              { key: 'catalog', label: 'Product Catalog' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`px-5 py-4 text-sm font-medium border-b-2 transition ${
                  tab === t.key ? 'font-semibold' : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
                style={tab === t.key ? { borderBottomColor: '#14532d', color: '#14532d' } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'catalog' && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button onClick={() => setView('table')} className={`p-1.5 rounded-md transition ${view === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <List size={15} />
              </button>
              <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition ${view === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutGrid size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-72">
            <Search size={14} className="text-slate-400" />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search product or SKU"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none cursor-pointer bg-white"
          >
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error} —{' '}
            <button onClick={fetchProducts} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* ── STOCK LEVELS TAB ── */}
        {tab === 'stock' && (
          <table className="w-full">
            <thead>
              <tr className="text-sm" style={theadStyle}>
                <th className="text-left px-5 py-3 font-medium">Image</th>
                <th className="text-left px-5 py-3 font-medium">Product</th>
                <th className="text-left px-5 py-3 font-medium">SKU</th>
                <th className="text-left px-5 py-3 font-medium">Category</th>
                <th className="text-left px-5 py-3 font-medium">Stock</th>
                <th className="text-left px-5 py-3 font-medium">Unit Price</th>
                <th className="text-left px-5 py-3 font-medium">Supplier</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading skeleton */}
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 8 ? 80 : '80%' }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Rows */}
              {!loading && paginated.map((p, i) => {
                const status = getStatus(p.stock, p.threshold)
                return (
                  <tr key={p.id} className={`text-sm border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-5 py-3.5">
                      {p.image_url
                       ? <img src={p.image_url} alt={p.name} className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
        : <div className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Package size={20} className="text-slate-300" />
          </div>
                      }
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{p.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-3.5 text-slate-600">{p.category}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-semibold">
                      {p.stock} <span className="text-slate-400 font-normal text-xs">{p.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">₱{Number(p.unit_price).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{p.supplier ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.style}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(p)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {/* Empty */}
              {!loading && !error && paginated.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <Package size={32} className="text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-400">
                        {search || category !== 'All' ? 'No products match your search.' : 'No products yet'}
                      </p>
                      <p className="text-xs text-slate-300 mt-1 mb-4">
                        {search || category !== 'All' ? 'Try adjusting your filters.' : 'Add your first product to start tracking stock'}
                      </p>
                      {!search && category === 'All' && (
                        <button
                          onClick={openAdd}
                          className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
                          style={{ backgroundColor: '#14532d' }}
                        >
                          <Plus size={13} /> Add First Product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* ── PRODUCT CATALOG TAB — TABLE ── */}
        {tab === 'catalog' && view === 'table' && (
          <table className="w-full">
            <thead>
              <tr className="text-sm" style={theadStyle}>
                <th className="text-left px-5 py-3 font-medium">Image</th>
                <th className="text-left px-5 py-3 font-medium">Product</th>
                <th className="text-left px-5 py-3 font-medium">SKU</th>
                <th className="text-left px-5 py-3 font-medium">Category</th>
                <th className="text-left px-5 py-3 font-medium">Price</th>
                <th className="text-left px-5 py-3 font-medium">Unit</th>
                <th className="text-left px-5 py-3 font-medium">Stock</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: '75%' }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && paginated.map((p, i) => {
                const status = getStatus(p.stock, p.threshold)
                return (
                  <tr key={p.id} className={`text-sm border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-5 py-3.5">
                      {p.image_url
                       ? <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
        : <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Package size={20} className="text-slate-300" />
          </div>
                      }
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{p.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-3.5 text-slate-600">{p.category}</td>
                    <td className="px-5 py-3.5 text-slate-700">₱{Number(p.unit_price).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{p.unit}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-semibold">{p.stock}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.style}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(p)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {!loading && !error && paginated.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <Package size={32} className="text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-400">No products in catalog</p>
                      <p className="text-xs text-slate-300 mt-1 mb-4">Start building your product catalog</p>
                      <button
                        onClick={openAdd}
                        className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
                        style={{ backgroundColor: '#14532d' }}
                      >
                        <Plus size={13} /> Add First Product
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* ── PRODUCT CATALOG TAB — GRID ── */}
        {tab === 'catalog' && view === 'grid' && (
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
                  const status = getStatus(p.stock, p.threshold)
                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-3 border border-slate-100" />
                        : <div className="w-full h-24 rounded-lg mb-3 bg-slate-100 border border-slate-100 flex items-center justify-center">
                            <Package size={24} className="text-slate-300" />
                          </div>
                      }
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.style}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{p.sku}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 mb-1 leading-snug">{p.name}</h3>
                      <p className="text-xs text-slate-400 mb-3">{p.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">₱{Number(p.unit_price).toFixed(2)}</span>
                        <span className="text-xs text-slate-500">{p.stock} {p.unit}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate">{p.supplier ?? '—'}</p>
                      <div className="flex gap-2 mt-3">
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
                <p className="text-sm font-medium text-slate-400">No products in catalog</p>
                <p className="text-xs text-slate-300 mt-1 mb-4">Start building your product catalog</p>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
                  style={{ backgroundColor: '#14532d' }}
                >
                  <Plus size={13} /> Add First Product
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
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
      <ProductModal
        isOpen={modalOpen}
        mode={modalMode}
        product={selected}
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