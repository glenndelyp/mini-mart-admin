// src/pages/api/suppliers/index.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed.' })

  try {
    const suppliers = await sql`
      SELECT id, full_name, company, contact_num, email, address, status, created_at
      FROM suppliers
      ORDER BY created_at DESC
    `
    return res.status(200).json({ suppliers })
  } catch (err) {
    console.error('[suppliers/get error]', err)
    return res.status(500).json({ message: 'Failed to fetch suppliers.' })
  }
}