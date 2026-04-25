import { ShoppingBag } from 'lucide-react'

export default function OrdersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Order Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">View and manage all customer orders.</p>
        </div>
        <button className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#14532d' }}>
          + Add Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {[
          { label: 'Total Orders',      bg: 'bg-violet-50',  iconColor: 'text-violet-600'  },
          { label: 'New Orders',        bg: 'bg-sky-50',     iconColor: 'text-sky-600'     },
          { label: 'Completed Orders',  bg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
          { label: 'Cancelled Orders',  bg: 'bg-red-50',     iconColor: 'text-red-500'     },
        ].map(({ label, bg, iconColor }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
              <ShoppingBag size={18} className={iconColor} />
            </div>
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-800">0</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <ShoppingBag size={28} className="text-slate-400" />
        </div>
        <p className="text-base font-semibold text-slate-600">No orders yet</p>
        <p className="text-sm text-slate-400 mt-1 mb-5">Orders will appear here once customers start purchasing</p>
        <button className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#14532d' }}>
          + Add First Order
        </button>
      </div>
    </div>
  )
}