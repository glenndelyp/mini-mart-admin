import Layout from '@/components/layout/layout'
import '@/styles/globals.css'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

const NO_LAYOUT_ROUTES = ['/login']
const PUBLIC_ROUTES    = ['/login']

export default function App({ Component, pageProps, router }) {
  const noLayout = NO_LAYOUT_ROUTES.includes(router.pathname)
  const clientRouter = useRouter()

  useEffect(() => {
    const isPublic = PUBLIC_ROUTES.includes(router.pathname)

    // Check if the mart_admin cookie exists
  const hasCookie = document.cookie
  .split('; ')
  .some(row => row.startsWith('mart_admin_auth='))

    if (!isPublic && !hasCookie) {
      // No session — block access and redirect to login
      clientRouter.replace('/login')
      return
    }

    if (isPublic && hasCookie) {
      // Already logged in — don't let them see /login again
      clientRouter.replace('/dashboard')
      return
    }

    // Prevent browser back button from returning to protected pages after logout
    if (!isPublic) {
      window.history.pushState(null, '', window.location.href)
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href)
      }
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [router.pathname])

  if (noLayout) {
    return <Component {...pageProps} />
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}