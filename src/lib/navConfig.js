export const NAV_BY_ROLE = {
  superadmin: [
    { label: 'Dashboard',            href: '/dashboard' },
    { label: 'Inventory Management', href: '/inventory' },
    { label: 'Order Management',     href: '/orders' },
    { label: 'Supplier Management',  href: '/suppliers' },
    { label: 'Category',             href: '/categories' },
    { label: 'Locations',            href: '/locations' },
    { label: 'Payment',              href: '/products' },
    { label: 'Settings',             href: '/settings' },
    { label: 'Manage Staff',         href: '/admin/staff' },
  ],
  admin: [
    { label: 'Dashboard',            href: '/dashboard' },
    { label: 'Inventory Management', href: '/inventory' },
    { label: 'Order Management',     href: '/orders' },
    { label: 'Supplier Management',  href: '/suppliers' },
    { label: 'Category',             href: '/categories' },
    { label: 'Locations',            href: '/locations' },
    { label: 'Payment',              href: '/products' },
    { label: 'Manage Staff',         href: '/admin/staff' },
  ],
  cashier: [
    { label: 'Dashboard',            href: '/cashier/dashboard' },
    { label: 'Order Management',     href: '/orders' },
    { label: 'Payment',              href: '/products' },
  ],
}