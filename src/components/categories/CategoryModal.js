// src/components/categories/CategoryModal.js
import { useState, useEffect } from 'react'
import { X, Tag } from 'lucide-react'

const EMPTY_FORM = { name: '', description: '', status: 'active' }

export default function CategoryModal({ isOpen, mode, category, onClose, onSuccess }) {
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setApiError('')
    setErrors({})
    if (mode === 'edit' && category) {
      setForm({
        name:        category.name        || '',
        description: category.description || '',
        status:      category.status      || 'active',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [isOpen, mode, category])

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Category name is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setApiError('')
    try {
      const url    = mode === 'edit' ? '/api/categories/update' : '/api/categories/create'
      const method = mode === 'edit' ? 'PUT' : 'POST'
      const body   = mode === 'edit' ? { ...form, id: category.id } : form
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Something went wrong.')
      onSuccess(data.category, mode)
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
              <Tag size={18} style={{ color: '#14532d' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEdit ? 'Edit Category' : 'Add New Category'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEdit ? 'Update category details.' : 'Fill in the category details below.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {apiError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {apiError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Category Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text" placeholder="e.g. Beverages"
              value={form.name} onChange={e => set('name', e.target.value)}
              className={iCls(errors.name)}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Brief description of this category..."
              value={form.description} onChange={e => set('description', e.target.value)}
              rows={3}
              className={iCls(errors.description) + ' h-auto py-2 resize-none'}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Status
            </label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={iCls()}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
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
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  )
}

function iCls(error) {
  return `w-full h-10 px-3 text-sm rounded-lg border outline-none transition bg-slate-50 text-slate-800 placeholder-slate-400
    ${error
      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
      : 'border-slate-200 focus:border-green-600 focus:ring-2 focus:ring-green-50'
    }`
}