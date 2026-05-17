// src/components/inventory/ProductModal.js
import { useState, useEffect, useRef } from 'react'
import { X, Package, UploadCloud, Trash2, Link } from 'lucide-react'

const UNITS = [
  'pcs', 'kg', 'g', 'lbs', 'oz',
  'L', 'mL', 'box', 'pack', 'bag',
  'bottle', 'can', 'bundle', 'dozen', 'tray',
]

const EMPTY_FORM = {
  name:       '',
  sku:        '',
  category:   '',
  stock:      '',
  unit:       '',
  unit_price: '',
  cost:       '',
  threshold:  '',
  supplier:   '',
  image_url:  '',
}

export default function ProductModal({ isOpen, mode, product, categories = [], onClose, onSuccess }) {
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)
  const [apiError,    setApiError]    = useState('')
  const [suppliers,   setSuppliers]   = useState([])
  const [suppLoading, setSuppLoading] = useState(false)

  // Image state
  const [imageTab,     setImageTab]     = useState('upload') // 'upload' | 'url'
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [urlInput,     setUrlInput]     = useState('')
  const [urlError,     setUrlError]     = useState('')
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState('')
  const fileInputRef = useRef(null)

  // ── Fetch suppliers ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const fetchSuppliers = async () => {
      setSuppLoading(true)
      try {
        const res  = await fetch('/api/suppliers')
        const data = await res.json()
        if (res.ok) setSuppliers((data.suppliers || []).filter(s => s.status === 'active'))
      } catch { } finally {
        setSuppLoading(false)
      }
    }
    fetchSuppliers()
  }, [isOpen])

  // ── Populate / reset form ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    setApiError('')
    setUploadError('')
    setUrlError('')
    setErrors({})
    setImageFile(null)
    setUrlInput('')

    if (mode === 'edit' && product) {
      setForm({
        name:       product.name        || '',
        sku:        product.sku         || '',
        category:   product.category    || '',
        stock:      product.stock       ?? '',
        unit:       product.unit        || '',
        unit_price: product.unit_price  ?? '',
        cost:       product.cost        ?? '',
        threshold:  product.threshold   ?? '',
        supplier:   product.supplier    || '',
        image_url:  product.image_url   || '',
      })
      setImagePreview(product.image_url || '')
      if (product.image_url) {
        setUrlInput(product.image_url)
        setImageTab('url')   // ← show URL tab so the preview renders in the right context
      } else {
        setImageTab('upload')
      }
    } else {
      setForm(EMPTY_FORM)
      setImagePreview('')
      setImageTab('upload')
    }
  }, [isOpen, mode, product])

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
    setApiError('')
  }

  // ── File picker ──────────────────────────────────────────────────
  const handleFilePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    const MAX_MB = 5
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`File too large. Maximum allowed size is ${MAX_MB} MB.`)
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    set('image_url', '')
  }

  // ── Paste URL handler ────────────────────────────────────────────
  const handleUrlApply = () => {
    setUrlError('')
    if (!urlInput.trim()) {
      setUrlError('Please enter an image URL.')
      return
    }
    try {
      new URL(urlInput.trim()) // validate URL format
    } catch {
      setUrlError('Invalid URL. Please enter a valid image URL.')
      return
    }
    setImagePreview(urlInput.trim())
    set('image_url', urlInput.trim())
    setImageFile(null) // clear any file
  }

  const handleUrlKeyDown = (e) => {
    if (e.key === 'Enter') handleUrlApply()
  }

  // ── Upload file to Cloudinary ────────────────────────────────────
  const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    setUploadError('')
    try {
      const res  = await fetch('/api/products/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload failed.')
      set('image_url', data.url)
      return data.url
    } catch (err) {
      setUploadError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setUploadError('')
    setUrlError('')
    setUrlInput('')
    set('image_url', '')
    setImageTab('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Validation ───────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.name.trim())      e.name       = 'Product name is required.'
    if (!form.sku.trim())       e.sku        = 'SKU is required.'
    if (!form.category)         e.category   = 'Category is required.'
    if (form.stock === '')      e.stock      = 'Stock is required.'
    else if (isNaN(Number(form.stock)) || Number(form.stock) < 0)
                                e.stock      = 'Stock must be a valid non-negative number.'
    if (!form.unit)             e.unit       = 'Unit is required.'
    if (form.unit_price === '') e.unit_price = 'Unit price is required.'
    else if (isNaN(Number(form.unit_price)) || Number(form.unit_price) < 0)
                                e.unit_price = 'Unit price must be a valid non-negative number.'
    if (form.cost !== '' && (isNaN(Number(form.cost)) || Number(form.cost) < 0))
                                e.cost       = 'Cost must be a valid non-negative number.'
    if (form.threshold === '')  e.threshold  = 'Low stock threshold is required.'
    else if (isNaN(Number(form.threshold)) || Number(form.threshold) < 0)
                                e.threshold  = 'Threshold must be a valid non-negative number.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setApiError('')

    try {
      let finalImageUrl = form.image_url

      // If a file was picked, upload it to Cloudinary
      if (imageFile) {
        const uploaded = await uploadToCloudinary(imageFile)
        if (!uploaded) { setLoading(false); return }
        finalImageUrl = uploaded
      }

      const url    = mode === 'edit' ? '/api/products/update' : '/api/products/create'
      const method = mode === 'edit' ? 'PUT'                  : 'POST'
      const body   = mode === 'edit'
        ? { ...form, image_url: finalImageUrl, id: product.id }
        : { ...form, image_url: finalImageUrl }

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Something went wrong.')
      onSuccess(data.product, mode)
      onClose()
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const isEdit   = mode === 'edit'
  const isBusy   = loading || uploading
  const hasImage = !!imagePreview

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
              <Package size={18} style={{ color: '#14532d' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEdit ? 'Update product information.' : 'Fill in the product details below.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={isBusy} className="text-slate-400 hover:text-slate-600 transition disabled:opacity-40">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">

          {apiError && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {apiError}
            </div>
          )}

          {/* ── Image Section ─────────────────────────────────────── */}
          <Field label="Product Image">

            {/* Tab switcher: Upload / URL */}
            {!hasImage && (
              <div className="flex gap-1 mb-3 bg-slate-100 rounded-lg p-1 w-fit">
                <button
                  type="button"
                  onClick={() => { setImageTab('upload'); setUrlError('') }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    imageTab === 'upload'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <UploadCloud size={13} /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => { setImageTab('url'); setUploadError('') }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    imageTab === 'url'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Link size={13} /> Paste URL
                </button>
              </div>
            )}

            {/* Upload tab */}
            {imageTab === 'upload' && !hasImage && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadCloud size={24} className="text-slate-400" />
                  <span className="text-sm text-slate-500 font-medium">Click to upload image</span>
                  <span className="text-xs text-slate-400">JPG, PNG, WEBP · Max 5 MB</span>
                </button>
                {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
              </>
            )}

            {/* URL tab */}
            {imageTab === 'url' && !hasImage && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/product-image.jpg"
                    value={urlInput}
                    onChange={e => { setUrlInput(e.target.value); setUrlError('') }}
                    onKeyDown={handleUrlKeyDown}
                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-slate-200 outline-none bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-50 transition"
                  />
                  <button
                    type="button"
                    onClick={handleUrlApply}
                    className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90"
                    style={{ backgroundColor: '#14532d' }}
                  >
                    Apply
                  </button>
                </div>
                {urlError && <p className="text-xs text-red-500">{urlError}</p>}
                <p className="text-xs text-slate-400">
                  Paste a direct image URL and click Apply to preview it.
                </p>
              </div>
            )}

            {/* Image preview (shared for both upload and URL) */}
            {hasImage && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-40 object-contain"
                  onError={() => {
                    setUrlError('This URL is blocked by the website (hotlink protection). Try the Upload File tab instead, or use a direct image URL like one from Cloudinary.')
                    setImagePreview('')
                    set('image_url', '')
                    setImageTab('url')
                  }}
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
                    <span className="w-6 h-6 border-2 border-slate-200 border-t-green-700 rounded-full animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Uploading…</span>
                  </div>
                )}
                {!uploading && (
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    {/* Change button */}
                    {imageTab === 'upload' ? (
                      <>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-white/90 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-white shadow-sm transition"
                        >
                          Change
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setImagePreview(''); set('image_url', '') }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/90 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-white shadow-sm transition"
                      >
                        Change URL
                      </button>
                    )}
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg bg-white/90 border border-red-200 text-red-500 hover:bg-white shadow-sm transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
                {/* Uploaded badge — only for file uploads saved to Cloudinary */}
                {!uploading && form.image_url && imageFile && (
                  <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-semibold">
                    ✓ Uploaded
                  </div>
                )}
                {/* URL badge */}
                {!uploading && form.image_url && !imageFile && (
                  <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                    🔗 URL
                  </div>
                )}
              </div>
            )}
          </Field>

          {/* Name + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product Name" error={errors.name} required>
              <input
                type="text"
                placeholder="e.g. Whole Milk 1L"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className={inputClass(errors.name)}
              />
            </Field>
            <Field label="SKU" error={errors.sku} required>
              <input
                type="text"
                placeholder="e.g. MLK-001"
                value={form.sku}
                onChange={e => set('sku', e.target.value.toUpperCase())}
                className={inputClass(errors.sku) + ' font-mono'}
              />
            </Field>
          </div>

          {/* Category + Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" error={errors.category} required>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass(errors.category)}>
                <option value="">Select category…</option>
                {categories.filter(c => c.status === 'active').map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Supplier" error={errors.supplier}>
              <select
                value={form.supplier}
                onChange={e => set('supplier', e.target.value)}
                className={inputClass(errors.supplier)}
                disabled={suppLoading}
              >
                <option value="">{suppLoading ? 'Loading suppliers…' : 'Select supplier…'}</option>
                {suppliers.map(s => <option key={s.id} value={s.company}>{s.company}</option>)}
              </select>
            </Field>
          </div>

          {/* Unit + Unit Price */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit" error={errors.unit} required>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className={inputClass(errors.unit)}>
                <option value="">Select unit…</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Retail Price / Unit Price (₱)" error={errors.unit_price} required>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={form.unit_price}
                onChange={e => set('unit_price', e.target.value)}
                className={inputClass(errors.unit_price)}
              />
            </Field>
          </div>

          {/* Cost + Threshold */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cost Price (₱)" error={errors.cost}>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={form.cost}
                onChange={e => set('cost', e.target.value)}
                className={inputClass(errors.cost)}
              />
            </Field>
            <Field label="Low Stock Threshold" error={errors.threshold} required>
              <input
                type="number" min="0" placeholder="e.g. 10"
                value={form.threshold}
                onChange={e => set('threshold', e.target.value)}
                className={inputClass(errors.threshold)}
              />
            </Field>
          </div>

          {/* Stock */}
          <Field label="Current Stock" error={errors.stock} required>
            <input
              type="number" min="0" placeholder="0"
              value={form.stock}
              onChange={e => set('stock', e.target.value)}
              className={inputClass(errors.stock)}
            />
          </Field>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            disabled={isBusy}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isBusy}
            className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            style={{ backgroundColor: '#14532d' }}
          >
            {isBusy && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {uploading ? 'Uploading…' : loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>

      </div>
    </div>
  )
}

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