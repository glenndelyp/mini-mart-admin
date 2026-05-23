import bcrypt from 'bcryptjs'
import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const admin = await getAdminFromCookie(req)
  if (!admin) return res.status(401).json({ message: 'Not authenticated' })

  const { currentPassword, newPassword, targetAdminId } = req.body

  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ message: 'New password must be at least 8 characters' })

  if (targetAdminId && admin.role === 'superadmin') {
    const hashed = await bcrypt.hash(newPassword, 12)
    await sql`UPDATE admins SET password = ${hashed} WHERE id = ${targetAdminId}`
    return res.status(200).json({ ok: true })
  }

  if (!currentPassword)
    return res.status(400).json({ message: 'Current password is required' })

  const rows = await sql`SELECT password FROM admins WHERE id = ${admin.id}`
  if (rows.length === 0) return res.status(404).json({ message: 'Account not found' })

  const match = await bcrypt.compare(currentPassword, rows[0].password)
  if (!match) return res.status(400).json({ message: 'Current password is incorrect' })

  const hashed = await bcrypt.hash(newPassword, 12)
  await sql`UPDATE admins SET password = ${hashed} WHERE id = ${admin.id}`

  return res.status(200).json({ ok: true })
}