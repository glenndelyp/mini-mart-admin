import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const requester = getAdminFromCookie(req)
  if (!requester || requester.role !== 'superadmin') {
    return res.status(403).json({ message: 'Only superadmin can generate confirmation codes.' })
  }

  const { first_name, last_name, username, password, role } = req.body

  if (!first_name || !last_name || !username || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' })
  }

  const ALLOWED_ROLES = ['cashier', 'admin']
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' })
  }

  try {
    const existing = await sql`
      SELECT id FROM admins WHERE username = ${username}
    `
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already taken.' })
    }

    await sql`
      DELETE FROM staff_confirmation_codes
      WHERE created_by = ${requester.id} AND used = FALSE
    `

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // ✅ Pass object directly — no JSON.stringify
    const payload = { first_name, last_name, username, password, role }

    await sql`
      INSERT INTO staff_confirmation_codes (code, payload, created_by, expires_at)
      VALUES (
        ${code},
        ${sql.json(payload)},
        ${requester.id},
        ${expiresAt}
      )
    `

    return res.status(200).json({
      message: 'Confirmation code generated.',
      code,
      expires_in_seconds: 300
    })

  } catch (err) {
    console.error('[request-staff-code error]', err)
    return res.status(500).json({ message: err.message })
  }
}