import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  const requester = getAdminFromCookie(req)
  if (!requester || !['superadmin', 'admin'].includes(requester.role)) {
    return res.status(403).json({ message: 'Not authorized.' })
  }
  const { id, is_active } = req.body
  await sql`update admins set is_active = ${is_active} where id = ${id}`
  return res.status(200).json({ success: true })
}