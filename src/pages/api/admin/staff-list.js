import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  const requester = getAdminFromCookie(req)
  if (!requester || !['superadmin', 'admin'].includes(requester.role)) {
    return res.status(403).json({ message: 'Not authorized.' })
  }
  const staff = await sql`
    select id, first_name, last_name, username, role, is_active, created_at
    from admins where role = 'cashier' order by created_at desc
  `
  return res.status(200).json({ staff })
}