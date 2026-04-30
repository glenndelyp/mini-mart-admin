// src/pages/api/locations/delete.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method not allowed.' })

  const { id } = req.body
  if (!id) return res.status(400).json({ message: 'Location ID is required.' })

  try {
    const result = await sql`
      DELETE FROM locations WHERE id = ${id} RETURNING id
    `
    if (result.length === 0)
      return res.status(404).json({ message: 'Location not found.' })

    return res.status(200).json({ message: 'Location deleted successfully.' })
  } catch (err) {
    console.error('[locations/delete error]', err)
    return res.status(500).json({ message: 'Failed to delete location.' })
  }
}