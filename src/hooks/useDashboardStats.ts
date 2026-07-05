import { useMemo } from 'react'
import { useProperties } from './useProperties'
import { useLeads } from './useLeads'
import { useTasks } from './useTasks'
import type { StatCard, StatusSlice, LeadsByMonthPoint, Lead, Property } from '../types'

/**
 * A lead is "active" while it's still being worked — i.e. it has neither been
 * won (`converted`) nor dropped (`lost`). This is the one genuinely subjective
 * rule on the dashboard; change the predicate here and every "Active Leads"
 * figure follows.
 */
function isActiveLead(lead: Lead): boolean {
  return lead.status !== 'converted' && lead.status !== 'lost'
}

/** Compact money formatting: 2_000_000 -> "$2.0M", 450_000 -> "$450K". */
function formatCompactMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value.toLocaleString()}`
}

// Pipeline order + colors. Mirrors Lead['status'] so an unhandled status would
// surface as a TS error rather than silently vanishing from the chart.
const LEAD_STATUS_META: Record<Lead['status'], { label: string; color: string }> = {
  new: { label: 'New', color: '#34d399' },
  contacted: { label: 'Contacted', color: '#818cf8' },
  qualified: { label: 'Qualified', color: '#60a5fa' },
  converted: { label: 'Converted', color: '#a78bfa' },
  lost: { label: 'Lost', color: '#fb923c' },
}

function buildLeadPipeline(leads: Lead[]): StatusSlice[] {
  return (Object.keys(LEAD_STATUS_META) as Lead['status'][])
    .map((status) => ({
      label: LEAD_STATUS_META[status].label,
      color: LEAD_STATUS_META[status].color,
      value: leads.filter((l) => l.status === status).length,
    }))
    .filter((slice) => slice.value > 0)
}

/** Counts leads into the last `months` calendar buckets ending this month. */
function buildLeadsByMonth(leads: Lead[], months = 6): LeadsByMonthPoint[] {
  const now = new Date()
  const buckets: LeadsByMonthPoint[] = []
  const keyFor = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`
  const counts = new Map<string, number>()

  for (const lead of leads) {
    const d = new Date(lead.date)
    if (!Number.isNaN(d.getTime())) {
      counts.set(keyFor(d), (counts.get(keyFor(d)) ?? 0) + 1)
    }
  }

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      leads: counts.get(keyFor(d)) ?? 0,
    })
  }
  return buckets
}

function buildStatCards(properties: Property[], leads: Lead[]): StatCard[] {
  const available = properties.filter((p) => p.status === 'available').length
  const portfolioValue = properties.reduce((sum, p) => sum + (p.listPrice ?? p.price ?? 0), 0)
  const activeLeads = leads.filter(isActiveLead).length

  return [
    {
      id: 'total-listings',
      label: 'Total Listings',
      value: properties.length.toLocaleString(),
      iconVariant: 'building',
    },
    {
      id: 'available-listings',
      label: 'Available',
      value: available.toLocaleString(),
      iconVariant: 'tag',
      hint: properties.length ? `of ${properties.length} listings` : undefined,
    },
    {
      id: 'portfolio-value',
      label: 'Portfolio Value',
      value: formatCompactMoney(portfolioValue),
      iconVariant: 'dollar',
      hint: 'sum of list prices',
    },
    {
      id: 'active-leads',
      label: 'Active Leads',
      value: activeLeads.toLocaleString(),
      iconVariant: 'users',
      hint: leads.length ? `of ${leads.length} total` : undefined,
    },
  ]
}

export function useDashboardStats() {
  const { properties, loading: propsLoading, error: propsError } = useProperties()
  const { leads, loading: leadsLoading, error: leadsError } = useLeads()
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks()

  const statCards = useMemo(() => buildStatCards(properties, leads), [properties, leads])
  const leadPipeline = useMemo(() => buildLeadPipeline(leads), [leads])
  const leadsByMonth = useMemo(() => buildLeadsByMonth(leads), [leads])
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'completed').length, [tasks])
  const recentProperties = useMemo(() => properties.slice(0, 4), [properties])

  return {
    statCards,
    leadPipeline,
    leadsByMonth,
    openTasks,
    recentProperties,
    loading: propsLoading || leadsLoading || tasksLoading,
    error: propsError ?? leadsError ?? tasksError,
  }
}
