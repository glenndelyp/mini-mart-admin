// src/pages/api/products/delete.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method not allowed.' })

  const { id } = req.body

  if (!id) return res.status(400).json({ message: 'Product ID is required.' })

  try {
    const result = await sql`
      DELETE FROM products WHERE id = ${id}
      RETURNING id
    `
    if (result.length === 0) return res.status(404).json({ message: 'Product not found.' })
    return res.status(200).json({ message: 'Product deleted successfully.' })
  } catch (err) {
    console.error('[products/delete error]', err)
    return res.status(500).json({ message: 'Failed to delete product.' })
  }
}