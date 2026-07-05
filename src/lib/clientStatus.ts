import type { ClientStatus } from '@/types'

/**
 * Canonical pipeline ordering (first touch → closed). Used for the status
 * dropdown order and any progress visualisation. This is the one place that
 * defines the sequence — everything else derives from it.
 */
export const CLIENT_STATUS_ORDER: ClientStatus[] = [
  'new-inquiry',
  'pre-qualified',
  'in-credit-repair',
  'pre-approved',
  'actively-searching',
  'offer-submitted',
  'in-contract',
  'pending',
  'clear-to-close',
  'closed',
]

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  'new-inquiry': 'New Inquiry',
  'pre-qualified': 'Pre-Qualified',
  'in-credit-repair': 'In Credit Repair',
  'pre-approved': 'Pre-Approved',
  'actively-searching': 'Actively Searching',
  'offer-submitted': 'Offer Submitted',
  'in-contract': 'In Contract',
  'pending': 'Pending',
  'clear-to-close': 'Clear to Close',
  'closed': 'Closed',
}

/**
 * Tailwind badge classes per stage, following the existing light/dark pattern
 * used elsewhere in the app (see the type badges on the clients table). The
 * hue progresses cool → warm → green as a client advances toward closing.
 */
export const CLIENT_STATUS_BADGE: Record<ClientStatus, string> = {
  'new-inquiry': 'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800',
  'pre-qualified': 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-950',
  'in-credit-repair': 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-950',
  'pre-approved': 'bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-950',
  'actively-searching': 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-950',
  'offer-submitted': 'bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-400 dark:hover:bg-violet-950',
  'in-contract': 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-950 dark:text-fuchsia-400 dark:hover:bg-fuchsia-950',
  'pending': 'bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-400 dark:hover:bg-orange-950',
  'clear-to-close': 'bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-400 dark:hover:bg-teal-950',
  'closed': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-950',
}
