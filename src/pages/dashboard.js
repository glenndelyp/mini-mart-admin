// src/pages/dashboard/index.js
import { useState, useEffect, useRef } from 'react'
import { ShoppingBag, Users, Package, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import MiniCalendar, {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  addDays, addWeeks, inRange, formatRangeLabel,
} from '@/components/layout/MiniCalendar'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcChange(curr, prev) {
  if (prev === 0) return { label: curr > 0 ? '+100%' : '0%', up: curr >= prev }
  const pct = ((curr - prev) / prev) * 100
  return { label: (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%', up: pct >= 0 }
}
function formatPHP(n) {
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Chart builders ───────────────────────────────────────────────────────────
function buildWeekChartData(orders, weekStart) {
  return DAY_LABELS.map((label, i) => {
    const day = addDays(weekStart, i)
    const dayOrders = orders.filter(o => inRange(o.created_at, startOfDay(day), endOfDay(day)))
    const revenue = dayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total_amount), 0)
    const count = dayOrders.filter(o => o.status !== 'cancelled').length
    return { label, revenue, orders: count }
  })
}

function buildDayChartData(orders, date) {
  return Array.from({ length: 24 }, (_, h) => {
    const start = new Date(date); start.setHours(h, 0, 0, 0)
    const end = new Date(date); end.setHours(h, 59, 59, 999)
    const hourOrders = orders.filter(o => inRange(o.created_at, start, end))
    const revenue = hourOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total_amount), 0)
    const count = hourOrders.filter(o => o.status !== 'cancelled').length
    const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
    return { label, revenue, orders: count }
  }).filter((_, h) => h >= 6 && h <= 22)
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-600 mb-1">{label}</p>
      <p className="text-emerald-700 font-bold">{formatPHP(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

function OrdersTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-600 mb-1">{label}</p>
      <p className="text-sky-700 font-bold">{payload[0]?.value ?? 0} orders</p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [mode, setMode] = useState('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCal, setShowCal] = useState(false)
  const calRef = useRef(null)

  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Close calendar on outside click
  useEffect(() => {
    function handleClick(e) {
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        const [oRes, pRes] = await Promise.all([
          fetch('/api/orders').then(r => r.json()),
          fetch('/api/products').then(r => r.json()),
        ])
        setOrders(oRes.orders ?? [])
        setProducts(pRes.products ?? [])
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Date ranges ──────────────────────────────────────────────────────────────
  const currStart = mode === 'day' ? startOfDay(selectedDate) : startOfWeek(selectedDate)
  const currEnd   = mode === 'day' ? endOfDay(selectedDate)   : endOfWeek(selectedDate)
  const prevStart = mode === 'day' ? startOfDay(addDays(selectedDate, -1))  : startOfWeek(addWeeks(selectedDate, -1))
  const prevEnd   = mode === 'day' ? endOfDay(addDays(selectedDate, -1))    : endOfWeek(addWeeks(selectedDate, -1))

  const currOrders = orders.filter(o => inRange(o.created_at, currStart, currEnd))
  const prevOrders = orders.filter(o => inRange(o.created_at, prevStart, prevEnd))

  const revCurr   = currOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total_amount), 0)
  const revPrev   = prevOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total_amount), 0)
  const revChange = calcChange(revCurr, revPrev)

  const activeCurr = currOrders.filter(o => o.status !== 'cancelled')
  const activePrev = prevOrders.filter(o => o.status !== 'cancelled')
  const ordChange  = calcChange(activeCurr.length, activePrev.length)

  const custCurr   = new Set(currOrders.map(o => o.user_id)).size
  const custPrev   = new Set(prevOrders.map(o => o.user_id)).size
  const custChange = calcChange(custCurr, custPrev)

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.threshold).length
  const outStock = products.filter(p => p.stock === 0).length

  // ── Chart data ───────────────────────────────────────────────────────────────
  const chartData      = mode === 'week'
    ? buildWeekChartData(orders, startOfWeek(selectedDate))
    : buildDayChartData(orders, selectedDate)
  const hasRevenueData = chartData.some(d => d.revenue > 0)
  const hasOrderData   = chartData.some(d => d.orders > 0)

  // ── Top products ─────────────────────────────────────────────────────────────
  const productSales = {}
  for (const order of currOrders) {
    for (const item of order.items ?? []) {
      if (!productSales[item.product_name]) productSales[item.product_name] = 0
      productSales[item.product_name] += item.quantity
    }
  }
  const topProducts  = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }))
  const recentOrders = currOrders.slice(0, 5)

  const stats = [
    { label: 'Total Revenue',   value: formatPHP(revCurr),          change: revChange.label,  up: revChange.up,  icon: TrendingUp,  bg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Total Orders',    value: activeCurr.length.toString(), change: ordChange.label,  up: ordChange.up,  icon: ShoppingBag, bg: 'bg-sky-50',     iconColor: 'text-sky-600'     },
    { label: 'Total Customers', value: custCurr.toString(),          change: custChange.label, up: custChange.up, icon: Users,       bg: 'bg-violet-50',  iconColor: 'text-violet-600'  },
    { label: 'Low Stock Items', value: lowStock,                     change: `${outStock} out of stock`, up: false, icon: Package,  bg: 'bg-amber-50',   iconColor: 'text-amber-600'   },
  ]

  const statusColor = (s) => ({
    delivered: 'bg-emerald-100 text-emerald-700',
    confirmed: 'bg-sky-100 text-sky-700',
    pending:   'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
  }[s] ?? 'bg-slate-100 text-slate-600')

  function navigate(dir) {
    setSelectedDate(d => mode === 'day' ? addDays(d, dir) : addWeeks(d, dir))
  }

  const compareLabel  = mode === 'day' ? 'vs yesterday' : 'vs last week'
  const chartTitle    = mode === 'day' ? "Today's Revenue"    : 'Weekly Revenue'
  const chartSubtitle = mode === 'day' ? 'Hourly revenue breakdown' : 'Daily revenue this week'
  const trendTitle    = mode === 'day' ? "Today's Orders"     : 'Order Trends'
  const trendSubtitle = mode === 'day' ? 'Hourly order volume' : 'Daily order volume this week'

  // ── Today's date values ──────────────────────────────────────────────────────
  const today = new Date()

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
         <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2">
            Welcome back — here's what's happening today.
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2.5 py-0.5 text-xs font-medium text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
            {['day', 'week'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all capitalize ${
                  mode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => navigate(-1)} className="px-2 py-2 hover:bg-slate-50 transition-colors border-r border-slate-200">
              <ChevronLeft size={15} className="text-slate-500" />
            </button>
            <span className="text-xs font-semibold text-slate-700 px-3 whitespace-nowrap">
              {formatRangeLabel(mode, selectedDate)}
            </span>
            <button onClick={() => navigate(1)} className="px-2 py-2 hover:bg-slate-50 transition-colors border-l border-slate-200">
              <ChevronRight size={15} className="text-slate-500" />
            </button>
          </div>

          <div ref={calRef} className="relative">
            <button
              onClick={() => setShowCal(v => !v)}
              className={`p-2 rounded-lg border transition-all ${
                showCal
                  ? 'bg-slate-800 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {/* calendar icon inline so we don't need lucide Calendar import here */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8"  y1="2" x2="8"  y2="6" />
                <line x1="3"  y1="10" x2="21" y2="10" />
              </svg>
            </button>
            {showCal && (
              <MiniCalendar
                mode={mode}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                onClose={() => setShowCal(false)}
                align="right"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-5">
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-slate-100 mb-3" />
                <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
                <div className="h-7 w-16 bg-slate-100 rounded" />
              </div>
            ))
          : stats.map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}>
                    <Icon size={18} className={s.iconColor} />
                  </div>
                  <p className="text-sm text-slate-500 mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                  <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
                    {s.up ? '▲' : '▼'} {s.change} {compareLabel}
                  </p>
                </div>
              )
            })
        }
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">{chartTitle}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{chartSubtitle}</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#f0fdf4', color: '#14532d' }}>
              {formatPHP(revCurr)}
            </span>
          </div>
          {loading ? (
            <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
          ) : !hasRevenueData ? (
            <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <TrendingUp size={28} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400 font-medium">No revenue for this period</p>
              <p className="text-xs text-slate-300 mt-1">Only delivered orders count as revenue</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#14532d" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#14532d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₱${(v / 1000).toFixed(1)}k` : `₱${v}`} />
                <Tooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#14532d" strokeWidth={2}
                  fill="url(#revenueGrad)" dot={{ fill: '#14532d', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800">{trendTitle}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{trendSubtitle}</p>
          </div>
          {loading ? (
            <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
          ) : !hasOrderData ? (
            <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <ShoppingBag size={28} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400 font-medium">No orders this period</p>
              <p className="text-xs text-slate-300 mt-1">Data will appear over time</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<OrdersTooltip />} />
                <Bar dataKey="orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Recent Orders</h2>
            <a href="/orders" className="text-xs font-medium hover:underline" style={{ color: '#14532d' }}>View all →</a>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-semibold uppercase tracking-wide border-b border-slate-100">
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Order ID</th>
                <th className="text-left px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-3 bg-slate-100 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-14">
                      <ShoppingBag size={28} className="text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400 font-medium">No orders for this period</p>
                      <p className="text-xs text-slate-300 mt-1">Try selecting a different date</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-700">{order.customer_name ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {order.items?.[0]?.product_name ?? '—'}
                      {order.items?.length > 1 && <span className="text-xs text-slate-400"> +{order.items.length - 1} more</span>}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">#{order.id}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-800">{formatPHP(order.total_amount)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Top Products</h2>
            <a href="/inventory" className="text-xs font-medium hover:underline" style={{ color: '#14532d' }}>View all →</a>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <Package size={28} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400 font-medium">No products yet</p>
              <p className="text-xs text-slate-300 mt-1">Top sellers will show here</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-700 truncate max-w-[140px]">{p.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{p.qty} sold</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  )
}