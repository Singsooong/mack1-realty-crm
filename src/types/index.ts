export type Page =
  | 'dashboard'
  | 'listings'
  | 'agents'
  | 'contacts'
  | 'leads'
  | 'tasks'
  | 'calendar'
  | 'esign'
  | 'settings'

export interface StatCard {
  id: string
  label: string
  value: string
  trend: number
  trendDirection: 'up' | 'down'
  sparklineData: number[]
  iconVariant: 'building' | 'dollar' | 'tag' | 'users'
  accentColor: string
  sparklineColor: string
  sparklineVariant: 'line' | 'bar'
}

export interface RevenueDataPoint {
  month: string
  deals: number
  dealValue: number
}

export interface StatusSlice {
  label: string
  value: number
  color: string
}

export interface Property {
  id: string
  name: string
  location: { city: string; state: string }
  price: number
  beds: number
  baths: number
  sqft: number
  imageUrl: string
  status: 'available' | 'sold' | 'pending'
}

export interface Agent {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string
  specialty: string
  listings: number
  sales: number
  revenue: string
  rating: number
  status: 'active' | 'inactive'
}

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string
  type: 'buyer' | 'seller' | 'investor'
  status: 'active' | 'inactive'
  lastContact: string
}

export interface Lead {
  id: string
  name: string
  email: string
  source: 'website' | 'referral' | 'social' | 'ads'
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed'
  value: number
  probability: number
  assignedTo: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  category: 'follow-up' | 'inspection' | 'paperwork' | 'showing' | 'other'
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  dueDate: string
  assignedTo: string
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: 'showing' | 'meeting' | 'inspection' | 'closing'
  location: string
  attendees: string[]
}

export interface Document {
  id: string
  title: string
  property: string
  parties: string[]
  status: 'draft' | 'sent' | 'signed' | 'expired'
  createdAt: string
  expiresAt: string
}

export interface AdminUser {
  id: string
  name: string
  role: string
  avatarUrl: string
  email: string
}
