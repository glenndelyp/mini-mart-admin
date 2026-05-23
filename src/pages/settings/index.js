import { useState } from 'react'
import {
  Store, Truck, ArrowLeftRight, CheckCircle,
  User, Bell, Lock, Users,
} from 'lucide-react'
import GeneralSettings from './GeneralSettings'
import MembersSettings from './MembersSettings'
import LoginSecuritySettings from './LoginSecuritySettings'

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'general',     label: 'General',          icon: User  },
  { key: 'login',       label: 'Login & security', icon: Lock  },
  { key: 'members',     label: 'Members',          icon: Users },
  { key: 'fulfillment', label: 'Fulfillment',      icon: Truck },
]

// ─── Fulfillment ──────────────────────────────────────────────────────────────
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

  useState(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { const v = d?.value ?? 'pickup'; setMode(v); setSaved(v) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: mode }),
      })
      if (!res.ok) throw new Error()
      setSaved(mode); setToast('success')
    } catch { setToast('error') }
    finally { setSaving(false); setTimeout(() => setToast(null), 3000) }
  }

  const banner = BANNER[mode] ?? BANNER.pickup

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-sm font-bold text-slate-800 mb-1">Fulfillment &amp; Delivery</h2>
      <p className="text-xs text-slate-400 mb-5 leading-relaxed">Control how customers receive their orders. Changes apply immediately to new orders.</p>
      <div className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border text-xs mb-5 leading-relaxed ${banner.style}`}>
        <Store size={14} className="mt-0.5 shrink-0" /><span>{banner.text}</span>
      </div>
      {loading ? (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[0,1,2].map(i => <div key={i} className="h-28 rounded-xl border border-slate-100 bg-slate-50 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {MODES.map(m => {
            const Icon = m.icon; const active = mode === m.value
            return (
              <button key={m.value} onClick={() => setMode(m.value)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${active ? 'border-green-800 bg-green-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                {active && (
                  <span className="absolute top-2.5 right-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-green-800">
                    <CheckCircle size={11} className="text-white" />
                  </span>
                )}
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg mb-3 ${active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon size={18} />
                </div>
                <p className="text-xs font-semibold text-slate-800 mb-1">{m.label}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{m.desc}</p>
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
          className="text-xs font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition disabled:opacity-40">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving || mode === saved}
          className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition disabled:opacity-40"
          style={{ backgroundColor: '#14532d' }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

// ─── Settings page ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeNav, setActiveNav] = useState('general')

  const BUILT = ['general', 'login', 'fulfillment', 'members']

  return (
    <div className="flex gap-6">
      <aside className="w-48 shrink-0">
        <nav className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {NAV_ITEMS.map((item, i) => {
            const Icon   = item.icon
            const active = activeNav === item.key
            return (
              <button key={item.key} onClick={() => setActiveNav(item.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors text-left ${i > 0 ? 'border-t border-slate-100' : ''} ${active ? 'bg-green-50 text-green-900 font-semibold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
                <Icon size={14} className={active ? 'text-green-800' : 'text-slate-400'} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your store configuration.</p>
        </div>

        {activeNav === 'general'     && <GeneralSettings />}
        {activeNav === 'login'       && <LoginSecuritySettings />}
        {activeNav === 'fulfillment' && <FulfillmentSettings />}
        {activeNav === 'members'     && <MembersSettings />}

        {!BUILT.includes(activeNav) && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
            {(() => {
              const Item = NAV_ITEMS.find(n => n.key === activeNav)
              const Icon = Item?.icon
              return Icon ? <Icon size={28} className="text-slate-300 mb-3" /> : null
            })()}
            <p className="text-sm font-semibold text-slate-500">
              {NAV_ITEMS.find(n => n.key === activeNav)?.label} settings coming soon.
            </p>
            <p className="text-xs text-slate-400 mt-1">This section is under construction.</p>
          </div>
        )}
      </div>
    </div>
  )
}