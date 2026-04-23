import { Search, Bell, ChevronDown } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between">

      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-72">
        <Search size={15} className="text-gray-400" />
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Search something here"
          className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">

        {/* Bell */}
        <button suppressHydrationWarning className="text-gray-500 hover:text-gray-800">
          <Bell size={20} />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200" />

        {/* Avatar + name */}
        <button suppressHydrationWarning className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-sm">J</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800 leading-none">Jane Doe</p>
            <p className="text-xs text-gray-400 mt-0.5">jane@gmail.com</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

      </div>
    </header>
  )
}