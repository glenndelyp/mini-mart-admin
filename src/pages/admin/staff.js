import { useState, useEffect } from 'react'
import { Search, Plus, Users, UserCheck, UserX, Eye, EyeOff, ShieldCheck, X } from 'lucide-react'
import RoleGuard from '../../components/RoleGuard'

const ITEMS_PER_PAGE = 8

const ROLE_CONFIG = {
  cashier: { label: 'Cashier', style: 'bg-blue-50 text-blue-700 border border-blue-200'       },
  admin:   { label: 'Admin',   style: 'bg-violet-50 text-violet-700 border border-violet-200' },
}

const ALL_ROLE_OPTIONS = [
  { value: 'cashier', label: 'Cashier', desc: 'POS & order access',    icon: '🧾', activeColor: 'border-blue-400 bg-blue-50',    textColor: 'text-blue-700'   },
  { value: 'admin',   label: 'Admin',   desc: 'Full management access', icon: '🛡️', activeColor: 'border-violet-400 bg-violet-50', textColor: 'text-violet-700' },
]

export default function ManageStaff() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', password: '', role: 'cashier',
  })
  const [staffList,      setStaffList]      = useState([])
  const [tableLoading,   setTableLoading]   = useState(true)
  const [currentRole,    setCurrentRole]    = useState(null)
  const [search,         setSearch]         = useState('')
  const [roleFilter,     setRoleFilter]     = useState('All')
  const [statusFilter,   setStatusFilter]   = useState('All')
  const [page,           setPage]           = useState(1)
  const [message,        setMessage]        = useState({ text: '', type: '' })
  const [submitting,     setSubmitting]     = useState(false)
  const [showPass,       setShowPass]       = useState(false)
  const [toast,          setToast]          = useState(null)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [step,           setStep]           = useState('form') // 'form' | 'confirm'
  const [confirmCode,    setConfirmCode]    = useState('')
  const [generatedCode,  setGeneratedCode]  = useState(null)

  // Admin card only visible to superadmin
  const roleOptions = ALL_ROLE_OPTIONS.filter(
    r => r.value !== 'admin' || currentRole === 'superadmin'
  )

  const showToast = (text, type = 'success') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch current logged-in user's role
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setCurrentRole(d.admin?.role?.toLowerCase().trim() ?? null))
      .catch(() => {})
  }, [])

  async function loadStaff() {
    try {
      setTableLoading(true)
      const res  = await fetch('/api/admin/staff-list')
      const data = await res.json()
      setStaffList(data.staff ?? [])
    } catch {
      // silently fail
    } finally {
      setTableLoading(false)
    }
  }

  useEffect(() => { loadStaff() }, [])

  function openModal() {
    setForm({ first_name: '', last_name: '', username: '', password: '', role: 'cashier' })
    setMessage({ text: '', type: '' })
    setShowPass(false)
    setStep('form')
    setConfirmCode('')
    setGeneratedCode(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setStep('form')
    setConfirmCode('')
    setGeneratedCode(null)
    setMessage({ text: '', type: '' })
  }

  // Step 1 — request a confirmation code from the server
  async function handleRequestCode(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ text: '', type: '' })

    try {
      const res  = await fetch('/api/admin/request-staff-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage({ text: data.message || 'Something went wrong.', type: 'error' })
      } else {
        setGeneratedCode(data.code)
        setStep('confirm')
        setMessage({ text: '', type: '' })
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // Step 2 — submit the confirmation code to finalize account creation
  async function handleConfirmCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ text: '', type: '' })

    try {
      const res  = await fetch('/api/admin/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: confirmCode }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessage({ text: data.message || 'Invalid or expired code.', type: 'error' })
      } else {
        closeModal()
        showToast(`Account created for ${form.username} (${form.role})!`)
        loadStaff()
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(id, current) {
    await fetch('/api/admin/toggle-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    showToast(current ? 'Staff member deactivated.' : 'Staff member activated.')
    loadStaff()
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const totalActive   = staffList.filter(s => s.is_active).length
  const totalInactive = staffList.length - totalActive
  const totalAdmins   = staffList.filter(s => s.role === 'admin').length

  const filtered = staffList.filter(s => {
    const name        = `${s.first_name} ${s.last_name}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) ||
                        s.username.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'All' || s.role === roleFilter.toLowerCase()
    const matchStatus = statusFilter === 'All'
      ? true
      : statusFilter === 'Active' ? s.is_active : !s.is_active
    return matchSearch && matchRole && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const stats = [
    { label: 'Total Staff',    value: staffList.length, bg: 'bg-violet-50',  iconColor: 'text-violet-600',  Icon: Users       },
    { label: 'Active',         value: totalActive,      bg: 'bg-emerald-50', iconColor: 'text-emerald-700', Icon: UserCheck   },
    { label: 'Inactive',       value: totalInactive,    bg: 'bg-slate-100',  iconColor: 'text-slate-500',   Icon: UserX       },
    { label: 'Admin Accounts', value: totalAdmins,      bg: 'bg-violet-50',  iconColor: 'text-violet-600',  Icon: ShieldCheck },
  ]

  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <div>

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
            style={{ animation: 'fadeIn .25s ease' }}
          >
            <span>{toast.type === 'success' ? '✓' : '✕'}</span>
            {toast.text}
          </div>
        )}

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Manage Staff</h1>
            <p className="text-sm text-slate-400 mt-0.5">Create and manage staff accounts.</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: '#14532d' }}
          >
            <Plus size={16} />
            Add Staff
          </button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-5 mb-6">
          {stats.map(({ label, value, bg, iconColor, Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${bg}`}>
                <Icon size={18} className={iconColor} />
              </div>
              <p className="text-sm text-slate-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-slate-800">
                {tableLoading
                  ? <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
                  : value
                }
              </p>
            </div>
          ))}
        </div>

        {/* ── Main card ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200">

          {/* Filters */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64">
                <Search size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search name or username"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
                />
              </div>
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none cursor-pointer bg-white"
              >
                {['All', 'Cashier', 'Admin'].map(r => <option key={r}>{r}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none cursor-pointer bg-white"
              >
                {['All', 'Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <p className="text-xs text-slate-400">{filtered.length} staff found</p>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="text-sm" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
                <th className="text-left px-5 py-3 font-medium">#</th>
                <th className="text-left px-5 py-3 font-medium">Full Name</th>
                <th className="text-left px-5 py-3 font-medium">Username</th>
                <th className="text-left px-5 py-3 font-medium">Role</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Date Created</th>
                <th className="text-left px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>

              {/* Loading skeletons */}
              {tableLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 6 ? 80 : '75%' }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Data rows */}
              {!tableLoading && paginated.map((s, i) => {
                const roleConf = ROLE_CONFIG[s.role] ?? ROLE_CONFIG.cashier
                return (
                  <tr
                    key={s.id}
                    className={`text-sm border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                  >
                    <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">
                      {(page - 1) * ITEMS_PER_PAGE + i + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: '#14532d' }}
                        >
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                        <span className="font-medium text-slate-800">{s.first_name} {s.last_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{s.username}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleConf.style}`}>
                        {roleConf.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        s.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(s.created_at).toLocaleDateString('en-PH', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleActive(s.id, s.is_active)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                          s.is_active
                            ? 'border-red-200 text-red-500 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                )
              })}

              {/* Empty state */}
              {!tableLoading && paginated.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <Users size={32} className="text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-400">
                        {search || roleFilter !== 'All' || statusFilter !== 'All'
                          ? 'No staff match your filters.'
                          : 'No staff accounts yet'}
                      </p>
                      <p className="text-xs text-slate-300 mt-1 mb-4">
                        {search || roleFilter !== 'All' || statusFilter !== 'All'
                          ? 'Try adjusting your search or filters.'
                          : 'Add your first staff member to get started'}
                      </p>
                      {!search && roleFilter === 'All' && statusFilter === 'All' && (
                        <button
                          onClick={openModal}
                          className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
                          style={{ backgroundColor: '#14532d' }}
                        >
                          <Plus size={13} /> Add First Staff
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!tableLoading && filtered.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} staff
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 transition"
                >← Previous</button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                        p === page ? 'text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                      style={p === page ? { backgroundColor: '#14532d' } : {}}
                    >{p}</button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 transition"
                >Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Create Staff Modal ──────────────────────────────────────────── */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(15,23,42,0.45)', animation: 'fadeIn .2s ease' }}
            onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
              style={{ animation: 'slideUp .22s ease' }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {step === 'form' ? 'Add Staff Account' : 'Confirm Account Creation'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {step === 'form'
                      ? 'Fill in the details to create a new account'
                      : `Creating account for ${form.first_name} ${form.last_name} · ${form.role}`}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* ── STEP 1: Form ── */}
              {step === 'form' && (
                <form onSubmit={handleRequestCode} className="px-6 py-5 space-y-4">

                  {/* Name row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                        First Name
                      </label>
                      <input
                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50 outline-none focus:border-emerald-400 focus:bg-white transition"
                        placeholder="Juan"
                        value={form.first_name}
                        onChange={e => setForm({ ...form, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Last Name
                      </label>
                      <input
                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50 outline-none focus:border-emerald-400 focus:bg-white transition"
                        placeholder="Dela Cruz"
                        value={form.last_name}
                        onChange={e => setForm({ ...form, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Username
                    </label>
                    <input
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50 outline-none focus:border-emerald-400 focus:bg-white transition"
                      placeholder="e.g. cashier_juan"
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                      required
                    />
                  </div>

                  {/* Role selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Role
                    </label>
                    <div className={`grid gap-2 ${roleOptions.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {roleOptions.map(r => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setForm({ ...form, role: r.value })}
                          className={`flex items-start gap-3 px-3 py-3 rounded-xl border-2 text-left transition ${
                            form.role === r.value
                              ? r.activeColor
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className="text-xl leading-none mt-0.5">{r.icon}</span>
                          <div>
                            <p className={`text-sm font-semibold ${
                              form.role === r.value ? r.textColor : 'text-slate-700'
                            }`}>
                              {r.label}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Temporary Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-10 px-3 pr-10 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50 outline-none focus:border-emerald-400 focus:bg-white transition"
                        type={showPass ? 'text' : 'password'}
                        placeholder="Set a temporary password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  {message.text && (
                    <div className="px-3 py-2.5 rounded-lg text-xs font-medium border bg-red-50 text-red-600 border-red-200">
                      {message.text}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 h-10 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 h-10 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: '#14532d' }}
                    >
                      {submitting ? 'Generating…' : 'Continue →'}
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP 2: Confirm code ── */}
              {step === 'confirm' && (
                <form onSubmit={handleConfirmCreate} className="px-6 py-5 space-y-4">

                  {/* Generated code display */}
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 text-center">
                    <p className="text-xs text-violet-500 font-semibold uppercase tracking-widest mb-3">
                      Your Confirmation Code
                    </p>
                    <p className="text-5xl font-bold tracking-[0.35em] text-violet-700 font-mono">
                      {generatedCode}
                    </p>
                    <p className="text-xs text-violet-400 mt-3">
                      ⏱ Expires in 5 minutes · One-time use only
                    </p>
                  </div>

                  {/* Divider with instruction */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100" />
                    <p className="text-xs text-slate-400 whitespace-nowrap">Enter the code below to confirm</p>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {/* Code input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                      Confirmation Code
                    </label>
                    <input
                      className="w-full h-12 px-3 border-2 border-slate-200 rounded-xl text-2xl font-mono font-bold text-center text-slate-800 bg-slate-50 outline-none focus:border-violet-400 focus:bg-white tracking-[0.4em] transition"
                      placeholder="000000"
                      maxLength={6}
                      value={confirmCode}
                      onChange={e => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Error message */}
                  {message.text && (
                    <div className="px-3 py-2.5 rounded-lg text-xs font-medium border bg-red-50 text-red-600 border-red-200">
                      {message.text}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('form')
                        setConfirmCode('')
                        setGeneratedCode(null)
                        setMessage({ text: '', type: '' })
                      }}
                      className="flex-1 h-10 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || confirmCode.length !== 6}
                      className="flex-1 h-10 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: '#14532d' }}
                    >
                      {submitting ? 'Creating…' : 'Confirm & Create'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
        `}</style>
      </div>
    </RoleGuard>
  )
}