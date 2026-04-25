import { useState, useEffect, useRef } from 'react'
import { Search, Bell, ChevronDown, LogOut, Settings } from 'lucide-react'
import { useRouter } from 'next/router'

function getAdminFromCookie() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find(row => row.startsWith('mart_admin='))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')))
  } catch { return null }
}

export default function Header() {
  const router  = useRouter()
  const [admin,    setAdmin]    = useState(null)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => { setAdmin(getAdminFromCookie()) }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    document.cookie = 'mart_admin=; Path=/; Max-Age=0'
    document.cookie = 'mart_admin_auth=; Path=/; Max-Age=0'
    router.replace('/login')
  }

  const initials  = admin ? `${admin.first_name?.[0] ?? ''}${admin.last_name?.[0] ?? ''}`.toUpperCase() : 'A'
  const fullName  = admin ? `${admin.first_name} ${admin.last_name}` : 'Admin'
  const roleLabel = admin?.role === 'superadmin' ? 'Super Admin' : 'Admin'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between">

      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-72">
        <Search size={15} className="text-slate-400" />
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Search something here"
          className="bg-transparent text-sm text-slate-600 outline-none w-full placeholder-slate-400"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button suppressHydrationWarning className="text-slate-400 hover:text-slate-700 transition-colors">
          <Bell size={20} />
        </button>

        <div className="w-px h-8 bg-slate-200" />

        <div className="relative" ref={dropRef}>
          <button
            suppressHydrationWarning
            onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#14532d' }}>
              {initials}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800 leading-none">{fullName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{roleLabel}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">{fullName}</p>
                <p className="text-xs text-slate-400 mt-0.5">@{admin?.username ?? 'admin'}</p>
                <span className="inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color: '#14532d', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  {roleLabel}
                </span>
              </div>

              <button
                onClick={() => { setDropOpen(false); router.push('/settings') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                <Settings size={15} className="text-slate-400" />
                Settings
              </button>

              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}