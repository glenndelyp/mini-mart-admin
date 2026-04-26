import { useState, useEffect } from 'react'
import { ShoppingBag, Users, Package, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [lowStock, setLowStock] = useState(0)

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        const count = data.products.filter(
          p => p.stock > 0 && p.stock <= p.threshold
        ).length
        setLowStock(count)
      })
      .catch(() => {})
  }, [])

  const stats = [
    { label: 'Total Revenue',   value: '₱0',    change: '0%', up: true,  icon: TrendingUp,  bg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Total Orders',    value: '0',      change: '0%', up: true,  icon: ShoppingBag, bg: 'bg-sky-50',     iconColor: 'text-sky-600'     },
    { label: 'Total Customers', value: '0',      change: '0%', up: true,  icon: Users,       bg: 'bg-violet-50',  iconColor: 'text-violet-600'  },
    { label: 'Low Stock Items', value: lowStock, change: '0',  up: false, icon: Package,     bg: 'bg-amber-50',   iconColor: 'text-amber-600'   },
  ]

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Welcome back — here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}>
                <Icon size={18} className={s.iconColor} />
              </div>
              <p className="text-sm text-slate-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {s.up ? '▲' : '▼'} {s.change} vs last week
              </p>
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5">

        {/* Revenue chart empty */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Weekly Revenue</h2>
              <p className="text-xs text-slate-400 mt-0.5">This week's sales performance</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#f0fdf4', color: '#14532d' }}>
              This Week
            </span>
          </div>
          <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <TrendingUp size={28} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-400 font-medium">No revenue data yet</p>
            <p className="text-xs text-slate-300 mt-1">Chart will appear once orders come in</p>
          </div>
        </div>

        {/* Order trends empty */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800">Order Trends</h2>
            <p className="text-xs text-slate-400 mt-0.5">Monthly order volume</p>
          </div>
          <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ShoppingBag size={28} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-400 font-medium">No order trends yet</p>
            <p className="text-xs text-slate-300 mt-1">Data will appear over time</p>
          </div>
        </div>

      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-5">

        {/* Recent orders */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Recent Orders</h2>
            <a href="/orders" className="text-xs font-medium hover:underline" style={{ color: '#14532d' }}>
              View all →
            </a>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
                <th className="text-left px-5 py-3 font-medium">Customer</th>
                <th className="text-left px-5 py-3 font-medium">Product</th>
                <th className="text-left px-5 py-3 font-medium">Order ID</th>
                <th className="text-left px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-14">
                    <ShoppingBag size={28} className="text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400 font-medium">No orders yet</p>
                    <p className="text-xs text-slate-300 mt-1">Recent orders will appear here</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Top Products</h2>
            <a href="/inventory" className="text-xs font-medium hover:underline" style={{ color: '#14532d' }}>
              View all →
            </a>
          </div>
          <div className="flex flex-col items-center justify-center py-14">
            <Package size={28} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-400 font-medium">No products yet</p>
            <p className="text-xs text-slate-300 mt-1">Top sellers will show here</p>
          </div>
        </div>

      </div>
    </div>
  )
}