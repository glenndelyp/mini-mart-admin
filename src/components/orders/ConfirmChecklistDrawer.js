// src/components/orders/ConfirmChecklistDrawer.js
import { useState } from 'react'
import { X, Package, CheckCircle, MapPin, AlertCircle } from 'lucide-react'

export default function ConfirmChecklistDrawer({ order, onClose, onConfirmed }) {
  const [checked,    setChecked]    = useState({})
  const [notes,      setNotes]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  if (!order) return null

  const items      = order.items ?? []
  const checkedCount = Object.values(checked).filter(Boolean).length
  const allChecked   = items.length > 0 && checkedCount === items.length

  const toggleItem = (idx) => {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const handleConfirm = async () => {
    if (!allChecked) return
    try {
      setLoading(true)
      setError('')
      const res  = await fetch(`/api/orders/${order.id}`, { method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'confirmed', notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to confirm order.')
      onConfirmed(data.order)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-screen w-[440px] bg-white shadow-2xl z-50 flex flex-col"
        style={{ animation: 'slideIn .25s ease' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Confirm Order</p>
              <h2 className="text-lg font-bold text-slate-800">
                #ORD-{String(order.id).padStart(4, '0')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Customer + address */}
          <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: '#14532d' }}>
              {order.customer_name?.[0]?.toUpperCase() ?? 'C'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">{order.customer_name}</p>
              {order.delivery_address && (
                <div className="flex items-start gap-1 mt-0.5">
                  <MapPin size={10} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-snug">{order.delivery_address}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-slate-600">
              Items Verified
            </p>
            <p className="text-xs font-bold" style={{ color: allChecked ? '#14532d' : '#64748b' }}>
              {checkedCount} / {items.length}
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width:           `${progress}%`,
                backgroundColor: allChecked ? '#14532d' : '#f59e0b',
              }}
            />
          </div>
          {!allChecked && (
            <p className="text-[10px] text-slate-400 mt-1.5">
              Check off each item to enable confirmation
            </p>
          )}
          {allChecked && (
            <p className="text-[10px] mt-1.5 font-semibold" style={{ color: '#14532d' }}>
              ✓ All items verified — ready to confirm
            </p>
          )}
        </div>

        {/* Checklist */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Order Checklist
          </p>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <Package size={28} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No items found for this order.</p>
            </div>
          )}

          <div className="space-y-2">
            {items.map((item, idx) => {
              const isChecked = !!checked[idx]
              return (
                <button
                  key={idx}
                  onClick={() => toggleItem(idx)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left
                    ${isChecked
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                >
                  {/* Checkbox */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all
                    ${isChecked
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Item icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                    ${isChecked ? 'bg-emerald-100' : 'bg-white border border-slate-200'}`}
                  >
                    <Package size={15} className={isChecked ? 'text-emerald-600' : 'text-slate-400'} />
                  </div>

                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate transition-colors
                      ${isChecked ? 'text-emerald-800' : 'text-slate-700'}`}
                    >
                      {item.product_name}
                    </p>
                    <p className={`text-xs transition-colors ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`}>
                      Qty: {item.quantity}  ·  ₱{parseFloat(item.price ?? 0).toFixed(2)} each
                    </p>
                  </div>

                  {/* Subtotal */}
                  <p className={`text-sm font-bold flex-shrink-0 transition-colors
                    ${isChecked ? 'text-emerald-700' : 'text-slate-600'}`}
                  >
                    ₱{parseFloat(item.subtotal ?? (item.price * item.quantity) ?? 0).toFixed(2)}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Staff notes */}
          <div className="mt-5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. item substitution, customer request…"
              rows={2}
              className="w-full text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-300 resize-none placeholder-slate-300"
            />
          </div>

          {/* Order total */}
          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-sm text-slate-500">Order Total</span>
            <span className="text-base font-bold text-slate-800">
              ₱{parseFloat(order.total_amount ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          {error && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!allChecked || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg text-white transition-all"
              style={{
                backgroundColor: allChecked ? '#14532d' : '#cbd5e1',
                cursor: allChecked ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Confirming…
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  {allChecked ? 'Confirm Order' : `Check all items (${checkedCount}/${items.length})`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}