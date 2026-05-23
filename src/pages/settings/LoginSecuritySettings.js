import { useState, useEffect } from 'react'
import { CheckCircle, Eye, EyeOff, Lock, Monitor, Users, ChevronDown } from 'lucide-react'

// ─── Utility ──────────────────────────────────────────────────────────────────
function formatUserAgent(ua) {
  if (!ua) return 'Unknown device'
  if (ua.includes('Chrome') && !ua.includes('Edg'))  return 'Chrome on ' + (ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'Mac' : 'Linux')
  if (ua.includes('Firefox'))  return 'Firefox on ' + (ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'Mac' : 'Linux')
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari on Mac'
  if (ua.includes('Edg'))      return 'Edge on Windows'
  return ua.substring(0, 40)
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#14532d22' }}>
            <Icon size={15} style={{ color: '#14532d' }} />
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
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

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className={inputCls + ' pl-8 pr-9'}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  )
}

function StrengthBar({ password }) {
  if (!password) return null
  const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1
  const label    = ['', 'Weak', 'Acceptable', 'Good', 'Strong'][strength]
  const color    = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'][strength]
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? color : 'bg-slate-100'}`} />
        ))}
      </div>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  )
}

// ─── LoginSecuritySettings ────────────────────────────────────────────────────
export default function LoginSecuritySettings() {
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const isSuperAdmin = currentAdmin?.role === 'superadmin'

  // ── Change own password ──
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [pwError,    setPwError]    = useState('')
  const [pwSaving,   setPwSaving]   = useState(false)
  const [pwToast,    setPwToast]    = useState(null)

  // ── Reset another admin's password (superadmin only) ──
  const [admins,       setAdmins]       = useState([])
  const [targetId,     setTargetId]     = useState('')
  const [resetPw,      setResetPw]      = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetError,   setResetError]   = useState('')
  const [resetSaving,  setResetSaving]  = useState(false)
  const [resetToast,   setResetToast]   = useState(null)

  // ── Sessions ──
  const [sessions,     setSessions]     = useState([])
  const [loadingSess,  setLoadingSess]  = useState(true)

  useEffect(() => {
    // Fetch current admin first, then load staff list if superadmin
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        setCurrentAdmin(d.admin)
        if (d.admin?.role === 'superadmin') {
          fetch('/api/admin/staff-list')
            .then(r => r.json())
            .then(s => setAdmins(s.staff ?? []))
            .catch(() => {})
        }
      })
      .catch(() => {})

    fetch('/api/settings/sessions')
      .then(r => r.json())
      .then(d => { setSessions(d.sessions) })
      .catch(() => {})
      .finally(() => setLoadingSess(false))
  }, [])

  // ── Handle own password change ──
  const handleChangePassword = async () => {
    setPwError('')
    if (!currentPw || !newPw || !confirmPw) { setPwError('Please fill in all fields.'); return }
    if (newPw.length < 8)                   { setPwError('New password must be at least 8 characters.'); return }
    if (newPw !== confirmPw)                { setPwError('Passwords do not match.'); return }

    setPwSaving(true)
    try {
      const res  = await fetch('/api/settings/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setPwToast('success')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      setPwError(err.message || 'Failed to update password.')
    } finally {
      setPwSaving(false)
      setTimeout(() => setPwToast(null), 3000)
    }
  }

  // ── Handle superadmin reset ──
  const handleReset = async () => {
    setResetError('')
    if (!targetId)                              { setResetError('Please select an account.'); return }
    if (!resetPw || resetPw.length < 8)         { setResetError('New password must be at least 8 characters.'); return }
    if (resetPw !== resetConfirm)               { setResetError('Passwords do not match.'); return }

    setResetSaving(true)
    try {
      const res  = await fetch('/api/settings/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ targetAdminId: targetId, newPassword: resetPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setResetToast('success')
      setTargetId(''); setResetPw(''); setResetConfirm('')
    } catch (err) {
      setResetError(err.message || 'Failed to reset password.')
    } finally {
      setResetSaving(false)
      setTimeout(() => setResetToast(null), 3000)
    }
  }

  const formatDate = iso => iso
    ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="space-y-5">

      {/* ── Change Own Password ── */}
      <SectionCard icon={Lock} title="Change Password" subtitle="Update your password regularly to keep your account secure">

        <Field label="Current password">
          <PasswordInput value={currentPw} onChange={setCurrentPw} placeholder="Enter current password" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="New password">
            <PasswordInput value={newPw} onChange={setNewPw} placeholder="Min. 8 characters" />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" />
          </Field>
        </div>

        <StrengthBar password={newPw} />

        {pwError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{pwError}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          {pwToast === 'success' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle size={12} /> Password updated
            </span>
          )}
          <button onClick={handleChangePassword} disabled={pwSaving}
            className="text-xs font-semibold px-5 py-2 rounded-lg text-white transition disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: '#14532d' }}>
            {pwSaving ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </SectionCard>

      {/* ── Superadmin: Reset any account's password ── */}
      {isSuperAdmin && (
        <SectionCard icon={Users} title="Reset Staff Password"
          subtitle="As superadmin, you can reset any account's password without knowing the current one">

          <Field label="Select account">
            <div className="relative">
              <select
                className={inputCls + ' pr-8 appearance-none cursor-pointer'}
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
              >
                <option value="">— Choose a staff account —</option>
                {admins
                  .filter(a => a.id !== currentAdmin?.id)
                  .map(a => (
                    <option key={a.id} value={a.id}>
                      {a.first_name} {a.last_name} (@{a.username}) — {a.role}
                    </option>
                  ))
                }
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="New password">
              <PasswordInput value={resetPw} onChange={setResetPw} placeholder="Min. 8 characters" />
            </Field>
            <Field label="Confirm password">
              <PasswordInput value={resetConfirm} onChange={setResetConfirm} placeholder="Repeat password" />
            </Field>
          </div>

          <StrengthBar password={resetPw} />

          {resetError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{resetError}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            {resetToast === 'success' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <CheckCircle size={12} /> Password reset successfully
              </span>
            )}
            <button onClick={handleReset} disabled={resetSaving}
              className="text-xs font-semibold px-5 py-2 rounded-lg text-white transition disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#14532d' }}>
              {resetSaving ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── Login History ── */}
      <SectionCard icon={Monitor} title="Login History" subtitle="Recent sign-ins across all staff accounts">
        {loadingSess ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-slate-400">No login history available.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Monitor size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {s.first_name} {s.last_name}
                    <span className="text-slate-400 font-normal"> (@{s.username ?? 'unknown'})</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {s.ip === '::1' ? 'Localhost' : s.ip ?? 'Unknown IP'} · {formatUserAgent(s.user_agent)} · {formatDate(s.created_at)}
                  </p>
                </div>
                {i === 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 flex-shrink-0">
                    Latest
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  )
}