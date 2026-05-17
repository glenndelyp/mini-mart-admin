// src/pages/api/notifications.js
import { sql } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  try {
    // ── 1. Low stock & out-of-stock items ────────────────────────────────
    const inventoryItems = await sql`
      SELECT id, name, stock, threshold, unit
      FROM products
      WHERE stock <= threshold
      ORDER BY stock ASC
      LIMIT 10
    `

    // ── 2. Pending orders ────────────────────────────────────────────────
    const pendingOrders = await sql`
      SELECT id, created_at
      FROM orders
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 10
    `

    // ── 3. Overdue orders (pending > 24 hours) ───────────────────────────
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const overdueOrders = pendingOrders.filter(o => o.created_at < cutoff)

    // ── Build unified notification list ──────────────────────────────────
    const notifications = []

    overdueOrders.forEach(o => {
      notifications.push({
        id:      `overdue-${o.id}`,
        type:    'overdue',
        title:   'Overdue Order',
        message: `Order #${o.id} has been pending for over 24 hours.`,
        href:    '/orders',
        time:    o.created_at,
      })
    })

    inventoryItems.forEach(item => {
      const isOut = item.stock === 0
      notifications.push({
        id:      `stock-${item.id}`,
        type:    isOut ? 'out_of_stock' : 'low_stock',
        title:   isOut ? 'Out of Stock' : 'Low Stock',
        message: isOut
          ? `${item.name} is out of stock.`
          : `${item.name} has only ${item.stock} ${item.unit ?? 'units'} left.`,
        href:    '/inventory',
        time:    new Date().toISOString(),
      })
    })

    pendingOrders.forEach(o => {
      if (notifications.find(n => n.id === `overdue-${o.id}`)) return
      notifications.push({
        id:      `order-${o.id}`,
        type:    'pending_order',
        title:   'New Pending Order',
        message: `Order #${o.id} is waiting to be processed.`,
        href:    '/orders',
        time:    o.created_at,
      })
    })

    // Sort: overdue → out_of_stock → low_stock → pending_order, then newest first
    const priority = { overdue: 0, out_of_stock: 1, low_stock: 2, pending_order: 3 }
    notifications.sort(
      (a, b) =>
        (priority[a.type] - priority[b.type]) ||
        new Date(b.time) - new Date(a.time)
    )

    return res.status(200).json({ notifications: notifications.slice(0, 20) })
  } catch (err) {
    console.error('[notifications] error:', err.message)
    return res.status(500).json({ message: 'Failed to fetch notifications.' })
  }
}