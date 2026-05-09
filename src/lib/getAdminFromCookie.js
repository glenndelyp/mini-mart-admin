export function getAdminFromCookie(req) {
  try {
    const raw = req.cookies?.mart_admin
    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    return null
  }
}