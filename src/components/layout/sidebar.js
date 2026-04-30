import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard, Package, ShoppingBag, Truck,
  Tag, MapPin, CreditCard, Settings,        // 👈 MapPin added
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',            href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inventory Management', href: '/inventory', icon: Package         },
  { label: 'Order Management',     href: '/orders',    icon: ShoppingBag     },
  { label: 'Supplier Management',  href: '/suppliers', icon: Truck           },
  { label: 'Category',             href: '/categories',icon: Tag             },
  { label: 'Locations',            href: '/locations', icon: MapPin          },  // 👈 new
  { label: 'Payment',              href: '/payment',   icon: CreditCard      },
  { label: 'Settings',             href: '/settings',  icon: Settings        },
]

export default function Sidebar() {
  const router = useRouter()

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-white border-r border-slate-200 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <span className="text-xl font-bold tracking-tight" style={{ color: '#14532d' }}>
          Mart.
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = router.pathname.startsWith(href)
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
              <Icon size={17} className="flex-shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}