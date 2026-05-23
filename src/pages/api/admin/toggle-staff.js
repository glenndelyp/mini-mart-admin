import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  const requester = await getAdminFromCookie(req)
  if (!requester || !['superadmin', 'admin'].includes(requester.role)) {
    return res.status(403).json({ message: 'Not authorized.' })
  }

  const { id, is_active } = req.body
  await sql`UPDATE admins SET is_active = ${is_active} WHERE id = ${id}`
  return res.status(200).json({ success: true })
}