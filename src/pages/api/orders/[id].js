// src/pages/api/orders/[id].js
import { sql } from '../../../lib/db'

export default async function handler(req, res) {
  const { id } = req.query

  // PATCH /api/orders/:id  → update status
  if (req.method === 'PATCH') {
    const { status, notes } = req.body

    const allowed = ['confirmed', 'in_transit', 'delivered', 'cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' })
    }

    try {
      const now = new Date()
      const extra =
        status === 'confirmed' ? sql`, confirmed_at = ${now}` :
        status === 'delivered' ? sql`, delivered_at = ${now}` :
        sql``

      const [order] = await sql`
        UPDATE orders
        SET
          status = ${status},
          notes  = COALESCE(${notes || null}, notes)
          ${extra}
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
        }
      })
    } catch (err) {
      console.error('[orders/[id] PATCH error]', err)
      return res.status(500).json({ message: 'Failed to update order status.' })
    }
  }

  // DELETE /api/orders/:id
  if (req.method === 'DELETE') {
    try {
      const [deleted] = await sql`
        DELETE FROM orders WHERE id = ${id} RETURNING id
      `
      if (!deleted) return res.status(404).json({ message: 'Order not found.' })
      return res.status(200).json({ message: 'Order deleted.' })
    } catch (err) {
      console.error('[orders/[id] DELETE error]', err)
      return res.status(500).json({ message: 'Failed to delete order.' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed.' })
}