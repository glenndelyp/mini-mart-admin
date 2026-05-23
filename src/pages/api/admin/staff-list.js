import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  const requester = getAdminFromCookie(req)
  if (!requester || !['superadmin', 'admin'].includes(requester.role)) {
    return res.status(403).json({ message: 'Not authorized.' })
  }

  try {
    const staff = await sql`
      SELECT id, first_name, last_name, username, role, is_active, created_at
      FROM admins
      WHERE role IN ('cashier', 'admin')
      ORDER BY created_at DESC
    `
    return res.status(200).json({ staff })
  } catch (err) {
    console.error('[staff-list error]', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}