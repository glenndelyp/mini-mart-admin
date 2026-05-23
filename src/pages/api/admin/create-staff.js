import { sql } from '../../../lib/db'
import bcrypt from 'bcryptjs'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const requester = await getAdminFromCookie(req)
  if (!requester || !['superadmin', 'admin'].includes(requester.role)) {
    return res.status(403).json({ message: 'Not authorized.' })
  }

  const { code } = req.body

  if (!code) {
    return res.status(400).json({ message: 'Confirmation code is required.' })
  }

  try {
    const rows = await sql`
      SELECT * FROM staff_confirmation_codes
      WHERE code = ${code}
        AND used = FALSE
        AND expires_at > NOW()
      LIMIT 1
    `

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired confirmation code.' })
    }

    const record = rows[0]

    let payload = typeof record.payload === 'string'
      ? JSON.parse(record.payload)
      : record.payload

    if (typeof payload === 'string') {
      payload = JSON.parse(payload)
    }

    const { first_name, last_name, username, password, role } = payload

    console.log('[create-staff] parsed payload:', payload)

    if (!first_name || !last_name || !username || !password || !role) {
      return res.status(400).json({ message: 'Payload incomplete. Please go back and try again.' })
    }

    const existing = await sql`
      SELECT id FROM admins WHERE username = ${username}
    `
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already taken.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await sql`
      INSERT INTO admins (first_name, last_name, username, password, role, is_active)
      VALUES (${first_name}, ${last_name}, ${username}, ${hashedPassword}, ${role}, true)
      RETURNING id, first_name, last_name, username, role, is_active, created_at
    `

    await sql`
      UPDATE staff_confirmation_codes SET used = TRUE WHERE id = ${record.id}
    `

    return res.status(200).json({ staff: result[0] })

  } catch (err) {
    console.error('[create-staff error]', err)
    return res.status(500).json({ message: err.message })
  }
}