import type {
  StatCard, RevenueDataPoint, StatusSlice, Property,
  Agent, Contact, Lead, Task, CalendarEvent, Document, AdminUser
} from '../types'

export const statCardsData: StatCard[] = [
  {
    id: 'properties-managed',
    label: 'Properties Managed',
    value: '4,860',
    trend: 98,
    trendDirection: 'up',
    sparklineData: [30, 42, 35, 50, 45, 60, 55, 72],
    iconVariant: 'building',
    accentColor: 'oklch(0.269 0 0)',
    sparklineColor: 'oklch(0.696 0.17 162.48)',
    sparklineVariant: 'line',
  },
  {
    id: 'asset-value',
    label: 'Asset Value',
    value: '$2B',
    trend: 72,
    trendDirection: 'up',
    sparklineData: [20, 35, 25, 45, 30, 55, 40, 65],
    iconVariant: 'dollar',
    accentColor: 'oklch(0.269 0 0)',
    sparklineColor: 'oklch(0.488 0.243 264.376)',
    sparklineVariant: 'bar',
  },
  {
    id: 'properties-sold',
    label: 'Properties Sold',
    value: '1,037',
    trend: 44.2,
    trendDirection: 'up',
    sparklineData: [15, 28, 22, 38, 30, 45, 35, 52],
    iconVariant: 'tag',
    accentColor: 'oklch(0.269 0 0)',
    sparklineColor: 'oklch(0.769 0.188 70.08)',
    sparklineVariant: 'bar',
  },
  {
    id: 'new-clients',
    label: 'New Clients',
    value: '895',
    trend: 70,
    trendDirection: 'up',
    sparklineData: [10, 18, 14, 24, 18, 32, 22, 38],
    iconVariant: 'users',
    accentColor: 'oklch(0.269 0 0)',
    sparklineColor: 'oklch(0.627 0.265 303.9)',
    sparklineVariant: 'bar',
  },
]

export const revenueData: RevenueDataPoint[] = [
  { month: 'Jan', deals: 200000, dealValue: 120000 },
  { month: 'Feb', deals: 500000, dealValue: 300000 },
  { month: 'Mar', deals: 300000, dealValue: 180000 },
  { month: 'Apr', deals: 350000, dealValue: 220000 },
  { month: 'May', deals: 280000, dealValue: 160000 },
  { month: 'Jun', deals: 400000, dealValue: 250000 },
  { month: 'Jul', deals: 450000, dealValue: 280000 },
  { month: 'Aug', deals: 600000, dealValue: 380000 },
  { month: 'Sep', deals: 700000, dealValue: 430000 },
  { month: 'Oct', deals: 550000, dealValue: 340000 },
  { month: 'Nov', deals: 480000, dealValue: 290000 },
  { month: 'Dec', deals: 200000, dealValue: 110000 },
]

export const statusData: StatusSlice[] = [
  { label: 'Accepted', value: 1037, color: '#818cf8' },
  { label: 'Rejected', value: 486, color: '#fb923c' },
  { label: 'Countered', value: 165, color: '#e2e8f0' },
  { label: 'Pending', value: 166, color: '#34d399' },
]

export const propertiesData: Property[] = [
  {
    id: 'prop-1',
    name: 'Sunset Retreat Villa',
    location: { city: 'Austin', state: 'Texas' },
    price: 7548,
    beds: 3, baths: 2, sqft: 1400,
    imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=250&fit=crop',
    status: 'available',
  },
  {
    id: 'prop-2',
    name: 'Riverside Haven',
    location: { city: 'Portland', state: 'Oregon' },
    price: 1548,
    beds: 4, baths: 3, sqft: 2000,
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop',
    status: 'available',
  },
  {
    id: 'prop-3',
    name: 'Mountain View Villa',
    location: { city: 'Boulder', state: 'Colorado' },
    price: 2048,
    beds: 2, baths: 2, sqft: 1400,
    imageUrl: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&h=250&fit=crop',
    status: 'sold',
  },
  {
    id: 'prop-4',
    name: 'Ocean Breeze Cottage',
    location: { city: 'San Diego', state: 'California' },
    price: 6948,
    beds: 2, baths: 1, sqft: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&h=250&fit=crop',
    status: 'available',
  },
  {
    id: 'prop-5',
    name: 'Lakefront Manor',
    location: { city: 'Chicago', state: 'Illinois' },
    price: 12500,
    beds: 5, baths: 4, sqft: 3800,
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop',
    status: 'pending',
  },
  {
    id: 'prop-6',
    name: 'Desert Modern',
    location: { city: 'Scottsdale', state: 'Arizona' },
    price: 4200,
    beds: 3, baths: 2, sqft: 2100,
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=250&fit=crop',
    status: 'available',
  },
]

export const agentsData: Agent[] = [
  { id: 'ag-1', name: 'Sarah Chen', email: 'sarah.chen@mack1.io', phone: '+1 (512) 555-0101', avatarUrl: 'https://i.pravatar.cc/150?img=47', specialty: 'Luxury Residential', listings: 24, sales: 18, revenue: '$2.4M', rating: 4.9, status: 'active', role: 'agent' },
  { id: 'ag-2', name: 'Marcus Webb', email: 'marcus.webb@mack1.io', phone: '+1 (512) 555-0102', avatarUrl: 'https://i.pravatar.cc/150?img=12', specialty: 'Commercial', listings: 16, sales: 11, revenue: '$5.1M', rating: 4.7, status: 'active', role: 'agent' },
  { id: 'ag-3', name: 'Priya Nair', email: 'priya.nair@mack1.io', phone: '+1 (503) 555-0103', avatarUrl: 'https://i.pravatar.cc/150?img=23', specialty: 'Investment', listings: 31, sales: 22, revenue: '$3.8M', rating: 4.8, status: 'active', role: 'agent' },
  { id: 'ag-4', name: 'James Okafor', email: 'james.okafor@mack1.io', phone: '+1 (720) 555-0104', avatarUrl: 'https://i.pravatar.cc/150?img=33', specialty: 'First-Time Buyers', listings: 19, sales: 14, revenue: '$1.9M', rating: 4.6, status: 'active', role: 'agent' },
  { id: 'ag-5', name: 'Elena Vasquez', email: 'elena.vasquez@mack1.io', phone: '+1 (619) 555-0105', avatarUrl: 'https://i.pravatar.cc/150?img=56', specialty: 'Coastal Properties', listings: 28, sales: 20, revenue: '$6.2M', rating: 4.9, status: 'active', role: 'agent' },
  { id: 'ag-6', name: 'Tom Nakamura', email: 'tom.nakamura@mack1.io', phone: '+1 (312) 555-0106', avatarUrl: 'https://i.pravatar.cc/150?img=68', specialty: 'Urban Condos', listings: 12, sales: 8, revenue: '$1.2M', rating: 4.4, status: 'inactive', role: 'agent' },
]

export const contactsData: Contact[] = [
  { id: 'ct-1', name: 'Alice Thompson', email: 'alice@example.com', phone: '+1 (512) 555-2001', avatarUrl: 'https://i.pravatar.cc/150?img=1', type: 'buyer', status: 'active', lastContact: '2026-03-07' },
  { id: 'ct-2', name: 'Robert Kim', email: 'robert.kim@example.com', phone: '+1 (415) 555-2002', avatarUrl: 'https://i.pravatar.cc/150?img=3', type: 'investor', status: 'active', lastContact: '2026-03-05' },
  { id: 'ct-3', name: 'Diana Foster', email: 'diana.f@example.com', phone: '+1 (720) 555-2003', avatarUrl: 'https://i.pravatar.cc/150?img=5', type: 'seller', status: 'active', lastContact: '2026-03-01' },
  { id: 'ct-4', name: 'Michael Torres', email: 'm.torres@example.com', phone: '+1 (619) 555-2004', avatarUrl: 'https://i.pravatar.cc/150?img=7', type: 'buyer', status: 'inactive', lastContact: '2026-02-20' },
  { id: 'ct-5', name: 'Naomi Patel', email: 'naomi.p@example.com', phone: '+1 (312) 555-2005', avatarUrl: 'https://i.pravatar.cc/150?img=9', type: 'investor', status: 'active', lastContact: '2026-03-08' },
  { id: 'ct-6', name: 'Chris Andersen', email: 'c.andersen@example.com', phone: '+1 (503) 555-2006', avatarUrl: 'https://i.pravatar.cc/150?img=11', type: 'seller', status: 'active', lastContact: '2026-03-06' },
  { id: 'ct-7', name: 'Fatima Hassan', email: 'fatima.h@example.com', phone: '+1 (602) 555-2007', avatarUrl: 'https://i.pravatar.cc/150?img=20', type: 'buyer', status: 'active', lastContact: '2026-03-04' },
  { id: 'ct-8', name: 'Leo Marchetti', email: 'leo.m@example.com', phone: '+1 (213) 555-2008', avatarUrl: 'https://i.pravatar.cc/150?img=15', type: 'investor', status: 'inactive', lastContact: '2026-02-15' },
]

export const leadsData: Lead[] = [
  { id: 'ld-1', name: 'Ryan Thompson', email: 'ryan.t@email.com', phone: '+1 (555) 101-0101', propertyInterest: '3BR For Sale, Austin TX', message: 'Looking for a family home near good schools, budget around $600k', status: 'new', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Alex Morgan', date: '2026-03-05' },
  { id: 'ld-2', name: 'Chloe Adams', email: 'chloe.a@email.com', phone: '+1 (555) 202-0202', propertyInterest: 'For Rent, Downtown', message: 'Need a 1BR apartment within 6 blocks of the metro, max $2,200/mo', status: 'contacted', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Sarah Chen', date: '2026-03-04' },
  { id: 'ld-3', name: 'Derek Wu', email: 'derek.wu@email.com', phone: '+1 (555) 303-0303', propertyInterest: 'Commercial Lease, Chicago', message: 'Looking for office space 2,000 sq ft, ground floor preferred', status: 'qualified', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Marcus Webb', date: '2026-03-03' },
  { id: 'ld-4', name: 'Tiffany Brooks', email: 'tbrooks@email.com', phone: '+1 (555) 404-0404', propertyInterest: 'For Sale, Portland OR', message: 'Buying as investment, cash buyer, closing within 30 days', status: 'converted', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Priya Nair', date: '2026-03-02' },
  { id: 'ld-5', name: 'Nathan Rivera', email: 'n.rivera@email.com', phone: '+1 (555) 505-0505', propertyInterest: 'For Lease, Miami FL', message: 'Retail space inquiry for boutique clothing store, need foot traffic', status: 'lost', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Alex Morgan', date: '2026-03-01' },
  { id: 'ld-6', name: 'Hannah Scott', email: 'h.scott@email.com', phone: '+1 (555) 606-0606', propertyInterest: '4BR For Sale, Boulder CO', message: 'Relocating from East Coast, timeline is flexible, prefer mountain views', status: 'new', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Sarah Chen', date: '2026-02-28' },
  { id: 'ld-7', name: 'Kevin Park', email: 'k.park@email.com', phone: '+1 (555) 707-0707', propertyInterest: 'Condo For Sale, Seattle WA', message: 'First-time buyer, pre-qualified $450k, wants in-unit laundry', status: 'qualified', assignedAgentId: 'mock-agent-id', assignedAgentName: 'James Okafor', date: '2026-02-27' },
  { id: 'ld-8', name: 'Brianna Lee', email: 'blee@email.com', phone: '+1 (555) 808-0808', propertyInterest: 'For Rent, Nashville TN', message: 'Pet owner, needs yard space, two large dogs', status: 'contacted', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Elena Vasquez', date: '2026-02-26' },
]

export const tasksData: Task[] = [
  { id: 'tk-1', title: 'Follow up with Alice Thompson', description: 'Call regarding Sunset Retreat Villa offer', category: 'follow-up', priority: 'high', completed: false, dueDate: '2026-03-10', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Sarah Chen' },
  { id: 'tk-2', title: 'Schedule inspection — Lakefront Manor', description: 'Coordinate with inspector and buyer', category: 'inspection', priority: 'high', completed: false, dueDate: '2026-03-11', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Elena Vasquez' },
  { id: 'tk-3', title: 'Prepare purchase agreement', description: 'Ocean Breeze Cottage — Robert Kim', category: 'paperwork', priority: 'medium', completed: true, dueDate: '2026-03-07', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Priya Nair' },
  { id: 'tk-4', title: 'Showing — Desert Modern 2pm', description: 'Show property to Fontaine family', category: 'showing', priority: 'medium', completed: false, dueDate: '2026-03-12', assignedAgentId: 'mock-agent-id', assignedAgentName: 'James Okafor' },
  { id: 'tk-5', title: 'Submit closing docs — Mountain View', description: 'Final paperwork to escrow', category: 'paperwork', priority: 'high', completed: true, dueDate: '2026-03-06', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Marcus Webb' },
  { id: 'tk-6', title: 'Send market analysis to Ben Caldwell', description: 'Comparative market analysis for Boulder area', category: 'follow-up', priority: 'low', completed: false, dueDate: '2026-03-14', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Sarah Chen' },
  { id: 'tk-7', title: 'Update MLS listing — Riverside Haven', description: 'New photos and updated description', category: 'other', priority: 'medium', completed: false, dueDate: '2026-03-13', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Tom Nakamura' },
]

export const eventsData: CalendarEvent[] = [
  { id: 'ev-1', title: 'Showing — Sunset Retreat', date: '2026-03-10', time: '10:00 AM', type: 'showing', location: 'Austin, TX', attendeeIds: [], attendees: ['Sarah Chen', 'Alice Thompson'] },
  { id: 'ev-2', title: 'Team Standup', date: '2026-03-10', time: '9:00 AM', type: 'meeting', location: 'Zoom', attendeeIds: [], attendees: ['All agents'] },
  { id: 'ev-3', title: 'Inspection — Lakefront Manor', date: '2026-03-11', time: '2:00 PM', type: 'inspection', location: 'Chicago, IL', attendeeIds: [], attendees: ['Elena Vasquez', 'Inspector John'] },
  { id: 'ev-4', title: 'Closing — Mountain View Villa', date: '2026-03-12', time: '11:00 AM', type: 'closing', location: 'Boulder, CO', attendeeIds: [], attendees: ['Marcus Webb', 'Buyer', 'Escrow'] },
  { id: 'ev-5', title: 'Showing — Desert Modern', date: '2026-03-12', time: '2:00 PM', type: 'showing', location: 'Scottsdale, AZ', attendeeIds: [], attendees: ['James Okafor', 'Fontaine Family'] },
  { id: 'ev-6', title: 'Quarterly Review', date: '2026-03-15', time: '3:00 PM', type: 'meeting', location: 'HQ Conference Room', attendeeIds: [], attendees: ['All agents', 'Management'] },
  { id: 'ev-7', title: 'Open House — Riverside Haven', date: '2026-03-16', time: '1:00 PM', type: 'showing', location: 'Portland, OR', attendeeIds: [], attendees: ['Tom Nakamura'] },
]

export const documentsData: Document[] = [
  { id: 'doc-1', title: 'Purchase Agreement — Sunset Retreat Villa', property: 'Sunset Retreat Villa', parties: ['Alice Thompson', 'Seller Corp LLC'], status: 'sent', createdAt: '2026-03-06', expiresAt: '2026-03-13' },
  { id: 'doc-2', title: 'Lease Agreement — Ocean Breeze Cottage', property: 'Ocean Breeze Cottage', parties: ['Robert Kim', 'Pacific Holdings'], status: 'signed', createdAt: '2026-02-28', expiresAt: '2027-02-28' },
  { id: 'doc-3', title: 'Disclosure Form — Mountain View', property: 'Mountain View Villa', parties: ['Marcus Webb', 'Diana Foster'], status: 'signed', createdAt: '2026-02-20', expiresAt: '2026-03-20' },
  { id: 'doc-4', title: 'Offer Letter — Lakefront Manor', property: 'Lakefront Manor', parties: ['Naomi Patel', 'Lakefront Trust'], status: 'draft', createdAt: '2026-03-08', expiresAt: '2026-03-15' },
  { id: 'doc-5', title: 'Counter Offer — Desert Modern', property: 'Desert Modern', parties: ['Mia Fontaine', 'Desert Properties Inc'], status: 'sent', createdAt: '2026-03-07', expiresAt: '2026-03-14' },
  { id: 'doc-6', title: 'Expired NDA — Riverside Haven', property: 'Riverside Haven', parties: ['Chris Andersen', 'Northwest Realty'], status: 'expired', createdAt: '2026-01-10', expiresAt: '2026-02-10' },
]

export const adminUser: AdminUser = {
  id: 'sa-001',
  name: 'Alex Morgan',
  role: 'Super Admin',
  avatarUrl: 'https://i.pravatar.cc/150?img=47',
  email: 'alex.morgan@mack1.io',
}
