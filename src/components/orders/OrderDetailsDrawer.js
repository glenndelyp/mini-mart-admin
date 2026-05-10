// src/components/orders/OrderDetailsDrawer.js
import { X, MapPin, User, Mail, Phone, ShoppingBag, Clock, CheckCircle, Truck, XCircle, Package } from 'lucide-react'

const STATUS_META = {
  pending:    { label: 'Pending',          color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400',   icon: Clock        },
  confirmed:  { label: 'Confirmed',        color: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200',     dot: 'bg-sky-500',     icon: CheckCircle  },
  in_transit: { label: 'Out for Delivery', color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  dot: 'bg-violet-500',  icon: Truck        },
  delivered:  { label: 'Delivered',        color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle  },
  cancelled:  { label: 'Cancelled',        color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-400',     icon: XCircle      },
}

const STATUS_TIMELINE = ['pending', 'confirmed', 'in_transit', 'delivered']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function OrderDetailsDrawer({ order, onClose, onAction }) {
  if (!order) return null

  const meta       = STATUS_META[order.status] ?? STATUS_META.pending
  const StatusIcon = meta.icon
  const subtotal   = order.items?.reduce((sum, item) => sum + parseFloat(item.subtotal ?? item.price ?? 0), 0) ?? 0

  const canConfirm = order.status === 'pending'
  const canTransit = order.status === 'confirmed'
  const canDeliver = order.status === 'in_transit'
  const canCancel  = !['delivered', 'cancelled'].includes(order.status)

  // Build timeline steps
  const timelineSteps = [
    { key: 'pending',    label: 'Order Placed',       time: order.created_at },
    { key: 'confirmed',  label: 'Order Confirmed',    time: order.confirmed_at },
    { key: 'in_transit', label: 'Out for Delivery',   time: order.dispatched_at },
    { key: 'delivered',  label: 'Delivered',          time: order.delivered_at },
  ]

  const currentIndex = STATUS_TIMELINE.indexOf(order.status)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-screen w-[480px] bg-white shadow-2xl z-50 flex flex-col"
        style={{ animation: 'slideIn .25s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-medium">Order Details</p>
            <h2 className="text-lg font-bold text-slate-800">
              #ORD-{String(order.id).padStart(4, '0')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
              <StatusIcon size={11} />
              {meta.label}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">

          {/* Customer info */}
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Customer</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: '#14532d' }}>
                  {order.customer_name?.[0]?.toUpperCase() ?? 'C'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{order.customer_name || '—'}</p>
                  {order.customer_email && (
                    <p className="text-xs text-slate-400">{order.customer_email}</p>
                  )}
                </div>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone size={12} className="text-slate-400 flex-shrink-0" />
                  {order.customer_phone}
                </div>
              )}
              {order.delivery_address && (
                <div className="flex items-start gap-2 text-xs text-slate-500">
                  <MapPin size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  {order.delivery_address}
                </div>
              )}
            </div>
          </div>

          {/* Order items */}
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Items ({order.items?.length ?? 0})
            </p>
            <div className="space-y-2">
              {order.items?.length > 0 ? order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f0fdf4' }}>
                    <Package size={14} style={{ color: '#14532d' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{item.product_name}</p>
                    <p className="text-xs text-slate-400">
                      {item.quantity} × ₱{parseFloat(item.price ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-800 flex-shrink-0">
                    ₱{parseFloat(item.subtotal ?? (item.price * item.quantity) ?? 0).toFixed(2)}
                  </p>
                </div>
              )) : (
                <p className="text-xs text-slate-300 italic">No items found</p>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Delivery Fee</span>
                  <span>₱{parseFloat(order.delivery_fee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-800 pt-1 border-t border-slate-100">
                <span>Total</span>
                <span>₱{parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Status Timeline</p>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[13px] top-2 bottom-2 w-px bg-slate-200" />

              <div className="space-y-4">
                {timelineSteps.map((step, i) => {
                  const stepMeta  = STATUS_META[step.key]
                  const isPast    = order.status === 'cancelled'
                    ? false
                    : STATUS_TIMELINE.indexOf(step.key) <= currentIndex
                  const isCurrent = step.key === order.status
                  const isCancelled = order.status === 'cancelled' && step.key === 'cancelled'

                  return (
                    <div key={step.key} className="flex items-start gap-3 relative">
                      {/* Dot */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all
                        ${isPast || isCurrent
                          ? `${stepMeta.bg} ${stepMeta.border}`
                          : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${isPast || isCurrent ? stepMeta.dot : 'bg-slate-200'}`} />
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-xs font-semibold ${isPast || isCurrent ? 'text-slate-800' : 'text-slate-300'}`}>
                          {step.label}
                        </p>
                        {step.time && (isPast || isCurrent) ? (
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(step.time)}</p>
                        ) : (
                          <p className="text-[10px] text-slate-300 mt-0.5">Not yet</p>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Cancelled step */}
                {order.status === 'cancelled' && (
                  <div className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 bg-red-50 border-red-200">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-xs font-semibold text-red-600">Cancelled</p>
                      {order.cancelled_at && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(order.cancelled_at)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="px-6 py-5 border-b border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-xs text-slate-600 leading-relaxed">{order.notes}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="px-6 py-5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Order Info</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Order Date</span>
                <span className="text-slate-600 font-medium">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Payment</span>
                <span className="text-slate-600 font-medium capitalize">{order.payment_method ?? '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Payment Status</span>
                <span className={`font-semibold capitalize ${order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {order.payment_status ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {canCancel || canConfirm || canTransit || canDeliver ? (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2">
            {canConfirm && (
              <button
                onClick={() => { onClose(); onAction({ type: 'confirm', order }) }}
                className="flex-1 text-sm font-semibold py-2.5 rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 transition"
              >
                Confirm Order
              </button>
            )}
            {canTransit && (
              <button
                onClick={() => { onClose(); onAction({ type: 'transit', order }) }}
                className="flex-1 text-sm font-semibold py-2.5 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 transition"
              >
                Out for Delivery
              </button>
            )}
            {canDeliver && (
              <button
                onClick={() => { onClose(); onAction({ type: 'deliver', order }) }}
                className="flex-1 text-sm font-semibold py-2.5 rounded-lg text-white transition"
                style={{ backgroundColor: '#14532d' }}
              >
                Mark Delivered
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => { onClose(); onAction({ type: 'cancel', order }) }}
                className="text-sm font-semibold px-4 py-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="w-full text-sm font-semibold py-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}