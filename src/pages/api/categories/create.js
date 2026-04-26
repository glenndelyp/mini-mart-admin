// src/pages/api/categories/create.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' })
  const { name, description, status } = req.body
  if (!name?.trim()) return res.status(400).json({ message: 'Category name is required.' })
  try {
    const existing = await sql`SELECT id FROM categories WHERE LOWER(name) = LOWER(${name})`
    if (existing.length > 0) return res.status(409).json({ message: 'A category with that name already exists.' })
    const result = await sql`
      INSERT INTO categories (name, description, status)
      VALUES (${name.trim()}, ${description || null}, ${status || 'active'})
      RETURNING id, name, description, status, created_at
    `
    return res.status(201).json({ category: result[0] })
  } catch (err) {
    console.error('[categories/create error]', err)
    return res.status(500).json({ message: 'Failed to create category.' })
  }
}