import { supabase } from '../lib/supabase'
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

export function transformNotification(row: RawNotification): AppNotification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    type: row.type as AppNotification['type'],
    documentId: row.document_id,
    status: row.status,
    documentTitle: row.document_title,
    clientName: row.client_name,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

/** How many notifications we pull per page — initial load and each "Load more". */
export const NOTIFICATIONS_PAGE_SIZE = 6

export interface NotificationPage {
  items: AppNotification[]
  /** True when older rows exist beyond this page; drives the "Load more" button. */
  hasMore: boolean
}

/**
 * Fetch one page of notifications, newest first.
 *
 * Cursor-based: pass the `created_at` of the oldest row you already hold as
 * `before` to get the next (older) page. We page downward while Realtime
 * prepends new rows upward, so the cursor is never disturbed by live inserts.
 */
export async function fetchNotifications(before?: string): Promise<NotificationPage> {
  // RLS scopes this to the current agent's own rows (admins see all).
  // Fetch one extra row: if it comes back, we know there's another page —
  // then drop it so the caller only ever sees PAGE_SIZE rows.
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(NOTIFICATIONS_PAGE_SIZE + 1)

  if (before) query = query.lt('created_at', before)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data as RawNotification[]).map(transformNotification)
  return {
    items: rows.slice(0, NOTIFICATIONS_PAGE_SIZE),
    hasMore: rows.length > NOTIFICATIONS_PAGE_SIZE,
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null) // no-op if already read
  if (error) throw new Error(error.message)
}

export async function markAllNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
    .is('read_at', null)
  if (error) throw new Error(error.message)
}

/** What renders in the dropdown row. */
export interface NotificationCopy {
  /** Bold first line, e.g. "Document signed". */
  title: string
  /** Muted supporting line, e.g. "Buyer Agreement — signed by Jane Doe". */
  description: string
}

export function buildEsignNotificationCopy(n: AppNotification): NotificationCopy {
  const doc = n.documentTitle ?? 'A document'
  const who = n.clientName ?? 'the client'
  // Lead the title with the document state (scannable), put the who/what detail
  // on the muted second line. Switch is exhaustive-friendly for future statuses.
  switch (n.status) {
    case 'signed':
      return { title: 'Document signed', description: `${who} signed ${doc}` }
    case 'sent':
      return { title: 'Document sent', description: `${doc} sent to ${who}` }
    case 'viewed':
      return { title: 'Document viewed', description: `${who} opened ${doc}` }
    case 'expired':
      return { title: 'Document expired', description: `${doc} expired before ${who} signed` }
    default:
      return { title: 'Document update', description: `${doc} changed status` }
  }
}
