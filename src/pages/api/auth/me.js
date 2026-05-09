import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default function handler(req, res) {
  const admin = getAdminFromCookie(req)
  if (!admin) return res.status(401).json({ message: 'Not authenticated' })
  return res.status(200).json({ admin })
}