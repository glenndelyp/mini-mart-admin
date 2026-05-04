// src/components/orders/OrderActionModal.js
import { useState, useEffect } from 'react'
import { X, CheckCircle, Truck, PackageCheck, XCircle, Clock, MapPin, ShoppingBag, Timer } from 'lucide-react'

// ─── Per-action config ────────────────────────────────────────────────────────
const ACTION_META = {
  confirm: {
    icon:      CheckCircle,
    iconBg:    '#eff6ff',
    iconColor: '#2563eb',
    title:     'Confirm Order',
    desc:      'Confirm this order and set an estimated delivery time for the customer.',
    btnLabel:  'Confirm Order',
    btnBg:     '#2563eb',
    hasEta:    true,
  },
  transit: {
    icon:      Truck,
    iconBg:    '#f5f3ff',
    iconColor: '#7c3aed',
    title:     'Mark Out for Delivery',
    desc:      'This order will be marked as out for delivery. The customer will see it in transit.',
    btnLabel:  'Out for Delivery',
    btnBg:     '#7c3aed',
    hasEta:    false,
  },
  deliver: {
    icon:      PackageCheck,
    iconBg:    '#f0fdf4',
    iconColor: '#15803d',
    title:     'Mark as Delivered',
    desc:      'Confirm that this order has been successfully delivered to the customer.',
    btnLabel:  'Mark Delivered',
    btnBg:     '#15803d',
    hasEta:    false,
  },
  cancel: {
    icon:      XCircle,
    iconBg:    '#fef2f2',
    iconColor: '#dc2626',
    title:     'Cancel Order',
    desc:      'Are you sure you want to cancel this order? This action cannot be undone.',
    btnLabel:  'Yes, Cancel Order',
    btnBg:     '#dc2626',
    hasEta:    false,
  },
}

// ─── Quick-pick presets (minutes) ─────────────────────────────────────────────
const PRESETS = [
  { label: '15 min',  value: 15  },
  { label: '30 min',  value: 30  },
  { label: '45 min',  value: 45  },
  { label: '1 hr',    value: 60  },
  { label: '1.5 hr',  value: 90  },
  { label: '2 hr',    value: 120 },
]

export default function OrderActionModal({ modal, onClose, onSuccess }) {
  // etaMinutes = numeric minutes (the single source of truth)
  const [etaMinutes, setEtaMinutes] = useState('')
  const [inputVal,   setInputVal]   = useState('')   // raw text in the number box
  const [loading,    setLoading]    = useState(false)
  const [apiError,   setApiError]   = useState('')

  const isOpen = !!modal
  const { type, order } = modal ?? {}
  const meta = ACTION_META[type] ?? null

  useEffect(() => {
    if (!isOpen) return
    setEtaMinutes('')
    setInputVal('')
    setApiError('')
    setLoading(false)
  }, [isOpen, type])

  // ── Keep inputVal and etaMinutes in sync ──────────────────────────────────
  const handleInputChange = (raw) => {
    // Only allow digits
    const digits = raw.replace(/\D/g, '')
    setInputVal(digits)
    const num = parseInt(digits, 10)
    setEtaMinutes(digits === '' ? '' : isNaN(num) || num < 1 ? '' : num)
    setApiError('')
  }

  const handlePreset = (minutes) => {
    setEtaMinutes(minutes)
    setInputVal(String(minutes))
    setApiError('')
  }

  // ── Preview label ─────────────────────────────────────────────────────────
  const etaLabel = () => {
    if (!etaMinutes) return null
    const m = parseInt(etaMinutes, 10)
    if (m < 60) return `${m} minute${m !== 1 ? 's' : ''}`
    const hrs = Math.floor(m / 60)
    const rem = m % 60
    return rem === 0
      ? `${hrs} hour${hrs !== 1 ? 's' : ''}`
      : `${hrs} hr ${rem} min`
  }

  const handleSubmit = async () => {
    if (meta?.hasEta) {
      const m = parseInt(etaMinutes, 10)
      if (!etaMinutes || isNaN(m) || m < 1) {
        setApiError('Please enter a delivery time of at least 1 minute.')
        return
      }
      if (m > 480) {
        setApiError('Estimated delivery time cannot exceed 8 hours (480 minutes).')
        return
      }
    }

    setLoading(true)
    setApiError('')

    try {
      const res  = await fetch('/api/orders/update', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id:          order.id,
          action:      type,
          eta_minutes: meta?.hasEta ? parseInt(etaMinutes, 10) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Something went wrong.')
      onSuccess(data.order)
      onClose()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !meta) return null
  const Icon = meta.icon

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: meta.iconBg }}>
              <Icon size={20} style={{ color: meta.iconColor }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{meta.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Order #ORD-{String(order.id).padStart(4, '0')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">{meta.desc}</p>

          {/* Order summary card */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#14532d' }}
              >
                {order.customer_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{order.customer_name || '—'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                  <p className="text-xs text-slate-400 truncate">{order.delivery_address || 'No address'}</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingBag size={12} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                </p>
              </div>
              {order.items?.length > 0 ? order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <p className="text-xs text-slate-600 truncate max-w-[260px]">
                    <span className="font-medium">{item.quantity}×</span> {item.product_name}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 ml-2 flex-shrink-0">
                    ₱{parseFloat(item.subtotal).toFixed(2)}
                  </p>
                </div>
              )) : (
                <p className="text-xs text-slate-400 italic">No items</p>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Total</p>
              <p className="text-sm font-bold text-slate-800">
                ₱{parseFloat(order.total_amount).toFixed(2)}
              </p>
            </div>
          </div>

          {/* ── ETA section (confirm only) ── */}
          {meta.hasEta && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Estimated Delivery Time <span className="text-red-400">*</span>
              </label>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handlePreset(p.value)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                      parseInt(etaMinutes) === p.value
                        ? 'border-blue-400 text-blue-700 bg-blue-50'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Clock size={11} />
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400">or type custom</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Custom number input */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 flex-1 h-11 px-3 rounded-lg border transition bg-slate-50
                  ${apiError
                    ? 'border-red-300 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100'
                    : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-50'
                  }`}>
                  <Timer size={15} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 25"
                    value={inputVal}
                    onChange={e => handleInputChange(e.target.value)}
                    className="bg-transparent text-sm text-slate-800 outline-none w-full placeholder-slate-400"
                    maxLength={3}
                  />
                  <span className="text-xs text-slate-400 flex-shrink-0">min</span>
                </div>

                {/* Live preview badge */}
                {etaLabel() && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 whitespace-nowrap">
                    <Clock size={12} className="text-blue-500" />
                    <span className="text-xs font-semibold text-blue-700">{etaLabel()}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Enter minutes. The customer's app will show a live countdown timer.
              </p>
            </div>
          )}

          {/* API error */}
          {apiError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {apiError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            style={{ backgroundColor: meta.btnBg }}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Saving…' : meta.btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}