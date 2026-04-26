// src/pages/api/suppliers/update.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed.' })

  const { id, full_name, company, contact_num, email, address, status } = req.body

  if (!id || !full_name || !company || !contact_num || !email) {
    return res.status(400).json({ message: 'All required fields must be filled.' })
  }

  try {
    const conflict = await sql`SELECT id FROM suppliers WHERE email = ${email} AND id != ${id}`
    if (conflict.length > 0) return res.status(409).json({ message: 'Another supplier already uses that email.' })

    const result = await sql`
      UPDATE suppliers
      SET full_name   = ${full_name},
          company     = ${company},
          contact_num = ${contact_num},
          email       = ${email},
          address     = ${address || null},
          status      = ${status || 'active'}
      WHERE id = ${id}
      RETURNING id, full_name, company, contact_num, email, address, status, created_at
    `
    if (result.length === 0) return res.status(404).json({ message: 'Supplier not found.' })
    return res.status(200).json({ supplier: result[0] })
  } catch (err) {
    console.error('[suppliers/update error]', err)
    return res.status(500).json({ message: 'Failed to update supplier.' })
  }
}