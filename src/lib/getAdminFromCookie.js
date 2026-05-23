import { jwtVerify } from 'jose'

export async function getAdminFromCookie(req) {
  try {
    const token = req.cookies?.mart_admin
    if (!token) return null

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload // { id, role, username }
  } catch {
    return null // expired or tampered = rejected
  }
}