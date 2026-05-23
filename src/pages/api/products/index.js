import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed.' })

  const admin = await getAdminFromCookie(req)
  if (!admin) return res.status(401).json({ message: 'Not authenticated.' })

  try {
    const products = await sql`
      SELECT id, name, sku, category, stock, unit, unit_price, cost, threshold, supplier, image_url, created_at
      FROM products
      ORDER BY created_at DESC
    `
    return res.status(200).json({ products })
  } catch (err) {
    console.error('[products/get error]', err)
    return res.status(500).json({ message: 'Failed to fetch products.' })
  }
}