import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Package, ShoppingBag, Truck,
  Tag, MapPin, CreditCard, Settings, Users,
} from 'lucide-react'

// ✅ Each role gets ONLY the nav items they should see
const NAV_BY_ROLE = {
  superadmin: [
    { label: 'Dashboard',            href: '/dashboard',   icon: LayoutDashboard },
    { label: 'Inventory Management', href: '/inventory',   icon: Package         },
    { label: 'Order Management',     href: '/orders',      icon: ShoppingBag     },
    { label: 'Supplier Management',  href: '/suppliers',   icon: Truck           },
    { label: 'Category',             href: '/categories',  icon: Tag             },
    { label: 'Locations',            href: '/locations',   icon: MapPin          },
    { label: 'Settings',             href: '/settings',    icon: Settings        },
    { label: 'Manage Staff',         href: '/admin/staff', icon: Users           },
  ],
  admin: [
    { label: 'Dashboard',            href: '/dashboard',   icon: LayoutDashboard },
    { label: 'Inventory Management', href: '/inventory',   icon: Package         },
    { label: 'Order Management',     href: '/orders',      icon: ShoppingBag     },
    { label: 'Supplier Management',  href: '/suppliers',   icon: Truck           },
    { label: 'Category',             href: '/categories',  icon: Tag             },
    { label: 'Locations',            href: '/locations',   icon: MapPin          },
    { label: 'Settings',             href: '/settings',    icon: Settings        },
    { label: 'Manage Staff',         href: '/admin/staff', icon: Users           },
  ],
  cashier: [
    { label: 'Dashboard',        href: '/dashboard', icon: LayoutDashboard },
    { label: 'Order Management', href: '/orders',    icon: ShoppingBag     },
  ],
}

// Badge style per role
const ROLE_BADGE = {
  superadmin: 'bg-emerald-50 text-emerald-700',
  admin:      'bg-emerald-50 text-emerald-700',
  cashier:    'bg-blue-50 text-blue-600',
}

const ROLE_LABEL = {
  superadmin: 'Super Admin',
  admin:      'Admin',
  cashier:    'Cashier',
}

export default function Sidebar() {
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [role, setRole] = useState(null)

  useEffect(() => {
    async function fetchRole() {
      try {
        const res  = await fetch('/api/auth/me')
        const data = await res.json()
        setRole(data.admin?.role?.toLowerCase().trim() ?? null)
      } catch {
        // silently fail
      }
    }
    fetchRole()
  }, [])

  useEffect(() => {
    async function fetchPending() {
      try {
        const res  = await fetch('/api/orders')
        const data = await res.json()
        const count = (data.orders ?? []).filter(o => o.status === 'pending').length
        setPendingCount(count)
      } catch {}
    }
    fetchPending()
    const interval = setInterval(fetchPending, 30_000)
    return () => clearInterval(interval)
  }, [])

  // ✅ Nav items driven entirely by role — cashiers never see admin pages
  const navItems = NAV_BY_ROLE[role] ?? []

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-50">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <span className="text-xl font-bold tracking-tight" style={{ color: '#14532d' }}>
          Mart.
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive  = router.pathname.startsWith(href)
          const showBadge = label === 'Order Management' && pendingCount > 0

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
              style={isActive ? { backgroundColor: '#14532d' } : {}}
            >
              <div className="relative flex-shrink-0">
                <Icon size={17} />
                {showBadge && (
                  <span className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[15px] text-center leading-none ${
                    isActive ? 'bg-white text-emerald-800' : 'bg-red-500 text-white'
                  }`}>
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom role badge */}
      {role && (
        <div className="px-4 py-3 border-t border-slate-100">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            ROLE_BADGE[role] ?? 'bg-slate-100 text-slate-500'
          }`}>
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>
      )}
    </aside>
  )
}