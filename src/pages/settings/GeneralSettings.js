import { useState, useEffect } from 'react'
import { CheckCircle, Phone, Mail, MapPin } from 'lucide-react'

// ─── Shared sub-components ────────────────────────────────────────────────────
function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full h-9 px-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-green-700 focus:bg-white transition placeholder-slate-400'

function Toggle({ checked, onChange, label, sub }) {
  return (
    <div className="flex items-center justify-between py-3 border-t border-slate-100 first:border-0 first:pt-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-green-700' : 'bg-slate-200'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_HOURS = [
  { open: '07:00', close: '21:00', enabled: true },
  { open: '07:00', close: '21:00', enabled: true },
  { open: '07:00', close: '21:00', enabled: true },
  { open: '07:00', close: '21:00', enabled: true },
  { open: '07:00', close: '21:00', enabled: true },
  { open: '08:00', close: '20:00', enabled: true },
  { open: '09:00', close: '18:00', enabled: true },
]

// ─── GeneralSettings ──────────────────────────────────────────────────────────
export default function GeneralSettings() {
  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState(null)

  // Contact
  const [phone,    setPhone]    = useState('')
  const [email,    setEmail]    = useState('')
  const [street,   setStreet]   = useState('')
  const [city,     setCity]     = useState('Zamboanga City')
  const [province, setProvince] = useState('Zamboanga Peninsula')

  // Hours
  const [hours, setHours] = useState(DEFAULT_HOURS)

  // Preferences
  const [acceptOrders,    setAcceptOrders]    = useState(true)
  const [showOnApp,       setShowOnApp]       = useState(true)
  const [lowStockAlerts,  setLowStockAlerts]  = useState(true)
  const [allowCancels,    setAllowCancels]    = useState(true)

  useEffect(() => {
    fetch('/api/settings/general')
      .then(r => r.json())
      .then(d => {
        if (!d) return
        if (d.phone)                         setPhone(d.phone)
        if (d.email)                         setEmail(d.email)
        if (d.street)                        setStreet(d.street)
        if (d.city)                          setCity(d.city)
        if (d.province)                      setProvince(d.province)
        if (d.hours)                         setHours(d.hours)
        if (d.acceptOrders  !== undefined)   setAcceptOrders(d.acceptOrders)
        if (d.showOnApp     !== undefined)   setShowOnApp(d.showOnApp)
        if (d.lowStockAlerts !== undefined)  setLowStockAlerts(d.lowStockAlerts)
        if (d.allowCancels  !== undefined)   setAllowCancels(d.allowCancels)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/general', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone, email, street, city, province,
          hours,
          acceptOrders, showOnApp, lowStockAlerts, allowCancels,
        }),
      })
      if (!res.ok) throw new Error()
      setToast('success')
    } catch {
      setToast('error')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  const updateHour = (i, key, val) =>
    setHours(prev => prev.map((h, idx) => idx === i ? { ...h, [key]: val } : h))

  return (
    <div className="space-y-5">

      {/* ── Store profile (hardcoded) ── */}
      <SectionCard title="Store profile" subtitle="Basic info shown to customers and on receipts">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ backgroundColor: '#14532d' }}
          >
            IC
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Imagineers Consumers Cooperative</p>
            <p className="text-xs text-slate-500 mt-0.5">Cooperative · Zamboanga City</p>
          </div>
        </div>
      </SectionCard>

      {/* ── Contact & location ── */}
      <SectionCard title="Contact & location" subtitle="Used for order confirmations and delivery routing">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone number">
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={inputCls + ' pl-8'}
                type="tel"
                placeholder="+63 912 345 6789"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Email address">
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={inputCls + ' pl-8'}
                type="email"
                placeholder="store@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </Field>
        </div>

        <Field label="Street address">
          <div className="relative">
            <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={inputCls + ' pl-8'}
              placeholder="Building / Gate / Street"
              value={street}
              onChange={e => setStreet(e.target.value)}
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City / Municipality">
            <input
              className={inputCls}
              placeholder="Zamboanga City"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </Field>
          <Field label="Province / Region">
            <input
              className={inputCls}
              placeholder="Zamboanga Peninsula"
              value={province}
              onChange={e => setProvince(e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      {/* ── Operating hours ── */}
      <SectionCard title="Operating hours" subtitle="When your store is open for orders">
        <div className="space-y-2">
          {DAYS.map((day, i) => (
            <div key={day} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateHour(i, 'enabled', !hours[i].enabled)}
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition ${
                  hours[i].enabled ? 'bg-green-700 border-green-700 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {hours[i].enabled && (
                  <svg viewBox="0 0 10 8" fill="none" className="w-3 h-3">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <span className={`w-24 text-sm ${hours[i].enabled ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                {day}
              </span>

              {hours[i].enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    className={inputCls + ' flex-1'}
                    value={hours[i].open}
                    onChange={e => updateHour(i, 'open', e.target.value)}
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="time"
                    className={inputCls + ' flex-1'}
                    value={hours[i].close}
                    onChange={e => updateHour(i, 'close', e.target.value)}
                  />
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Closed</span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

     

      {/* ── Save footer ── */}
      <div className="flex items-center justify-end gap-3 pb-4">
        {toast === 'success' && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <CheckCircle size={12} /> Saved
          </span>
        )}
        {toast === 'error' && (
          <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
            Failed to save. Try again.
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-semibold px-5 py-2 rounded-lg text-white transition disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: '#14532d' }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}