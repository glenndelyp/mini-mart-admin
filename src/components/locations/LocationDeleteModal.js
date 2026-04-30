// src/components/locations/LocationDeleteModal.js
import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function LocationDeleteModal({ isOpen, location, onClose, onSuccess }) {
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState('')

  const handleDelete = async () => {
    setLoading(true)
    setApiError('')
    try {
      const res  = await fetch('/api/locations/delete', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: location.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to delete.')
      onSuccess(location.id)
      onClose()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !location) return null

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
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Delete Location</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {apiError}
            </div>
          )}
          <p className="text-sm text-slate-600">
            Are you sure you want to delete the location{' '}
            <span className="font-semibold text-slate-800">"{location.label}"</span>?
          </p>
          <p className="text-xs text-slate-400 mt-2">
            This may affect users who have this location selected. This action cannot be undone.
          </p>
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
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-60 flex items-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>

      </div>
    </div>
  )
}