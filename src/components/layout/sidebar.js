import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CreditCard,
  Settings,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',            href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inventory Management', href: '/inventory', icon: Package         },
  { label: 'Order Management',     href: '/orders',    icon: ShoppingBag     },
  { label: 'Payment',              href: '/payment',   icon: CreditCard      },
  { label: 'Settings',             href: '/settings',  icon: Settings        },
]

export default function Sidebar() {
  const router = useRouter()

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-indigo-600 tracking-tight">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}