import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Users, UserCheck, UserX, ShieldCheck,
  Search, ChevronRight, ExternalLink,
} from 'lucide-react'

// ─── Role badge config ────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  cashier: { label: 'Cashier', style: 'bg-blue-50 text-blue-700 border border-blue-200'       },
  admin:   { label: 'Admin',   style: 'bg-violet-50 text-violet-700 border border-violet-200' },
}

// ─── MembersSettings ──────────────────────────────────────────────────────────
export default function MembersSettings() {
  const router = useRouter()
  const [staffList,    setStaffList]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    fetch('/api/admin/staff-list')
      .then(r => r.json())
      .then(d => setStaffList(d.staff ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = staffList.filter(s => {
    const name        = `${s.first_name} ${s.last_name}`.toLowerCase()
    const matchSearch = name.includes(search.toLowerCase()) || s.username.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'All' || s.role === roleFilter.toLowerCase()
    const matchStatus = statusFilter === 'All' ? true : statusFilter === 'Active' ? s.is_active : !s.is_active
    return matchSearch && matchRole && matchStatus
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-56">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search name or username"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-slate-600 outline-none w-full placeholder-slate-400"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none cursor-pointer bg-white"
          >
            {['All', 'Cashier', 'Admin'].map(r => <option key={r}>{r}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none cursor-pointer bg-white"
          >
            {['All', 'Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-400">{filtered.length} members</p>
          <button
            onClick={() => router.push('/admin/staff')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <ExternalLink size={12} /> Manage Staff
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <table className="w-full">
        <thead>
          <tr className="text-xs" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
            {['Member', 'Username', 'Role', 'Status', 'Joined'].map(h => (
              <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="border-t border-slate-100">
              {Array.from({ length: 5 }).map((_, j) => (
                <td key={j} className="px-5 py-3.5">
                  <div className="h-3.5 bg-slate-100 rounded animate-pulse" style={{ width: '70%' }} />
                </td>
              ))}
            </tr>
          ))}

          {!loading && filtered.map((s, i) => {
            const roleConf = ROLE_CONFIG[s.role] ?? ROLE_CONFIG.cashier
            return (
              <tr key={s.id} className={`text-sm border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: '#14532d' }}
                    >
                      {s.first_name?.[0]}{s.last_name?.[0]}
                    </div>
                    <span className="text-sm font-medium text-slate-800">{s.first_name} {s.last_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{s.username}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleConf.style}`}>
                    {roleConf.label}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-xs">
                  {new Date(s.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
              </tr>
            )
          })}

          {!loading && filtered.length === 0 && (
            <tr><td colSpan={5}>
              <div className="flex flex-col items-center justify-center py-14">
                <Users size={28} className="text-slate-300 mb-2" />
                <p className="text-sm text-slate-400 font-medium">No members found</p>
                <p className="text-xs text-slate-300 mt-1">Try adjusting your filters</p>
              </div>
            </td></tr>
          )}
        </tbody>
      </table>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          To add, activate, or deactivate staff — use the{' '}
          <button
            onClick={() => router.push('/admin/staff')}
            className="font-semibold hover:underline"
            style={{ color: '#14532d' }}
          >
            Manage Staff
          </button> page.
        </p>
        <ChevronRight size={14} className="text-slate-300" />
      </div>
    </div>
  )
}