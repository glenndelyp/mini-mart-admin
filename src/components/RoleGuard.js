import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAdmin } from '../lib/useAdmin'

export default function RoleGuard({ allowedRoles, children }) {
  const { admin, role, loading } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!admin) { router.replace('/login'); return }
    if (!allowedRoles.includes(role)) {
      // redirect to their own area
      router.replace(role === 'cashier' ? '/cashier/dashboard' : '/dashboard')
    }
  }, [admin, role, loading])

  if (loading) return <div>Loading...</div>
  if (!admin || !allowedRoles.includes(role)) return null

  return children
}