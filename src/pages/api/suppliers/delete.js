import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Method not allowed.' })

  const admin = await getAdminFromCookie(req)
  if (!admin || !['superadmin', 'admin'].includes(admin.role)) {
    return res.status(403).json({ message: 'Not authorized.' })
  }

  const { id } = req.body
  if (!id) return res.status(400).json({ message: 'Supplier ID is required.' })

  try {
    const result = await sql`DELETE FROM suppliers WHERE id = ${id} RETURNING id`
    if (result.length === 0) return res.status(404).json({ message: 'Supplier not found.' })
    return res.status(200).json({ message: 'Supplier deleted successfully.' })
  } catch (err) {
    console.error('[suppliers/delete error]', err)
    return res.status(500).json({ message: 'Failed to delete supplier.' })
  }
}