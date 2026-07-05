import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  transformNotification,
} from '../services/notifications'
import type { AppNotification } from '../types'

interface RawNotification {
  id: string
  recipient_id: string | null
  type: string
  document_id: string | null
  status: string | null
  document_title: string | null
  client_name: string | null
  read_at: string | null
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
      .then(page => {
        setNotifications(page.items)
        setHasMore(page.hasMore)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

    // Realtime: new notifications (INSERT) and read-state changes (UPDATE).
    // We don't filter by recipient here — RLS already gates which rows this
    // user can see, mirroring the documents-changes channel in useDocuments.
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const created = transformNotification(payload.new as RawNotification)
          setNotifications(prev =>
            prev.some(n => n.id === created.id) ? prev : [created, ...prev],
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          const updated = transformNotification(payload.new as RawNotification)
          setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n))
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.readAt).length,
    [notifications],
  )

  // Cursor-based "load older" paging. We page by "created_at < oldest held"
  // rather than by offset, because Realtime *prepends* new rows — an offset
  // (.range(6, 11)) would shift on every insert and skip/duplicate rows.
  async function loadMore() {
    if (loadingMore || !hasMore || notifications.length === 0) return
    setLoadingMore(true)
    try {
      // Oldest row we hold = cursor. List is newest-first, so it's the last item.
      const cursor = notifications[notifications.length - 1].createdAt
      const page = await fetchNotifications(cursor)
      // Append, de-duping by id (a Realtime insert could overlap a page edge,
      // and React keys must stay unique).
      setNotifications(prev => {
        const seen = new Set(prev.map(n => n.id))
        return [...prev, ...page.items.filter(n => !seen.has(n.id))]
      })
      setHasMore(page.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more notifications')
    } finally {
      setLoadingMore(false)
    }
  }

  async function markRead(id: string) {
    // Optimistic: flip locally first so the UI feels instant; the Realtime
    // UPDATE will reconcile (and the .is('read_at', null) guard makes it idempotent).
    setNotifications(prev =>
      prev.map(n => n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n),
    )
    try {
      await markNotificationRead(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark notification read')
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.readAt).map(n => n.id)
    if (unreadIds.length === 0) return
    const now = new Date().toISOString()
    setNotifications(prev => prev.map(n => n.readAt ? n : { ...n, readAt: now }))
    try {
      await markAllNotificationsRead(unreadIds)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark notifications read')
    }
  }

  return { notifications, unreadCount, loading, loadingMore, hasMore, error, loadMore, markRead, markAllRead }
}
