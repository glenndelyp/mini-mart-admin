import { useState } from 'react'
import { Search, Plus, Package, Pencil, Trash2 } from 'lucide-react'

const products = [
  { id: 1,  name: 'Fresh Tomatoes',  category: 'Vegetables', sku: 'VEG-001', price: 45,  stock: 142, image: '🍅', description: 'Locally grown fresh tomatoes'  },
  { id: 2,  name: 'Organic Apples',  category: 'Fruits',     sku: 'FRT-002', price: 120, stock: 88,  image: '🍎', description: 'Organic certified red apples'   },
  { id: 3,  name: 'Whole Milk',       category: 'Dairy',      sku: 'DRY-003', price: 75,  stock: 24,  image: '🥛', description: 'Fresh whole milk 1L'            },
  { id: 4,  name: 'Brown Rice 5kg',   category: 'Grains',     sku: 'GRN-004', price: 280, stock: 310, image: '🌾', description: 'Premium brown rice 5kg bag'    },
  { id: 5,  name: 'Chicken Breast',   category: 'Meat',       sku: 'MET-005', price: 340, stock: 12,  image: '🍗', description: 'Fresh boneless chicken breast' },
  { id: 6,  name: 'Sourdough Bread',  category: 'Bakery',     sku: 'BKR-006', price: 95,  stock: 0,   image: '🍞', description: 'Artisan sourdough loaf'        },
  { id: 7,  name: 'Orange Juice 1L',  category: 'Beverages',  sku: 'BEV-007', price: 85,  stock: 67,  image: '🍊', description: 'Freshly squeezed orange juice' },
  { id: 8,  name: 'Greek Yogurt',     category: 'Dairy',      sku: 'DRY-008', price: 110, stock: 18,  image: '🫙', description: 'Plain greek yogurt 200g'       },
  { id: 9,  name: 'Baby Spinach',     category: 'Vegetables', sku: 'VEG-009', price: 60,  stock: 55,  image: '🥬', description: 'Fresh baby spinach 200g bag'   },
  { id: 10, name: 'Cheddar Cheese',   category: 'Dairy',      sku: 'DRY-010', price: 220, stock: 0,   image: '🧀', description: 'Aged cheddar cheese block'     },
  { id: 11, name: 'Banana Lakatan',   category: 'Fruits',     sku: 'FRT-011', price: 55,  stock: 200, image: '🍌', description: 'Sweet lakatan bananas per kg'  },
  { id: 12, name: 'Eggs (12 pcs)',    category: 'Dairy',      sku: 'DRY-012', price: 135, stock: 8,   image: '🥚', description: 'Farm fresh eggs 12 pcs/tray'   },
]

const stockStatus = (stock) => {
  if (stock === 0)  return { label: 'Out of Stock', style: 'bg-red-100 text-red-600 border border-red-300'     }
  if (stock <= 20)  return { label: 'Low Stock',    style: 'bg-amber-100 text-amber-700 border border-amber-300' }
  return              { label: 'In Stock',     style: 'bg-green-100 text-green-700 border border-green-300'  }
}

const ITEMS_PER_PAGE = 8

export default function ProductsPage() {
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')
  const [view, setView]         = useState('table') // 'table' | 'grid'
  const [page, setPage]         = useState(1)

  const categories = ['All', ...new Set(products.map((p) => p.category))]

  const filtered = products.filter((p) => {
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || p.category === category
    return matchSearch && matchCategory
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Products</h1>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200">

        {/* Filters */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-gray-400" />
              <input
                suppressHydrationWarning
                type="text"
                placeholder="Search product or SKU"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
              />
            </div>

            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none cursor-pointer"
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                view === 'table' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                view === 'grid' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Table view */}
        {view === 'table' && (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800 text-white text-sm">
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                    No products found.
                  </td>
                </tr>
              ) : (
                paginated.map((p, i) => {
                  const { label, style } = stockStatus(p.stock)
                  return (
                    <tr
                      key={p.id}
                      className={`text-sm border-b border-gray-100 hover:bg-gray-50 transition ${
                        i === paginated.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      {/* Product */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-xl flex-shrink-0">
                            {p.image}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>

                      {/* Category */}
                      <td className="px-5 py-3 text-gray-600 text-sm">{p.category}</td>

                      {/* Price */}
                      <td className="px-5 py-3 font-semibold text-gray-800">
                        ₱{p.price.toLocaleString()}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-3 text-gray-700">{p.stock}</td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${style}`}>
                          {label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition">
                            <Pencil size={13} />
                          </button>
                          <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}

        {/* Grid view */}
        {view === 'grid' && (
          <div className="p-5 grid grid-cols-4 gap-4">
            {paginated.length === 0 ? (
              <p className="col-span-4 text-center py-10 text-gray-400 text-sm">No products found.</p>
            ) : (
              paginated.map((p) => {
                const { label, style } = stockStatus(p.stock)
                return (
                  <div key={p.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
                    <div className="w-full h-24 bg-gray-50 rounded-lg flex items-center justify-center text-4xl mb-3">
                      {p.image}
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400 mb-2">{p.category} · {p.sku}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900">₱{p.price.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style}`}>
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition">
                        <Pencil size={12} /> Edit
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 transition"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                    p === page ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 transition"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}