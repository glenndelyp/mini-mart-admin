// src/pages/api/orders/index.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed.' })

  try {
    // Fetch all orders joined with user info and their items
    const orders = await sql`
      SELECT
        o.id,
        o.user_id,
        o.status,
        o.total_amount,
        o.delivery_address,
        o.notes,
        o.estimated_delivery,
        o.created_at,
        o.confirmed_at,
        o.delivered_at,
        u.first_name || ' ' || u.last_name AS customer_name,
        u.email                             AS customer_email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `

    // Fetch all order items in one query (avoid N+1)
    const orderIds = orders.map(o => o.id)

    let items = []
    if (orderIds.length > 0) {
      items = await sql`
        SELECT
          oi.order_id,
          oi.id,
          oi.product_id,
          oi.product_name,
          oi.unit_price,
          oi.quantity,
          oi.subtotal
        FROM order_items oi
        WHERE oi.order_id = ANY(${orderIds})
        ORDER BY oi.id ASC
      `
    }

    // Group items by order_id
    const itemsByOrder = {}
    for (const item of items) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
      itemsByOrder[item.order_id].push(item)
    }

    // Attach items to each order
    const ordersWithItems = orders.map(o => ({
      ...o,
      items: itemsByOrder[o.id] || [],
    }))

    return res.status(200).json({ orders: ordersWithItems })
  } catch (err) {
    console.error('[orders/index error]', err)
    return res.status(500).json({ message: 'Failed to fetch orders.' })
  }
}