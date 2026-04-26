// src/pages/api/products/update.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed.' })

  const { id, name, sku, category, stock, unit, unit_price, threshold, supplier, image_url } = req.body

  if (!id || !name || !sku || !category || stock === undefined || !unit || unit_price === undefined || threshold === undefined) {
    return res.status(400).json({ message: 'All required fields must be filled.' })
  }

  try {
    const conflict = await sql`SELECT id FROM products WHERE sku = ${sku} AND id != ${id}`
    if (conflict.length > 0) return res.status(409).json({ message: 'Another product already uses that SKU.' })

    const result = await sql`
      UPDATE products
      SET name       = ${name},
          sku        = ${sku},
          category   = ${category},
          stock      = ${Number(stock)},
          unit       = ${unit},
          unit_price = ${Number(unit_price)},
          threshold  = ${Number(threshold)},
          supplier   = ${supplier || null},
          image_url  = ${image_url || null}
      WHERE id = ${id}
      RETURNING id, name, sku, category, stock, unit, unit_price, threshold, supplier, image_url, created_at
    `
    if (result.length === 0) return res.status(404).json({ message: 'Product not found.' })
    return res.status(200).json({ product: result[0] })
  } catch (err) {
    console.error('[products/update error]', err)
    return res.status(500).json({ message: 'Failed to update product.' })
  }
}