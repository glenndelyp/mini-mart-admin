import { ShoppingBag, Users, Package, TrendingUp } from 'lucide-react'

const stats = [
  { label: 'Total Revenue',   value: '₱0',  change: '0%',  up: true,  icon: TrendingUp,  color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Total Orders',    value: '0',   change: '0%',  up: true,  icon: ShoppingBag, color: 'bg-green-50  text-green-600'  },
  { label: 'Total Customers', value: '0',   change: '0%',  up: true,  icon: Users,       color: 'bg-blue-50   text-blue-600'   },
  { label: 'Low Stock Items', value: '0',   change: '0',   up: false, icon: Package,     color: 'bg-amber-50  text-amber-600'  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                <Icon size={18} />
              </div>
              <p className="text-sm text-gray-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${s.up ? 'text-green-600' : 'text-red-500'}`}>
                {s.up ? '▲' : '▼'} {s.change} vs last week
              </p>
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5">

        {/* Revenue chart empty */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Weekly Revenue</h2>
              <p className="text-xs text-gray-400 mt-0.5">This week's sales performance</p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1 rounded-full">
              This Week
            </span>
          </div>
          <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <TrendingUp size={28} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 font-medium">No revenue data yet</p>
            <p className="text-xs text-gray-300 mt-1">Chart will appear once orders come in</p>
          </div>
        </div>

        {/* Order trends empty */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-800">Order Trends</h2>
            <p className="text-xs text-gray-400 mt-0.5">Monthly order volume</p>
          </div>
          <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <ShoppingBag size={28} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 font-medium">No order trends yet</p>
            <p className="text-xs text-gray-300 mt-1">Data will appear over time</p>
          </div>
        </div>

      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-5">

        {/* Recent orders empty */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Recent Orders</h2>
            <a href="/orders" className="text-xs text-indigo-600 hover:underline font-medium">
              View all →
            </a>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800 text-white text-xs">
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
                    <ShoppingBag size={28} className="text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No orders yet</p>
                    <p className="text-xs text-gray-300 mt-1">Recent orders will appear here</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Top products empty */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Top Products</h2>
            <a href="/inventory" className="text-xs text-indigo-600 hover:underline font-medium">
              View all →
            </a>
          </div>
          <div className="flex flex-col items-center justify-center py-14">
            <Package size={28} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 font-medium">No products yet</p>
            <p className="text-xs text-gray-300 mt-1">Top sellers will show here</p>
          </div>
        </div>

      </div>
    </div>
  )
}