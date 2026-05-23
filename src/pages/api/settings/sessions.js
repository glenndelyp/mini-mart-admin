import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  const admin = await getAdminFromCookie(req)
  if (!admin) return res.status(401).json({ message: 'Not authenticated.' })

  if (req.method === 'GET') {
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
      return res.status(200).json({ lastLogin: logs[0] ?? null, sessions: logs })
    } catch (err) {
      console.error('[sessions error]', err)
      return res.status(200).json({ lastLogin: null, sessions: [] })
    }
  }

  if (req.method === 'DELETE') {
    if (admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized.' })
    }
    const { id } = req.body
    if (!id) return res.status(400).json({ message: 'Session ID is required.' })
    try {
      await sql`DELETE FROM login_logs WHERE id = ${id}`
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[sessions delete error]', err)
      return res.status(500).json({ message: 'Failed to delete session.' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed.' })
}