// src/pages/api/auth/logout.js
export default function handler(req, res) {
  // Clear the cookie
res.setHeader('Set-Cookie', [
  'mart_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  'mart_admin_auth=; Path=/; SameSite=Lax; Max-Age=0',
])
  res.status(200).json({ ok: true })
}