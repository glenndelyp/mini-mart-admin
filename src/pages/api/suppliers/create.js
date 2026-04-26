// src/pages/api/suppliers/create.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' })

  const { full_name, company, contact_num, email, address, status } = req.body

  if (!full_name || !company || !contact_num || !email) {
    return res.status(400).json({ message: 'Full name, company, contact number, and email are required.' })
  }

  try {
    const existing = await sql`SELECT id FROM suppliers WHERE email = ${email}`
    if (existing.length > 0) return res.status(409).json({ message: 'A supplier with that email already exists.' })

    const result = await sql`
      INSERT INTO suppliers (full_name, company, contact_num, email, address, status)
      VALUES (${full_name}, ${company}, ${contact_num}, ${email}, ${address || null}, ${status || 'active'})
      RETURNING id, full_name, company, contact_num, email, address, status, created_at
    `
    return res.status(201).json({ supplier: result[0] })
  } catch (err) {
    console.error('[suppliers/create error]', err)
    return res.status(500).json({ message: 'Failed to create supplier.' })
  }
}