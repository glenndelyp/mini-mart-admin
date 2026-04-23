import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function OrdersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          + Add Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {['Total Orders', 'New Orders', 'Completed Orders', 'Cancelled Orders'].map((label) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-300">0</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          <ShoppingBag size={28} className="text-indigo-400" />
        </div>
        <p className="text-base font-semibold text-gray-600">No orders yet</p>
        <p className="text-sm text-gray-400 mt-1 mb-5">Orders will appear here once customers start purchasing</p>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          + Add First Order
        </button>
      </div>
    </div>
  )
}