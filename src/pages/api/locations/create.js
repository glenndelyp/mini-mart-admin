// src/pages/api/locations/create.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' })

  const { label, area, status } = req.body
  if (!label?.trim()) return res.status(400).json({ message: 'Location label is required.' })

  try {
    const existing = await sql`
      SELECT id FROM locations WHERE LOWER(label) = LOWER(${label.trim()})
    `
    if (existing.length > 0)
      return res.status(409).json({ message: 'A location with that label already exists.' })

    const result = await sql`
      INSERT INTO locations (label, area, status)
      VALUES (${label.trim()}, ${area?.trim() || null}, ${status || 'active'})
      RETURNING id, label, area, status, created_at
    `
    return res.status(201).json({ location: result[0] })
  } catch (err) {
    console.error('[locations/create error]', err)
    return res.status(500).json({ message: 'Failed to create location.' })
  }
}