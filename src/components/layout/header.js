// src/components/layout/Header.js
import { useState, useEffect, useRef } from 'react'
import {
  Search, Bell, ChevronDown, LogOut, Settings,
  Package, ShoppingBag, AlertTriangle, Clock, X,
} from 'lucide-react'
import { useRouter } from 'next/router'
import { useNotifications } from '@/hooks/useNotifications'

function getAdminFromCookie() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find(row => row.startsWith('mart_admin='))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')))
  } catch { return null }
}

// ── Notification type config ───────────────────────────────────────────────
const NOTIF_CONFIG = {
  overdue: {
    icon:      Clock,
    iconBg:    'bg-red-100',
    iconColor: 'text-red-600',
    label:     'Overdue',
    labelCls:  'bg-red-50 text-red-600 border-red-200',
  },
  out_of_stock: {
    icon:      Package,
    iconBg:    'bg-red-100',
    iconColor: 'text-red-600',
    label:     'Out of Stock',
    labelCls:  'bg-red-50 text-red-600 border-red-200',
  },
  low_stock: {
    icon:      AlertTriangle,
    iconBg:    'bg-amber-100',
    iconColor: 'text-amber-600',
    label:     'Low Stock',
    labelCls:  'bg-amber-50 text-amber-700 border-amber-200',
  },
  pending_order: {
    icon:      ShoppingBag,
    iconBg:    'bg-blue-50',
    iconColor: 'text-blue-600',
    label:     'Pending',
    labelCls:  'bg-blue-50 text-blue-600 border-blue-200',
  },
}

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ── Notification dropdown component ───────────────────────────────────────
function NotificationDropdown({ notifications, loading, unreadCount, onMarkRead, onClose }) {
  const router = useRouter()

  const handleClick = (href) => {
    onClose()
    router.push(href)
  }

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkRead}
              className="text-xs font-semibold hover:underline"
              style={{ color: '#14532d' }}
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">

        {/* Loading skeleton */}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 px-4 py-3 animate-pulse">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-3 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-2.5 bg-slate-100 rounded w-1/3" />
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <Bell size={20} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-400">You're all caught up!</p>
            <p className="text-xs text-slate-300 mt-1">No alerts at the moment.</p>
          </div>
        )}

        {/* Notification rows */}
        {!loading && notifications.map(n => {
          const cfg  = NOTIF_CONFIG[n.type] ?? NOTIF_CONFIG.pending_order
          const Icon = cfg.icon
          return (
            <button
              key={n.id}
              onClick={() => handleClick(n.href)}
              className="w-full flex gap-3 px-4 py-3 hover:bg-slate-50 transition text-left"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                <Icon size={16} className={cfg.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.labelCls}`}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto flex-shrink-0">
                    {timeAgo(n.time)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-snug">{n.title}</p>
                <p className="text-xs text-slate-500 leading-snug mt-0.5 truncate">{n.message}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      {!loading && notifications.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2.5 flex justify-between">
          <button
            onClick={() => { onClose(); router.push('/inventory') }}
            className="text-xs text-slate-400 hover:text-slate-600 transition"
          >
            View inventory →
          </button>
          <button
            onClick={() => { onClose(); router.push('/orders') }}
            className="text-xs text-slate-400 hover:text-slate-600 transition"
          >
            View orders →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Header ────────────────────────────────────────────────────────────
export default function Header() {
  const router = useRouter()
  const [admin,    setAdmin]    = useState(null)
  const [dropOpen, setDropOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const dropRef = useRef(null)
  const bellRef = useRef(null)

  const { notifications, loading, unreadCount, markAllRead } = useNotifications()

  useEffect(() => { setAdmin(getAdminFromCookie()) }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
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
  const ROLE_LABEL = { superadmin: 'Super Admin', admin: 'Admin', cashier: 'Cashier' }
  const roleLabel = ROLE_LABEL[admin?.role?.toLowerCase()] ?? 'Staff'

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

      {/* Right side */}
      <div className="flex items-center gap-4">

        {/* ── Bell ── */}
        <div className="relative" ref={bellRef}>
          <button
            suppressHydrationWarning
            onClick={() => {
              const opening = !bellOpen
              setBellOpen(opening)
              if (opening) markAllRead()
            }}
            className="relative text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-400 opacity-50 animate-ping" />
              </>
            )}
          </button>

          {bellOpen && (
            <NotificationDropdown
              notifications={notifications}
              loading={loading}
              unreadCount={unreadCount}
              onMarkRead={markAllRead}
              onClose={() => setBellOpen(false)}
            />
          )}
        </div>

        <div className="w-px h-8 bg-slate-200" />

        {/* ── Profile dropdown ── */}
        <div className="relative" ref={dropRef}>
          <button
            suppressHydrationWarning
            onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: '#14532d' }}
            >
              {initials}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800 leading-none">{fullName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{roleLabel}</p>
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">{fullName}</p>
                <p className="text-xs text-slate-400 mt-0.5">@{admin?.username ?? 'admin'}</p>
                <span
                  className="inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border"
                  style={{ color: '#14532d', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
                >
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