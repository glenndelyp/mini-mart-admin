import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed.' })

  const admin = await getAdminFromCookie(req)
  if (!admin || !['superadmin', 'admin'].includes(admin.role)) {
    return res.status(403).json({ message: 'Not authorized.' })
  }

  const { id, name, description, status } = req.body
  if (!id || !name?.trim()) return res.status(400).json({ message: 'ID and name are required.' })

  try {
    const conflict = await sql`SELECT id FROM categories WHERE LOWER(name) = LOWER(${name}) AND id != ${id}`
    if (conflict.length > 0) return res.status(409).json({ message: 'Another category already uses that name.' })

    const result = await sql`
      UPDATE categories
      SET name        = ${name.trim()},
          description = ${description || null},
          status      = ${status || 'active'}
      WHERE id = ${id}
      RETURNING id, name, description, status, created_at
    `
    if (result.length === 0) return res.status(404).json({ message: 'Category not found.' })
    return res.status(200).json({ category: result[0] })
  } catch (err) {
    console.error('[categories/update error]', err)
    return res.status(500).json({ message: 'Failed to update category.' })
  }
}