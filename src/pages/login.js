import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
}

function Toast({ toasts }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 10,
          background: t.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${t.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: t.type === 'success' ? '#14532d' : '#991b1b',
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          minWidth: 260, maxWidth: 340,
          animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <span style={{ flexShrink: 0 }}>{TOAST_ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const add = ({ type, message, duration = 3500 }) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }
  return { toasts, add }
}

const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// LoginPage
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const { toasts, add: addToast } = useToast()

  const [username,      setUsername]      = useState('')
  const [password,      setPassword]      = useState('')
  const [showPass,      setShowPass]      = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [usernameFocus, setUsernameFocus] = useState(false)
  const [passFocus,     setPassFocus]     = useState(false)
  const [errors,        setErrors]        = useState({})

  const validate = () => {
    const e = {}
    if (!username.trim()) e.username = 'Username is required.'
    if (!password)        e.password = 'Password is required.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleLogin = async (ev) => {
    ev?.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Invalid credentials.')
      addToast({ type: 'success', message: `Welcome back, ${data.user?.first_name ?? 'Admin'} 👋` })
      setTimeout(() => router.replace('/dashboard'), 1400)
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Something went wrong.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login — Mart.</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <Toast toasts={toasts} />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f1f5f1; }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .login-root {
          min-height: 100vh;
          background: #f1f5f1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Subtle dot pattern */
        .login-root::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, #c8dfc8 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.55;
          pointer-events: none;
        }

        /* Green accent shape top-left */
        .accent-shape {
          position: absolute;
          top: -80px; left: -80px;
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(20,83,45,0.08) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .accent-shape-2 {
          position: absolute;
          bottom: -60px; right: -60px;
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(22,101,52,0.07) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .card-wrap {
          position: relative; z-index: 10;
          width: 100%; max-width: 420px;
          animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        /* Card */
        .card {
          background: #ffffff;
          border: 1px solid #e2ece2;
          border-radius: 20px;
          padding: 40px 36px 36px;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.04),
            0 8px 32px rgba(20,83,45,0.08),
            0 24px 64px rgba(0,0,0,0.06);
        }

        /* Logo row */
        .logo-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 32px;
        }
        .logo-mark {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 10px rgba(20,83,45,0.3);
          flex-shrink: 0;
        }
        .logo-text {
          font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #111827;
        }
        .logo-dot { color: #16a34a; }
        .logo-badge {
          margin-left: auto;
          font-family: 'DM Mono', monospace;
          font-size: 10px; font-weight: 500; letter-spacing: 0.08em;
          color: #166534;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          padding: 3px 8px; border-radius: 6px;
        }

        .card-title {
          font-size: 24px; font-weight: 700; color: #111827;
          letter-spacing: -0.4px; margin-bottom: 6px;
        }
        .card-sub {
          font-size: 13.5px; color: #6b7280; margin-bottom: 28px;
        }

        /* Input group */
        .input-group { margin-bottom: 16px; }
        .input-label {
          display: block; font-size: 11.5px; font-weight: 600;
          color: #374151; letter-spacing: 0.06em; text-transform: uppercase;
          margin-bottom: 7px;
        }
        .input-box {
          position: relative; display: flex; align-items: center;
        }
        .input-icon {
          position: absolute; left: 13px; color: #9ca3af; pointer-events: none;
          transition: color 0.2s;
        }
        .input-box.focused .input-icon { color: #16a34a; }
        .input-box.error-state .input-icon { color: #dc2626; }

        .input-field {
          width: 100%; height: 48px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 11px;
          padding: 0 44px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #111827; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .input-field::placeholder { color: #d1d5db; }
        .input-field:focus {
          background: #fff;
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.1);
        }
        .input-field.has-error {
          border-color: #fca5a5;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
        }
        .eye-btn {
          position: absolute; right: 13px;
          background: none; border: none; cursor: pointer;
          color: #9ca3af; padding: 0; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: #374151; }

        .error-msg {
          margin-top: 5px; margin-left: 2px;
          font-size: 11.5px; color: #dc2626; font-weight: 500;
          display: flex; align-items: center; gap: 5px;
        }

        /* Options row */
        .options-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 22px; margin-top: 4px;
        }
        .secured-label { font-size: 12px; color: #9ca3af; font-weight: 500; }
        .forgot-link {
          font-size: 12.5px; color: #16a34a; font-weight: 600;
          text-decoration: none; background: none; border: none; cursor: pointer;
          transition: color 0.15s;
        }
        .forgot-link:hover { color: #14532d; }

        /* Submit button */
        .submit-btn {
          width: 100%; height: 50px;
          background: linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%);
          border: none;
          border-radius: 12px;
          color: #fff; font-family: 'DM Sans', sans-serif;
          font-size: 14.5px; font-weight: 600; letter-spacing: 0.02em;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: box-shadow 0.2s, transform 0.1s, opacity 0.2s;
          box-shadow: 0 4px 16px rgba(20,83,45,0.35);
          margin-bottom: 20px;
        }
        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 6px 24px rgba(20,83,45,0.45);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
        }
        .divider-line { flex: 1; height: 1px; background: #f3f4f6; }
        .divider-text {
          font-size: 10.5px; color: #d1d5db; font-weight: 500;
          letter-spacing: 0.08em; font-family: 'DM Mono', monospace;
        }

        /* Footer */
        .footer-note {
          text-align: center; font-size: 11.5px; color: #d1d5db;
          font-family: 'DM Mono', monospace;
        }
        .footer-note span { color: #9ca3af; }
      `}</style>

      <div className="login-root">
        <div className="accent-shape" />
        <div className="accent-shape-2" />

        <div className="card-wrap">
          <div className="card">

            {/* Logo */}
            <div className="logo-row">
              <div className="logo-mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbf7d0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <span className="logo-text">Mart<span className="logo-dot">.</span></span>
              <span className="logo-badge">ADMIN</span>
            </div>

            <h1 className="card-title">Welcome back</h1>
            <p className="card-sub">Sign in to your admin dashboard</p>

            {/* Username */}
            <div className="input-group">
              <label className="input-label">Username</label>
              <div className={`input-box ${usernameFocus ? 'focused' : ''} ${errors.username ? 'error-state' : ''}`}>
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  className={`input-field${errors.username ? ' has-error' : ''}`}
                  type="text" placeholder="e.g. mart_admin"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setErrors(v => ({ ...v, username: '' })) }}
                  onFocus={() => setUsernameFocus(true)}
                  onBlur={() => setUsernameFocus(false)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="error-msg">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" opacity=".15"/><path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  </svg>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="input-group">
              <label className="input-label">Password</label>
              <div className={`input-box ${passFocus ? 'focused' : ''} ${errors.password ? 'error-state' : ''}`}>
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  className={`input-field${errors.password ? ' has-error' : ''}`}
                  type={showPass ? 'text' : 'password'} placeholder="••••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: '' })) }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
                />
                <button className="eye-btn" type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="error-msg">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" opacity=".15"/><path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="options-row">
              <span className="secured-label">Secured admin access only</span>
              <button className="forgot-link" type="button">Forgot password?</button>
            </div>

            {/* Submit */}
            <button className="submit-btn" onClick={handleLogin} disabled={loading}>
              {loading ? (
                <><div className="spinner" /> Signing in…</>
              ) : (
                <>
                  Sign In
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">PROTECTED AREA</span>
              <div className="divider-line" />
            </div>

            {/* Footer */}
            <p className="footer-note">
              <span>Mart.</span> Admin Panel · Unauthorized access is prohibited
            </p>

          </div>
        </div>
      </div>
    </>
  )
}