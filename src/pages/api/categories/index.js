// src/pages/api/categories/index.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed.' })
  try {
    const categories = await sql`
      SELECT id, name, description, status, created_at
      FROM categories
      ORDER BY name ASC
    `
    return res.status(200).json({ categories })
  } catch (err) {
    console.error('[categories/get error]', err)
    return res.status(500).json({ message: 'Failed to fetch categories.' })
  }
}