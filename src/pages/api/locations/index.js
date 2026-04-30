// src/pages/api/locations/index.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed.' })
  try {
    const locations = await sql`
      SELECT id, label, area, status, created_at
      FROM locations
      ORDER BY label ASC
    `
    return res.status(200).json({ locations })
  } catch (err) {
    console.error('[locations/get error]', err)
    return res.status(500).json({ message: 'Failed to fetch locations.' })
  }
}