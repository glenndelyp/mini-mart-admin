// src/pages/settings/index.js
import { useState, useEffect } from 'react'
import { Store, Truck, ArrowLeftRight, CheckCircle } from 'lucide-react'

const MODES = [
  { value: 'pickup',   label: 'Pick-up only',      icon: Store,          desc: 'Customers collect at the store. Delivery shown as unavailable.'        },
  { value: 'delivery', label: 'Delivery only',      icon: Truck,          desc: "Orders are delivered to the customer's address. No in-store pickup."  },
  { value: 'both',     label: 'Pick-up & Delivery', icon: ArrowLeftRight, desc: 'Customers choose their preferred method at checkout.'                  },
]

const BANNER = {
  pickup:   { style: 'bg-amber-50 border-amber-200 text-amber-800',       text: 'Delivery is currently disabled. Customers see a "Delivery unavailable" label at checkout.' },
  delivery: { style: 'bg-emerald-50 border-emerald-200 text-emerald-800', text: 'Delivery is enabled. Customers will be prompted for a delivery address.'                   },
  both:     { style: 'bg-sky-50 border-sky-200 text-sky-800',             text: 'Both pick-up and delivery are enabled. Customers choose at checkout.'                      },
}

function FulfillmentSettings() {
  const [mode,    setMode]    = useState('pickup')
  const [saved,   setSaved]   = useState('pickup')
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => { const v = data?.value ?? 'pickup'; setMode(v); setSaved(v) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ value: mode }),
      })
      if (!res.ok) throw new Error()
      setSaved(mode)
      setToast('success')
    } catch {
      setToast('error')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  const banner = BANNER[mode] ?? BANNER.pickup

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-base font-bold text-slate-800 mb-1">Fulfillment &amp; Delivery</h2>
      <p className="text-sm text-slate-400 mb-5">Control how customers receive their orders. Changes apply immediately to new orders.</p>

      <div className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border text-sm mb-5 ${banner.style}`}>
        <Store size={15} className="mt-0.5 shrink-0" />
        <span>{banner.text}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[0,1,2].map(i => <div key={i} className="h-28 rounded-xl border border-slate-100 bg-slate-50 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {MODES.map(m => {
            const Icon = m.icon
            const active = mode === m.value
            return (
              <button key={m.value} onClick={() => setMode(m.value)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${active ? 'border-green-800 bg-green-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                {active && (
                  <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-green-800">
                    <CheckCircle size={11} className="text-white" />
                  </span>
                )}
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon size={18} />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{m.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {toast === 'success' && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <CheckCircle size={12} /> Saved
          </span>
        )}
        {toast === 'error' && (
          <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">Failed to save. Try again.</span>
        )}
        <button onClick={() => setMode(saved)} disabled={saving}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition disabled:opacity-40">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || mode === saved}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition disabled:opacity-40"
          style={{ backgroundColor: '#14532d' }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage your store configuration.</p>
      </div>
      <div className="flex flex-col gap-5">
        <FulfillmentSettings />
      </div>
    </div>
  )
}