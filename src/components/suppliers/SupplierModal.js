// src/components/suppliers/SupplierModal.js
import { useState, useEffect } from 'react'
import { X, Truck } from 'lucide-react'

const EMPTY_FORM = {
  full_name:   '',
  company:     '',
  contact_num: '',
  email:       '',
  address:     '',
  status:      'active',
}

export default function SupplierModal({ isOpen, mode, supplier, onClose, onSuccess }) {
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setApiError('')
    setErrors({})
    if (mode === 'edit' && supplier) {
      setForm({
        full_name:   supplier.full_name   || '',
        company:     supplier.company     || '',
        contact_num: supplier.contact_num || '',
        email:       supplier.email       || '',
        address:     supplier.address     || '',
        status:      supplier.status      || 'active',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [isOpen, mode, supplier])

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (!form.full_name.trim())   e.full_name   = 'Full name is required.'
    if (!form.company.trim())     e.company     = 'Company is required.'
    if (!form.contact_num.trim()) e.contact_num = 'Contact number is required.'
    if (!form.email.trim())       e.email       = 'Email is required.'
    else if (!form.email.includes('@')) e.email = 'Enter a valid email.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setApiError('')
    try {
      const url    = mode === 'edit' ? '/api/suppliers/update' : '/api/suppliers/create'
      const method = mode === 'edit' ? 'PUT' : 'POST'
      const body   = mode === 'edit' ? { ...form, id: supplier.id } : form

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Something went wrong.')
      onSuccess(data.supplier, mode)
      onClose()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const isEdit = mode === 'edit'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
              <Truck size={18} style={{ color: '#14532d' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEdit ? 'Update supplier information.' : 'Fill in the supplier details below.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* API error */}
          {apiError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {apiError}
            </div>
          )}

          {/* Row: Full Name + Company */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" error={errors.full_name} required>
              <input
                type="text" placeholder="e.g. Juan dela Cruz"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                className={inputClass(errors.full_name)}
              />
            </Field>
            <Field label="Company" error={errors.company} required>
              <input
                type="text" placeholder="e.g. Fresh Farms PH"
                value={form.company}
                onChange={e => set('company', e.target.value)}
                className={inputClass(errors.company)}
              />
            </Field>
          </div>

          {/* Row: Contact + Email */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Number" error={errors.contact_num} required>
              <input
                type="text" placeholder="e.g. 09171234567"
                value={form.contact_num}
                onChange={e => set('contact_num', e.target.value)}
                className={inputClass(errors.contact_num)}
              />
            </Field>
            <Field label="Email" error={errors.email} required>
              <input
                type="email" placeholder="e.g. juan@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className={inputClass(errors.email)}
              />
            </Field>
          </div>

          {/* Address */}
          <Field label="Address" error={errors.address}>
            <input
              type="text" placeholder="e.g. Quezon City, Metro Manila"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className={inputClass(errors.address)}
            />
          </Field>

          {/* Status */}
          <Field label="Status" error={errors.status}>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className={inputClass(errors.status)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>

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
            style={{ backgroundColor: '#14532d' }}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Supplier'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputClass(error) {
  return `w-full h-10 px-3 text-sm rounded-lg border outline-none transition bg-slate-50 text-slate-800 placeholder-slate-400
    ${error
      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
      : 'border-slate-200 focus:border-green-600 focus:ring-2 focus:ring-green-50'
    }`
}