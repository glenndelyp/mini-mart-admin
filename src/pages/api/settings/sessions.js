import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  const admin = getAdminFromCookie(req)
  if (!admin) return res.status(401).json({ message: 'Not authenticated' })

  try {
    const logs = await sql`
      SELECT
        l.id,
        l.ip,
        l.user_agent,
        l.created_at,
        a.username,
        a.first_name,
        a.last_name
      FROM login_logs l
      LEFT JOIN admins a ON a.id = l.admin_id
      ORDER BY l.created_at DESC
      LIMIT 50
    `

    return res.status(200).json({
      lastLogin: logs[0] ?? null,
      sessions:  logs,
    })
  } catch (err) {
    console.error('[sessions error]', err)
    return res.status(200).json({ lastLogin: null, sessions: [] })
  }
}