import { sql } from '../../../lib/db'
import { getAdminFromCookie } from '../../../lib/getAdminFromCookie'

export default async function handler(req, res) {
  const admin = await getAdminFromCookie(req)
  if (!admin) return res.status(401).json({ message: 'Not authenticated.' })

  const { id } = req.query

  if (req.method === 'PATCH') {
    const { status, notes, eta_minutes } = req.body

    const allowed = ['confirmed', 'in_transit', 'delivered', 'cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' })
    }

    try {
      const now = new Date()

      // Build deadline for confirmed orders with ETA
      const deadline =
        status === 'confirmed' && eta_minutes && !isNaN(parseInt(eta_minutes))
          ? new Date(now.getTime() + parseInt(eta_minutes) * 60 * 1000)
          : null

      const extra =
        status === 'confirmed'
          ? deadline
            ? sql`, confirmed_at = ${now}, delivery_deadline = ${deadline}`
            : sql`, confirmed_at = ${now}`
          : status === 'delivered'
          ? sql`, delivered_at = ${now}`
          : status === 'cancelled'
          ? sql`, cancelled_at = ${now}`
          : sql``

      const [order] = await sql`
        UPDATE orders
        SET status = ${status}, notes = COALESCE(${notes || null}, notes) ${extra}
        WHERE id = ${id}
        RETURNING *
      `
      if (!order) return res.status(404).json({ message: 'Order not found.' })

      const [user] = await sql`
        SELECT first_name || ' ' || last_name AS customer_name,
               email AS customer_email
        FROM users WHERE id = ${order.user_id}
      `
      const items = await sql`
        SELECT * FROM order_items WHERE order_id = ${id} ORDER BY id ASC
      `

      return res.status(200).json({
        order: {
          ...order,
          customer_name:  user?.customer_name  ?? '',
          customer_email: user?.customer_email ?? '',
          items,
        },
      })
    } catch (err) {
      console.error('[orders/[id] PATCH error]', err)
      return res.status(500).json({ message: 'Failed to update order status.' })
    }
  }

  if (req.method === 'DELETE') {
    if (admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can delete orders.' })
    }
    try {
      const [deleted] = await sql`DELETE FROM orders WHERE id = ${id} RETURNING id`
      if (!deleted) return res.status(404).json({ message: 'Order not found.' })
      return res.status(200).json({ message: 'Order deleted.' })
    } catch (err) {
      console.error('[orders/[id] DELETE error]', err)
      return res.status(500).json({ message: 'Failed to delete order.' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed.' })
}