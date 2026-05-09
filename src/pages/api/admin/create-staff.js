import { sql } from '../../../lib/db'
import bcrypt from 'bcryptjs'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const requester = getAdminFromCookie(req)
  if (!requester || !['superadmin', 'admin'].includes(requester.role)) {
    return res.status(403).json({ message: 'Not authorized.' })
  }

  const { first_name, last_name, username, password, role } = req.body

  // ✅ Both roles allowed
  const ALLOWED_ROLES = ['cashier', 'admin']
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' })
  }

  // ✅ Only superadmin can create admin accounts
  if (role === 'admin' && requester.role !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can create admin accounts.' })
  }

  try {
    const existing = await sql`
      select id from admins where username = ${username}
    `
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already taken.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await sql`
      insert into admins (first_name, last_name, username, password, role, is_active)
      values (${first_name}, ${last_name}, ${username}, ${hashedPassword}, ${role}, true)
      returning id, first_name, last_name, username, role, is_active, created_at
    `

    return res.status(200).json({ staff: result[0] })
  } catch (err) {
    console.error('[create-staff error]', err)
    return res.status(500).json({ message: 'Server error.' })
  }
}