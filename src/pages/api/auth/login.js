import bcrypt from 'bcryptjs'
import { sql } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' })

  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' })
  }

  try {
    const result = await sql`
      SELECT * FROM admins WHERE username = ${username}
    `

    if (result.length === 0) {
      return res.status(401).json({ message: 'No account found with that username.' })
    }

    const admin = result[0]

    if (!admin.is_active) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact your administrator.' })
    }

    const passwordMatch = await bcrypt.compare(password, admin.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password.' })
    }

    const { password: _, ...safeAdmin } = admin

    res.setHeader('Set-Cookie', [
      `mart_admin=${encodeURIComponent(JSON.stringify(safeAdmin))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 8}`,
      `mart_admin_auth=1; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 8}`,
    ])

    return res.status(200).json({ user: safeAdmin })
  } catch (err) {
    console.error('[login error]', err)
    return res.status(500).json({ message: 'Server error. Please try again.' })
  }
}