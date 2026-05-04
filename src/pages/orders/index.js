// src/pages/orders/index.js
import { useState, useEffect } from 'react'
import { Search, ShoppingBag, Clock, CheckCircle, Truck, XCircle, RefreshCw } from 'lucide-react'
import OrderActionModal from '@/components/orders/OrderActionModal'

// ─── Live countdown hook ──────────────────────────────────────────────────────
function useCountdown(deadline) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    if (!deadline) return

    const tick = () => {
      const diff = new Date(deadline) - new Date()
      if (diff <= 0) {
        setDisplay('Arriving now')
        return
      }
      const totalSec = Math.floor(diff / 1000)
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60

      if (h > 0) {
        setDisplay(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`)
      } else {
        setDisplay(`${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`)
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline])

  return display
}

// ─── Countdown cell — isolated so only it re-renders every second ─────────────
function CountdownCell({ deadline }) {
  const remaining = useCountdown(deadline)
  if (!deadline || !remaining) return null

  const isArriving = remaining === 'Arriving now'
  const isLow      = !isArriving && parseInt(remaining) < 5 // under 5 min

  return (
    <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border
      ${isArriving
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : isLow
          ? 'bg-red-50 text-red-600 border-red-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
    >
      <Clock size={9} />
      {remaining}
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:    { label: 'Pending',           style: 'bg-amber-50 text-amber-700 border border-amber-200',      icon: Clock       },
  confirmed:  { label: 'Confirmed',         style: 'bg-sky-50 text-sky-700 border border-sky-200',            icon: CheckCircle },
  in_transit: { label: 'Out for Delivery',  style: 'bg-violet-50 text-violet-700 border border-violet-200',   icon: Truck       },
  delivered:  { label: 'Delivered',         style: 'bg-emerald-50 text-emerald-700 border border-emerald-200',icon: CheckCircle },
  cancelled:  { label: 'Cancelled',         style: 'bg-red-50 text-red-500 border border-red-200',            icon: XCircle     },
}

const STAT_TABS = ['All', 'Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled']
const STATUS_MAP = {
  'All':              'all',
  'Pending':          'pending',
  'Confirmed':        'confirmed',
  'Out for Delivery': 'in_transit',
  'Delivered':        'delivered',
  'Cancelled':        'cancelled',
}

const ITEMS_PER_PAGE = 8

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders,      setOrders]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [search,      setSearch]      = useState('')
  const [tab,         setTab]         = useState('All')
  const [page,        setPage]        = useState(1)
  const [toast,       setToast]       = useState(null)
  const [actionModal, setActionModal] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError('')
      const res  = await fetch('/api/orders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch orders.')
      setOrders(data.orders)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleActionSuccess = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
    const labels = {
      confirmed:  'Order confirmed — countdown started.',
      in_transit: 'Order is now out for delivery.',
      delivered:  'Order marked as delivered.',
      cancelled:  'Order has been cancelled.',
    }
    showToast(labels[updatedOrder.status] ?? 'Order updated.')
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const statusKey   = STATUS_MAP[tab]
    const matchTab    = statusKey === 'all' || o.status === statusKey
    const q           = search.toLowerCase()
    const matchSearch =
      String(o.id).includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.delivery_address?.toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const counts = {
    all:        orders.length,
    pending:    orders.filter(o => o.status === 'pending').length,
    confirmed:  orders.filter(o => o.status === 'confirmed').length,
    in_transit: orders.filter(o => o.status === 'in_transit').length,
    delivered:  orders.filter(o => o.status === 'delivered').length,
    cancelled:  orders.filter(o => o.status === 'cancelled').length,
  }

  const topStats = [
    { label: 'Total Orders',     value: counts.all,        bg: 'bg-violet-50',  iconColor: 'text-violet-600'  },
    { label: 'Pending',          value: counts.pending,    bg: 'bg-amber-50',   iconColor: 'text-amber-600'   },
    { label: 'Out for Delivery', value: counts.in_transit, bg: 'bg-sky-50',     iconColor: 'text-sky-600'     },
    { label: 'Delivered',        value: counts.delivered,  bg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
  ]

  return (
    <div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg
            ${toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'}`}
          style={{ animation: 'fadeIn .25s ease' }}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Order Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track and manage all customer orders.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {topStats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}>
              <ShoppingBag size={18} className={s.iconColor} />
            </div>
            <p className="text-sm text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-800">
              {loading
                ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
                : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-slate-200">

        {/* Filters */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-72">
            <Search size={14} className="text-slate-400" />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search order ID, customer, address…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {STAT_TABS.map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(1) }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  tab === t ? 'text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
                style={tab === t ? { backgroundColor: '#14532d' } : {}}
              >
                {t}
                {!loading && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${tab === t ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {counts[STATUS_MAP[t]] ?? 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error} — <button onClick={fetchOrders} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="text-sm" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
              <th className="text-left px-5 py-3 font-medium">Order ID</th>
              <th className="text-left px-5 py-3 font-medium">Customer</th>
              <th className="text-left px-5 py-3 font-medium">Items</th>
              <th className="text-left px-5 py-3 font-medium">Address</th>
              <th className="text-left px-5 py-3 font-medium">Total</th>
              <th className="text-left px-5 py-3 font-medium">Status & ETA</th>
              <th className="text-left px-5 py-3 font-medium">Date</th>
              <th className="text-left px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>

            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-slate-100">
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 2 ? '90%' : '70%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && paginated.map((order, i) => {
              const meta       = STATUS_META[order.status] ?? STATUS_META.pending
              const StatusIcon = meta.icon
              const canConfirm = order.status === 'pending'
              const canTransit = order.status === 'confirmed'
              const canDeliver = order.status === 'in_transit'
              const canCancel  = !['delivered', 'cancelled'].includes(order.status)

              return (
                <tr key={order.id} className={`text-sm border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>

                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                    #ORD-{String(order.id).padStart(4, '0')}
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800 text-sm">{order.customer_name || '—'}</p>
                    <p className="text-xs text-slate-400">{order.customer_email || ''}</p>
                  </td>

                  <td className="px-5 py-3.5 max-w-[200px]">
                    {order.items?.length > 0 ? (
                      <div className="space-y-0.5">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <p key={idx} className="text-xs text-slate-600 truncate">
                            <span className="font-medium">{item.quantity}×</span> {item.product_name}
                          </p>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-xs text-slate-400 italic">+{order.items.length - 2} more</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">No items</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[160px] truncate">
                    {order.delivery_address || <span className="italic text-slate-300">No address</span>}
                  </td>

                  <td className="px-5 py-3.5 font-semibold text-slate-800">
                    ₱{parseFloat(order.total_amount).toFixed(2)}
                  </td>

                  {/* Status + live countdown */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.style}`}>
                      <StatusIcon size={11} />
                      {meta.label}
                    </span>

                    {/* Show countdown only for confirmed orders with a deadline */}
                    {order.status === 'confirmed' && order.delivery_deadline && (
                      <CountdownCell deadline={order.delivery_deadline} />
                    )}
                    {/* Show label for in_transit */}
                    {order.status === 'in_transit' && order.estimated_delivery && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Est. {order.estimated_delivery}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-slate-400 text-xs">
                    {new Date(order.created_at).toLocaleDateString('en-PH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                    <br />
                    <span className="text-[10px]">
                      {new Date(order.created_at).toLocaleTimeString('en-PH', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {canConfirm && (
                        <button
                          onClick={() => setActionModal({ type: 'confirm', order })}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 transition whitespace-nowrap"
                        >
                          Confirm
                        </button>
                      )}
                      {canTransit && (
                        <button
                          onClick={() => setActionModal({ type: 'transit', order })}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 transition whitespace-nowrap"
                        >
                          Out for Delivery
                        </button>
                      )}
                      {canDeliver && (
                        <button
                          onClick={() => setActionModal({ type: 'deliver', order })}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition whitespace-nowrap"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => setActionModal({ type: 'cancel', order })}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                        >
                          Cancel
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <span className="text-xs text-slate-300 italic">Completed</span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="text-xs text-slate-300 italic">Cancelled</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {!loading && !error && paginated.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <ShoppingBag size={32} className="text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-400">
                      {search || tab !== 'All' ? 'No orders match your filters.' : 'No orders yet.'}
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      {search || tab !== 'All' ? 'Try adjusting your search or tab.' : 'Orders from customers will appear here.'}
                    </p>
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
              Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} orders
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 transition">
                ← Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${p === page ? 'text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    style={p === page ? { backgroundColor: '#14532d' } : {}}>
                    {p}
                  </button>
                ))}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 transition">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      <OrderActionModal
        modal={actionModal}
        onClose={() => setActionModal(null)}
        onSuccess={handleActionSuccess}
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