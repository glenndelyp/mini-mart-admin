// src/pages/api/orders/update.js
import { sql } from '../../lib/db'

const TRANSITIONS = {
  confirm: { next: 'confirmed',  allowed: ['pending']                        },
  transit: { next: 'in_transit', allowed: ['confirmed']                      },
  deliver: { next: 'delivered',  allowed: ['in_transit']                     },
  cancel:  { next: 'cancelled',  allowed: ['pending', 'confirmed', 'in_transit'] },
}

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Method not allowed.' })

  const { id, action, eta_minutes } = req.body

  if (!id)     return res.status(400).json({ message: 'Order ID is required.' })
  if (!action) return res.status(400).json({ message: 'Action is required.' })

  const transition = TRANSITIONS[action]
  if (!transition) return res.status(400).json({ message: `Unknown action: "${action}".` })

  // Validate eta_minutes for confirm
  if (action === 'confirm') {
    const m = parseInt(eta_minutes, 10)
    if (!eta_minutes || isNaN(m) || m < 1) {
      return res.status(400).json({ message: 'A valid delivery time (in minutes) is required.' })
    }
    if (m > 480) {
      return res.status(400).json({ message: 'Estimated delivery cannot exceed 8 hours.' })
    }
  }

  try {
    // Fetch current order + customer
    const existing = await sql`
      SELECT
        o.id, o.status,
        u.first_name || ' ' || u.last_name AS customer_name,
        u.email AS customer_email,
        o.user_id, o.total_amount, o.delivery_address,
        o.notes, o.estimated_delivery, o.delivery_deadline,
        o.created_at, o.confirmed_at, o.delivered_at
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.id = ${id}
    `

    if (existing.length === 0) return res.status(404).json({ message: 'Order not found.' })

    const order = existing[0]

    if (!transition.allowed.includes(order.status)) {
      return res.status(409).json({
        message: `Cannot ${action} an order that is currently "${order.status}".`,
      })
    }

    // ── Run the correct UPDATE ────────────────────────────────────────────
    let updated

    if (action === 'confirm') {
      const minutes = parseInt(eta_minutes, 10)
      // Build human-readable label for display
      const label = minutes < 60
        ? `${minutes} minute${minutes !== 1 ? 's' : ''}`
        : (() => {
            const h = Math.floor(minutes / 60)
            const m = minutes % 60
            return m === 0 ? `${h} hour${h !== 1 ? 's' : ''}` : `${h} hr ${m} min`
          })()

      updated = await sql`
        UPDATE orders
        SET
          status             = 'confirmed',
          confirmed_at       = NOW(),
          estimated_delivery = ${label},
          delivery_deadline  = NOW() + (${minutes} * INTERVAL '1 minute')
        WHERE id = ${id}
        RETURNING
          id, user_id, status, total_amount, delivery_address, notes,
          estimated_delivery, delivery_deadline,
          created_at, confirmed_at, delivered_at
      `
    } else if (action === 'transit') {
      updated = await sql`
        UPDATE orders
        SET status = 'in_transit'
        WHERE id = ${id}
        RETURNING
          id, user_id, status, total_amount, delivery_address, notes,
          estimated_delivery, delivery_deadline,
          created_at, confirmed_at, delivered_at
      `
    } else if (action === 'deliver') {
      updated = await sql`
        UPDATE orders
        SET status = 'delivered', delivered_at = NOW()
        WHERE id = ${id}
        RETURNING
          id, user_id, status, total_amount, delivery_address, notes,
          estimated_delivery, delivery_deadline,
          created_at, confirmed_at, delivered_at
      `
    } else if (action === 'cancel') {
      updated = await sql`
        UPDATE orders
        SET status = 'cancelled'
        WHERE id = ${id}
        RETURNING
          id, user_id, status, total_amount, delivery_address, notes,
          estimated_delivery, delivery_deadline,
          created_at, confirmed_at, delivered_at
      `
    }

    if (!updated || updated.length === 0) {
      return res.status(500).json({ message: 'Update failed.' })
    }

    // Fetch items for response
    const items = await sql`
      SELECT id, order_id, product_id, product_name, unit_price, quantity, subtotal
      FROM order_items
      WHERE order_id = ${id}
      ORDER BY id ASC
    `

    return res.status(200).json({
      order: {
        ...updated[0],
        customer_name:  order.customer_name,
        customer_email: order.customer_email,
        items,
      },
    })
  } catch (err) {
    console.error('[orders/update error]', err)
    return res.status(500).json({ message: 'Failed to update order.' })
  }
}