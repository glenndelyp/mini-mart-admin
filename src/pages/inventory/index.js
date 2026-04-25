import { useState } from 'react'
import {
  Search, Plus, Package, AlertTriangle,
  Pencil, Trash2, LayoutGrid, List,
} from 'lucide-react'

const getStatus = (stock, threshold) => {
  if (stock === 0)        return { label: 'Out of Stock', style: 'bg-red-50 text-red-600 border border-red-200'         }
  if (stock <= threshold) return { label: 'Low Stock',    style: 'bg-amber-50 text-amber-700 border border-amber-200'   }
  return                         { label: 'In Stock',     style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
}

const ITEMS_PER_PAGE = 8

export default function InventoryPage() {
  const [tab, setTab]           = useState('stock')
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')
  const [view, setView]         = useState('table')
  const [page, setPage]         = useState(1)

  const products   = []
  const categories = ['All']

  const filtered = products.filter((p) => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || p.category === category
    return matchSearch && matchCategory
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const stats = [
    { label: 'Total Products', value: 0, bg: 'bg-violet-50',  iconColor: 'text-violet-600'  },
    { label: 'In Stock',       value: 0, bg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Low Stock',      value: 0, bg: 'bg-amber-50',   iconColor: 'text-amber-600'   },
    { label: 'Out of Stock',   value: 0, bg: 'bg-red-50',     iconColor: 'text-red-600'     },
  ]

  const handleTabChange = (t) => { setTab(t); setSearch(''); setCategory('All'); setPage(1) }

  const theadStyle = { backgroundColor: '#1e293b', color: '#f8fafc' }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track and manage your product stock.</p>
        </div>
        <button className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#14532d' }}>
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
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
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
                  tab === t.key
                    ? 'border-b-2 text-slate-800 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
                style={tab === t.key ? { borderBottomColor: '#14532d', color: '#14532d' } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'catalog' && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setView('table')}
                className={`p-1.5 rounded-md transition ${view === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded-md transition ${view === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
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

        {/* Stock Levels Tab */}
        {tab === 'stock' && (
          <table className="w-full">
            <thead>
              <tr className="text-sm" style={theadStyle}>
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
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <Package size={32} className="text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-400">No products yet</p>
                    <p className="text-xs text-slate-300 mt-1 mb-4">Add your first product to start tracking stock</p>
                    <button className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#14532d' }}>
                      <Plus size={13} />
                      Add First Product
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Product Catalog — Table */}
        {tab === 'catalog' && view === 'table' && (
          <table className="w-full">
            <thead>
              <tr className="text-sm" style={theadStyle}>
                <th className="text-left px-5 py-3 font-medium">Product</th>
                <th className="text-left px-5 py-3 font-medium">SKU</th>
                <th className="text-left px-5 py-3 font-medium">Category</th>
                <th className="text-left px-5 py-3 font-medium">Price</th>
                <th className="text-left px-5 py-3 font-medium">Stock</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <Package size={32} className="text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-400">No products in catalog</p>
                    <p className="text-xs text-slate-300 mt-1 mb-4">Start building your product catalog</p>
                    <button className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#14532d' }}>
                      <Plus size={13} />
                      Add First Product
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Product Catalog — Grid */}
        {tab === 'catalog' && view === 'grid' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Package size={32} className="text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-400">No products in catalog</p>
            <p className="text-xs text-slate-300 mt-1 mb-4">Start building your product catalog</p>
            <button className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#14532d' }}>
              <Plus size={13} />
              Add First Product
            </button>
          </div>
        )}

        {/* Pagination */}
        {products.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 transition">← Previous</button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${p === page ? 'text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    style={p === page ? { backgroundColor: '#14532d' } : {}}
                  >{p}</button>
                ))}
              </div>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 transition">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}