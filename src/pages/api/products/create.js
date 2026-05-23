import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' })

  const admin = await getAdminFromCookie(req)
  if (!admin || !['superadmin', 'admin'].includes(admin.role)) {
    return res.status(403).json({ message: 'Not authorized.' })
  }

  const { name, sku, category, stock, unit, unit_price, cost, threshold, supplier, image_url } = req.body

  if (!name || !sku || !category || stock === undefined || !unit || unit_price === undefined || cost === undefined || threshold === undefined) {
    return res.status(400).json({ message: 'Name, SKU, category, stock, unit, unit price, cost, and threshold are required.' })
  }

  try {
    const existing = await sql`SELECT id FROM products WHERE sku = ${sku}`
    if (existing.length > 0) return res.status(409).json({ message: 'A product with that SKU already exists.' })

    const result = await sql`
      INSERT INTO products (name, sku, category, stock, unit, unit_price, cost, threshold, supplier, image_url)
      VALUES (
        ${name}, ${sku}, ${category}, ${Number(stock)}, ${unit},
        ${Number(unit_price)}, ${Number(cost)}, ${Number(threshold)},
        ${supplier || null}, ${image_url || null}
      )
      RETURNING id, name, sku, category, stock, unit, unit_price, cost, threshold, supplier, image_url, created_at
    `
    return res.status(201).json({ product: result[0] })
  } catch (err) {
    console.error('[products/create error]', err)
    return res.status(500).json({ message: 'Failed to create product.' })
  }
}