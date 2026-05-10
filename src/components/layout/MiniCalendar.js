// src/components/layout/MiniCalendar.jsx
import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// ─── Date helpers (exported so callers can use them too) ───────────────────
export function startOfDay(d)  { const x = new Date(d); x.setHours(0,0,0,0); return x }
export function endOfDay(d)    { const x = new Date(d); x.setHours(23,59,59,999); return x }
export function startOfWeek(d) { const x = new Date(d); x.setDate(x.getDate()-x.getDay()); x.setHours(0,0,0,0); return x }
export function endOfWeek(d)   { const x = startOfWeek(d); x.setDate(x.getDate()+6); x.setHours(23,59,59,999); return x }
export function addDays(d,n)   { const x = new Date(d); x.setDate(x.getDate()+n); return x }
export function addWeeks(d,n)  { return addDays(d,n*7) }
export function sameDay(a,b)   {
  if (!a || !b) return false
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}
export function inRange(dateStr, start, end) {
  const d = new Date(dateStr)
  return d >= start && d <= end
}

export function formatRangeLabel(mode, date) {
  if (mode === 'day') return date.toLocaleDateString('en-PH', { month:'long', day:'numeric', year:'numeric' })
  const s = startOfWeek(date), e = endOfWeek(date)
  if (s.getMonth() === e.getMonth())
    return `${s.toLocaleDateString('en-PH',{month:'long'})} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
  return `${s.toLocaleDateString('en-PH',{month:'short',day:'numeric'})} – ${e.toLocaleDateString('en-PH',{month:'short',day:'numeric'})}, ${s.getFullYear()}`
}

export function formatDateLabel(date) {
  if (!date) return ''
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ─── Props ─────────────────────────────────────────────────────────────────
// mode        : 'day' | 'week' | 'range'
// selectedDate: Date             — used for 'day' and 'week' modes
// rangeStart  : Date | null      — used for 'range' mode
// rangeEnd    : Date | null      — used for 'range' mode
// onSelect    : (date: Date) => void
// onClose     : () => void

export default function MiniCalendar({
  mode         = 'day',
  selectedDate,
  rangeStart   = null,
  rangeEnd     = null,
  onSelect,
  onClose,
  align        = 'right',   // 'right' | 'left' — which edge to anchor the dropdown to
}) {
  // Use a stable anchor for initial view — never re-derive during interaction
  const anchor = selectedDate ?? rangeStart ?? new Date()
  const [viewYear,  setViewYear]  = useState(anchor.getFullYear())
  const [viewMonth, setViewMonth] = useState(anchor.getMonth())

  // Hover state for live range preview while picking end date
  const [hoverDate, setHoverDate] = useState(null)

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Build cell array: nulls for leading empty slots, then Date objects
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d))

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // ── Derived range for preview (rangeStart picked, rangeEnd not yet) ────────
  // When user has picked start but not end yet, use hoverDate to preview
  const previewEnd = !rangeEnd && rangeStart && hoverDate ? hoverDate : null
  const effectiveEnd = rangeEnd ?? previewEnd

  // Normalize so start is always <= end for comparison
  const rangeA = rangeStart && effectiveEnd
    ? (rangeStart <= effectiveEnd ? startOfDay(rangeStart) : startOfDay(effectiveEnd))
    : null
  const rangeB = rangeStart && effectiveEnd
    ? (rangeStart <= effectiveEnd ? startOfDay(effectiveEnd) : startOfDay(rangeStart))
    : null

  // ── Cell state helpers ────────────────────────────────────────────────────
  function isRangeStart(d) {
    if (!d || mode !== 'range') return false
    return !!(rangeA && sameDay(d, rangeA))
  }

  function isRangeEnd(d) {
    if (!d || mode !== 'range') return false
    return !!(rangeB && sameDay(d, rangeB))
  }

  function isInRange(d) {
    if (!d || mode !== 'range' || !rangeA || !rangeB) return false
    const ds = startOfDay(d)
    return ds > rangeA && ds < rangeB
  }

  function isSelected(d) {
    if (!d) return false
    if (mode === 'day')   return selectedDate && sameDay(d, selectedDate)
    if (mode === 'week')  return selectedDate && d >= startOfWeek(selectedDate) && d <= endOfWeek(selectedDate)
    if (mode === 'range') return isRangeStart(d) || isRangeEnd(d)
    return false
  }

  function isToday(d) { return d && sameDay(d, new Date()) }

  function handleClick(d) {
    onSelect(d)
    // Only close on non-range modes — range mode stays open for second click
    if (mode !== 'range') onClose()
  }

  // ── Cell style logic ──────────────────────────────────────────────────────
  function getCellStyle(d) {
    if (!d) return ''

    const start   = isRangeStart(d)
    const end     = isRangeEnd(d)
    const inRng   = isInRange(d)
    const sel     = isSelected(d)
    const today   = isToday(d)
    const isPreview = previewEnd && (isInRange(d) || isRangeStart(d) || sameDay(d, previewEnd))

    if (start || end) {
      return 'bg-slate-800 text-white font-bold rounded-lg'
    }
    if (inRng) {
      // Use rounded edges only on the first and last of the row — simple approach: always bg, no radius
      return 'bg-slate-100 text-slate-700 rounded-none'
    }
    if (sel) {
      return 'bg-slate-800 text-white font-bold rounded-lg'
    }
    if (today) {
      return 'bg-emerald-50 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100'
    }
    return 'text-slate-600 hover:bg-slate-100 rounded-lg'
  }

  // Round the edges of the in-range strip at week boundaries
  function getRangeEdgeStyle(d, i) {
    if (!d || mode !== 'range' || !isInRange(d)) return ''
    const col = i % 7 // 0 = Sunday col
    const leftEdge  = col === 0 || isRangeStart(cells[i - 1] ?? null)
    const rightEdge = col === 6 || isRangeEnd(cells[i + 1] ?? null)
    if (leftEdge && rightEdge) return 'rounded-lg'
    if (leftEdge)  return 'rounded-l-lg'
    if (rightEdge) return 'rounded-r-lg'
    return ''
  }

  const posClass = align === 'left' ? 'left-0' : 'right-0'

  return (
    <div
      className={`absolute top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-72 ${posClass}`}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={16} className="text-slate-500" />
        </button>
        <span className="text-sm font-bold text-slate-800">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight size={16} className="text-slate-500" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors ml-1"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Range pick hint */}
      {mode === 'range' && (
        <div className="mb-2 text-center text-[11px] font-medium text-slate-400">
          {!rangeStart
            ? 'Pick a start date'
            : !rangeEnd
              ? <span className="text-emerald-600">Start: {formatDateLabel(rangeStart)} — now pick end</span>
              : <span>{formatDateLabel(rangeStart)} – {formatDateLabel(rangeEnd)}</span>
          }
        </div>
      )}

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="h-8" />

          const baseStyle  = getCellStyle(d)
          const edgeStyle  = getRangeEdgeStyle(d, i)
          const finalStyle = baseStyle.includes('rounded-none')
            ? `${baseStyle} ${edgeStyle}`
            : baseStyle

          return (
            <button
              key={i}
              onClick={() => handleClick(d)}
              onMouseEnter={() => mode === 'range' && setHoverDate(d)}
              onMouseLeave={() => mode === 'range' && setHoverDate(null)}
              className={`h-8 text-xs font-medium transition-all ${finalStyle}`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => { onSelect(new Date()); if (mode !== 'range') onClose() }}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 py-1 px-2 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          Today
        </button>
        {mode === 'range' && (rangeStart || rangeEnd) && (
          <button
            onClick={() => { onSelect(null); }}
            className="text-xs font-medium text-slate-400 hover:text-red-500 py-1 px-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}