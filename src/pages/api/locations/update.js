// src/pages/api/locations/update.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed.' })

  const { id, label, area, status } = req.body
  if (!id || !label?.trim())
    return res.status(400).json({ message: 'ID and label are required.' })

  try {
    const conflict = await sql`
      SELECT id FROM locations
      WHERE LOWER(label) = LOWER(${label.trim()}) AND id != ${id}
    `
    if (conflict.length > 0)
      return res.status(409).json({ message: 'Another location already uses that label.' })

    const result = await sql`
      UPDATE locations
      SET label  = ${label.trim()},
          area   = ${area?.trim() || null},
          status = ${status || 'active'}
      WHERE id = ${id}
      RETURNING id, label, area, status, created_at
    `
    if (result.length === 0)
      return res.status(404).json({ message: 'Location not found.' })

    return res.status(200).json({ location: result[0] })
  } catch (err) {
    console.error('[locations/update error]', err)
    return res.status(500).json({ message: 'Failed to update location.' })
  }
}