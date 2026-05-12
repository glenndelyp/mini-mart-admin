// src/pages/orders/index.js
import { useState, useEffect, useRef } from 'react'
import { Search, ShoppingBag, Clock, CheckCircle, Truck, XCircle, RefreshCw, ChevronLeft, ChevronRight, Trash2, Calendar, X } from 'lucide-react'
import OrderActionModal       from '@/components/orders/OrderActionModal'
import OrderDetailsDrawer     from '@/components/orders/OrderDetailsDrawer'
import ConfirmChecklistDrawer from '@/components/orders/ConfirmChecklistDrawer'
import MiniCalendar, { startOfDay, endOfDay, inRange, formatDateLabel, sameDay } from '@/components/layout/MiniCalendar'

// ─── Live countdown hook ───────────────────────────────────────────────────
function useCountdown(deadline) {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    if (!deadline) return
    const tick = () => {
      const diff = new Date(deadline) - new Date()
      if (diff <= 0) { setDisplay('Arriving now'); return }
      const totalSec = Math.floor(diff / 1000)
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60
      setDisplay(h > 0
        ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
        : `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline])
  return display
}

function CountdownCell({ deadline }) {
  const remaining = useCountdown(deadline)
  if (!deadline || !remaining) return null
  const isArriving = remaining === 'Arriving now'
  const isLow      = !isArriving && parseInt(remaining) < 5
  return (
    <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border
      ${isArriving ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : isLow     ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'}`}
    >
      <Clock size={9} />
      {remaining}
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:    { label: 'Pending',          style: 'bg-amber-50 text-amber-700 border border-amber-200',       icon: Clock       },
  confirmed:  { label: 'Confirmed',        style: 'bg-sky-50 text-sky-700 border border-sky-200',             icon: CheckCircle },
  in_transit: { label: 'Out for Delivery', style: 'bg-violet-50 text-violet-700 border border-violet-200',    icon: Truck       },
  delivered:  { label: 'Delivered',        style: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: CheckCircle },
  cancelled:  { label: 'Cancelled',        style: 'bg-red-50 text-red-500 border border-red-200',             icon: XCircle     },
}

const STAT_TABS  = ['All', 'Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled']
const STATUS_MAP = {
  'All':              'all',
  'Pending':          'pending',
  'Confirmed':        'confirmed',
  'Out for Delivery': 'in_transit',
  'Delivered':        'delivered',
  'Cancelled':        'cancelled',
}

const ITEMS_PER_PAGE = 8

// ─── Page ─────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders,         setOrders]         = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [search,         setSearch]         = useState('')
  const [tab,            setTab]            = useState('All')
  const [page,           setPage]           = useState(1)
  const [toast,          setToast]          = useState(null)
  const [detailOrder,    setDetailOrder]    = useState(null)
  const [checklistOrder, setChecklistOrder] = useState(null)
  const [actionModal,    setActionModal]    = useState(null)
  const [deleteModal,    setDeleteModal]    = useState(null)
  const [fulfillmentMode, setFulfillmentMode] = useState('pickup')


  // ── Date range filter ─────────────────────────────────────────────────────
  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd,   setRangeEnd]   = useState(null)
  const [showCal,    setShowCal]    = useState(false)
  const [pickStep,   setPickStep]   = useState('start')
  const calRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleCalSelect(date) {
    if (!date) { clearDateRange(); return }
    if (pickStep === 'start') {
      setRangeStart(startOfDay(date))
      setRangeEnd(null)
      setPickStep('end')
    } else {
      if (date < rangeStart) {
        setRangeEnd(endOfDay(rangeStart))
        setRangeStart(startOfDay(date))
      } else {
        setRangeEnd(endOfDay(date))
      }
      setPickStep('start')
      setShowCal(false)
      setPage(1)
    }
  }

  function clearDateRange() {
    setRangeStart(null)
    setRangeEnd(null)
    setPickStep('start')
    setPage(1)
  }

  const dateLabel = !rangeStart
    ? 'Filter by date'
    : !rangeEnd
      ? `${formatDateLabel(rangeStart)} → pick end`
      : sameDay(rangeStart, rangeEnd)
        ? formatDateLabel(rangeStart)
        : `${formatDateLabel(rangeStart)} – ${formatDateLabel(rangeEnd)}`

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

useEffect(() => {
  fetch('/api/settings')
    .then(r => r.json())
    .then(data => { if (data?.value) setFulfillmentMode(data.value) })
    .catch(() => {}) 
}, [])

  useEffect(() => { fetchOrders() }, [])

  const handleAction = ({ type, order }) => {
    if (type === 'confirm') setChecklistOrder(order)
    else setActionModal({ type, order })
  }

  const handleActionSuccess = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
    if (detailOrder?.id === updatedOrder.id) setDetailOrder(updatedOrder)
    const labels = {
      confirmed:  'Order confirmed successfully.',
      in_transit: 'Order is now out for delivery.',
      delivered:  'Order marked as delivered.',
      cancelled:  'Order has been cancelled.',
    }
    showToast(labels[updatedOrder.status] ?? 'Order updated.')
  }

  const handleDelete = async (order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to delete order.')
      }
      setOrders(prev => prev.filter(o => o.id !== order.id))
      if (detailOrder?.id === order.id) setDetailOrder(null)
      setDeleteModal(null)
      showToast('Order deleted.')
    } catch (err) {
      showToast(err.message, 'error')
      setDeleteModal(null)
    }
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  const dateActive  = rangeStart && rangeEnd
  const matchesDate = (o) => !dateActive || inRange(o.created_at, rangeStart, rangeEnd)

  const filtered = orders.filter(o => {
    const statusKey   = STATUS_MAP[tab]
    const matchTab    = statusKey === 'all' || o.status === statusKey
    const q           = search.toLowerCase()
    const matchSearch =
      String(o.id).includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.delivery_address?.toLowerCase().includes(q)
    return matchTab && matchSearch && matchesDate(o)
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Tab counts respect the active date filter
  const counts = Object.fromEntries(
    ['all', 'pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map(key => [
      key,
      orders.filter(o => (key === 'all' || o.status === key) && matchesDate(o)).length
    ])
  )

  {fulfillmentMode === 'pickup' && (
  <div className="flex items-center gap-2.5 mb-4 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
    <Truck size={14} className="shrink-0" />
    <span>
      Delivery is <strong>disabled</strong> — all orders are pick-up only.
    </span>
    
     <a href="/settings"
      className="ml-auto text-xs font-semibold underline whitespace-nowrap"
    >
      Change in Settings →
    </a>
  </div>
)}

  // ── Stat cards ─────────────────────────────────────────────────────────────
  // "Total Orders" excludes cancelled — matches dashboard behaviour
  const activeOrderCount = counts.pending + counts.confirmed + counts.in_transit + counts.delivered

  const topStats = [
    { label: 'Total Orders',     value: activeOrderCount,    dot: 'bg-violet-500',  note: 'Excludes cancelled' },
    { label: 'Pending',          value: counts.pending,      dot: 'bg-amber-500',   note: null },
    { label: 'Out for Delivery', value: counts.in_transit,   dot: 'bg-sky-500',     note: null },
    { label: 'Delivered',        value: counts.delivered,    dot: 'bg-emerald-500', note: null },
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

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">

        {topStats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
            <p className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />
              {s.label}
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {loading
                ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
                : s.value}
            </p>
            {s.note && (
              <p className="text-[10px] text-slate-300 mt-1">{s.note}</p>
            )}
          </div>
        ))}

        {/* Cancelled — same styling as other cards, red dot only */}
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            Cancelled
          </p>
          <p className="text-2xl font-bold text-slate-800">
            {loading
              ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
              : counts.cancelled}
          </p>
          <p className="text-[10px] text-slate-300 mt-1">Not counted in total</p>
        </div>

      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-slate-200">

        {/* Filters row */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 gap-4 flex-wrap">
          <div className="flex items-center gap-2">

            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                suppressHydrationWarning
                type="text"
                placeholder="Search order, customer, address…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
              />
            </div>

            {/* Date range picker */}
            <div ref={calRef} className="relative">
              <button
                onClick={() => setShowCal(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition
                  ${dateActive
                    ? 'bg-slate-800 text-white border-slate-800'
                    : showCal
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Calendar size={13} />
                {dateLabel}
                {(rangeStart || rangeEnd) && (
                  <span
                    role="button"
                    onClick={e => { e.stopPropagation(); clearDateRange() }}
                    className="ml-1 opacity-60 hover:opacity-100 transition"
                  >
                    <X size={11} />
                  </span>
                )}
              </button>

              {showCal && (
                <MiniCalendar
                  mode="range"
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  onSelect={handleCalSelect}
                  onClose={() => { setShowCal(false); if (!rangeEnd) { setRangeStart(null); setPickStep('start') } }}
                  align="left"
                />
              )}
            </div>

            {showCal && pickStep === 'end' && rangeStart && null /* hint now shown inside calendar */}
          </div>

          {/* Status tabs */}
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

        {/* Active date filter banner */}
        {dateActive && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs text-slate-500">
            <Calendar size={12} className="text-slate-400" />
            Showing orders from
            <span className="font-semibold text-slate-700">{formatDateLabel(rangeStart)}</span>
            to
            <span className="font-semibold text-slate-700">{formatDateLabel(rangeEnd)}</span>
            <button onClick={clearDateRange} className="ml-auto text-slate-400 hover:text-slate-600 transition underline">
              Clear filter
            </button>
          </div>
        )}

        {error && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error} — <button onClick={fetchOrders} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] font-semibold uppercase tracking-wide border-b border-slate-100">
              <th className="text-left px-5 py-3">Order</th>
              <th className="text-left px-5 py-3">Customer</th>
              <th className="text-left px-5 py-3">Items</th>
              <th className="text-left px-5 py-3">Address</th>
              <th className="text-left px-5 py-3">Total</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>

            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-slate-100">
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 2 ? '60%' : '70%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && paginated.map((order, i) => {
              const meta       = STATUS_META[order.status] ?? STATUS_META.pending
              const StatusIcon = meta.icon

              const rowAction = order.status === 'pending'    ? { label: 'Confirm',          style: 'text-sky-600 border-sky-200 hover:bg-sky-50',           onClick: () => setChecklistOrder(order) }
                              : order.status === 'confirmed'  ? { label: 'Out for Delivery',  style: 'text-violet-600 border-violet-200 hover:bg-violet-50',   onClick: () => setActionModal({ type: 'transit', order }) }
                              : order.status === 'in_transit' ? { label: 'Mark Delivered',    style: 'text-emerald-600 border-emerald-200 hover:bg-emerald-50', onClick: () => setActionModal({ type: 'deliver', order }) }
                              : null

              const canCancel = ['pending', 'confirmed', 'in_transit'].includes(order.status)
              const canDelete = order.status === 'cancelled'

              return (
                <tr
                  key={order.id}
                  className={`text-sm border-t border-slate-100 cursor-pointer transition-colors ${
                    i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/60'
                  }`}
                  onClick={() => setDetailOrder(order)}
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                    #ORD-{String(order.id).padStart(4, '0')}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800 text-sm">{order.customer_name || '—'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{order.customer_email || ''}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {order.items?.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <ShoppingBag size={12} className="text-slate-400" />
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
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
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.style}`}>
                      <StatusIcon size={11} />
                      {meta.label}
                    </span>
                    {order.status === 'confirmed' && order.delivery_deadline && (
                      <CountdownCell deadline={order.delivery_deadline} />
                    )}
                    {order.status === 'in_transit' && order.estimated_delivery && (
                      <p className="text-[10px] text-slate-400 mt-1">Est. {order.estimated_delivery}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs text-slate-600">
                      {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(order.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {rowAction && (
                        <button
                          onClick={rowAction.onClick}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition whitespace-nowrap ${rowAction.style}`}
                        >
                          {rowAction.label}
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
                      {canDelete && (
                        <button
                          onClick={() => setDeleteModal({ order })}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 size={11} />
                          Delete
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <span className="text-xs text-slate-300 italic">Completed</span>
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
                      {search || tab !== 'All' || dateActive ? 'No orders match your filters.' : 'No orders yet.'}
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      {search || tab !== 'All' || dateActive
                        ? 'Try adjusting your search, tab, or date range.'
                        : 'Orders from customers will appear here.'}
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
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 transition"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${p === page ? 'text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    style={p === page ? { backgroundColor: '#14532d' } : {}}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 transition"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Drawers & Modals ── */}
      <OrderDetailsDrawer
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onAction={handleAction}
      />
      <ConfirmChecklistDrawer
        order={checklistOrder}
        onClose={() => setChecklistOrder(null)}
        onConfirmed={handleActionSuccess}
      />
      <OrderActionModal
        modal={actionModal}
        onClose={() => setActionModal(null)}
        onSuccess={handleActionSuccess}
      />

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-red-50 border border-red-100 mb-4">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-slate-800 mb-1">Delete order?</h2>
            <p className="text-sm text-slate-500 mb-5">
              <span className="font-medium text-slate-700">
                #ORD-{String(deleteModal.order.id).padStart(4, '0')}
              </span>{' '}
              by <span className="font-medium text-slate-700">{deleteModal.order.customer_name}</span> will be permanently removed. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                Keep it
              </button>
              <button
                onClick={() => handleDelete(deleteModal.order)}
                className="text-sm font-semibold px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}