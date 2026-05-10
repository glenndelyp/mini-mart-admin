// src/hooks/useNotifications.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [unreadCount,   setUnreadCount]   = useState(0)

  // Track seen IDs in localStorage so badge clears across refreshes
  const seenIdsRef = useRef(new Set())

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = JSON.parse(localStorage.getItem('mart_seen_notifs') || '[]')
      seenIdsRef.current = new Set(stored)
    } catch {}
  }, [])

  // ── Fetch from our API route (which uses service role key safely) ────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res  = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      const list = data.notifications ?? []

      setNotifications(list)

      // Count notifications the user hasn't seen yet
      const unseen = list.filter(n => !seenIdsRef.current.has(n.id)).length
      setUnreadCount(unseen)
    } catch (err) {
      console.error('[useNotifications] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // ── Supabase Realtime subscriptions ─────────────────────────────────────
  useEffect(() => {
    // Listen for any UPDATE on inventory (e.g. quantity changes)
    const inventoryChannel = supabase
      .channel('notif-inventory-watch')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory' },
        () => fetchNotifications()
      )
      .subscribe()

    // Listen for INSERT or UPDATE on orders (new orders, status changes)
    const ordersChannel = supabase
      .channel('notif-orders-watch')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => fetchNotifications()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => fetchNotifications()
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(inventoryChannel)
      supabase.removeChannel(ordersChannel)
    }
  }, [fetchNotifications])

  // ── Mark all as read ─────────────────────────────────────────────────────
  const markAllRead = useCallback(() => {
    const allIds = notifications.map(n => n.id)
    const newSeen = new Set([...seenIdsRef.current, ...allIds])
    seenIdsRef.current = newSeen
    setUnreadCount(0)

    try {
      localStorage.setItem('mart_seen_notifs', JSON.stringify([...newSeen]))
    } catch {}
  }, [notifications])

  return {
    notifications,
    loading,
    unreadCount,
    markAllRead,
    refetch: fetchNotifications,
  }
}