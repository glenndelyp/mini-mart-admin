import { useEffect, useState } from 'react'

export function useAdmin() {
  const [admin, setAdmin]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setAdmin(data?.admin ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { admin, role: admin?.role ?? null, loading }
}