// src/pages/api/notifications.js
import { createClient } from '@supabase/supabase-js'

// Use service role key here (server-side only) so RLS doesn't block admin reads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  try {
    // ── 1. Low stock & out-of-stock items ────────────────────────────────
    const { data: inventoryItems, error: invErr } = await supabase
      .from('inventory')
      .select('id, name, quantity, low_stock_threshold, unit')
      .eq('status', 'active')
      .order('quantity', { ascending: true })
      .limit(10)

    if (invErr) throw invErr

    // Filter client-side: quantity <= low_stock_threshold
    const lowStockItems = (inventoryItems ?? []).filter(
      item => item.quantity <= (item.low_stock_threshold ?? 10)
    )

    // ── 2. Pending orders ────────────────────────────────────────────────
    const { data: pendingOrders, error: ordErr } = await supabase
      .from('orders')
      .select('id, order_number, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)

    if (ordErr) throw ordErr

    // ── 3. Overdue orders (pending > 24 hours) ───────────────────────────
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const overdueOrders = (pendingOrders ?? []).filter(o => o.created_at < cutoff)

    // ── Build unified notification list ──────────────────────────────────
    const notifications = []

    overdueOrders.forEach(o => {
      notifications.push({
        id:      `overdue-${o.id}`,
        type:    'overdue',
        title:   'Overdue Order',
        message: `Order #${o.order_number} has been pending for over 24 hours.`,
        href:    '/orders',
        time:    o.created_at,
      })
    })

    lowStockItems.forEach(item => {
      const isOut = item.quantity === 0
      notifications.push({
        id:      `stock-${item.id}`,
        type:    isOut ? 'out_of_stock' : 'low_stock',
        title:   isOut ? 'Out of Stock' : 'Low Stock',
        message: isOut
          ? `${item.name} is out of stock.`
          : `${item.name} has only ${item.quantity} ${item.unit ?? 'units'} left.`,
        href:    '/inventory',
        time:    new Date().toISOString(),
      })
    })

    ;(pendingOrders ?? []).forEach(o => {
      if (notifications.find(n => n.id === `overdue-${o.id}`)) return // skip if already overdue
      notifications.push({
        id:      `order-${o.id}`,
        type:    'pending_order',
        title:   'New Pending Order',
        message: `Order #${o.order_number} is waiting to be processed.`,
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