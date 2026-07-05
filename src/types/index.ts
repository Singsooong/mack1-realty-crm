export type Page =
  | 'dashboard'
  | 'listings'
  | 'agents'
  | 'clients'
  | 'leads'
  | 'tasks'
  | 'calendar'
  | 'esign'
  | 'settings'
  | 'google-auth-callback'
  | 'not-found'

export interface StatCard {
  id: string
  label: string
  value: string
  iconVariant: 'building' | 'dollar' | 'tag' | 'users'
  /** Optional sub-label shown under the value (e.g. "of 42 total"). */
  hint?: string
  // Trend + sparkline are optional: we only show them when the data can
  // actually back them. The CRM has no historical snapshots, so we never
  // fabricate a "vs last year" figure.
  trend?: number
  trendDirection?: 'up' | 'down'
  sparklineData?: number[]
  sparklineColor?: string
  sparklineVariant?: 'line' | 'bar'
}

/** One bucket in the "Leads Over Time" chart. */
export interface LeadsByMonthPoint {
  month: string
  leads: number
}

export interface StatusSlice {
  label: string
  value: number
  color: string
}

export interface Property {
  id: string

  // Legacy fields (kept for backward compatibility)
  name?: string
  price?: number
  location?: { city: string; state: string }

  // Listing Information
  status?: 'available' | 'sold' | 'pending'
  listPrice?: number
  mlsNumber?: string

  // Contact Information
  agent1Id?: string
  agent1Name?: string
  agent2Id?: string
  agent2Name?: string
  mlsAgentName?: string
  listingOffice?: string
  seller?: string

  // Location Information
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  area?: string
  subArea?: string
  communityName?: string
  schoolDistrict?: string
  highSchool?: string
  jrHighSchool?: string
  elementarySchool?: string

  // Details
  beds?: number
  baths?: number
  garage?: number
  cartPort?: number
  pool?: boolean
  sqft?: number
  acreage?: number
  stories?: number
  basement?: boolean
  buildingName?: string
  unitFloor?: string
  hoa?: boolean
  hoaDues?: number
  subType?: string
  style?: string
  yearBuilt?: number
  view?: string
  waterfront?: boolean
  golfCourse?: boolean

  // Media
  imageUrl?: string
  imageUrls?: string[]

  // Metadata
  description?: string
  createdBy?: string | null
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
  role: 'admin' | 'agent'          // NEW
}

/**
 * The client lifecycle pipeline. Ordered from first touch to closed — see
 * CLIENT_STATUS_ORDER in lib/clientStatus.ts for the canonical ordering and
 * display labels/colors. Stored kebab-cased to match the DB check constraint.
 */
export type ClientStatus =
  | 'new-inquiry'
  | 'pre-qualified'
  | 'in-credit-repair'
  | 'pre-approved'
  | 'actively-searching'
  | 'offer-submitted'
  | 'in-contract'
  | 'pending'
  | 'clear-to-close'
  | 'closed'

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string
  type: 'buyer' | 'seller' | 'investor'
  /** Pipeline stage (replaced the legacy active/inactive flag). */
  status: ClientStatus
  lastContact: string
  /** Date-only birthdate as 'YYYY-MM-DD'. Optional — may be unknown. */
  birthDate?: string
}

/**
 * A "Client" is the same record as a Contact — the product renamed the concept
 * but the underlying `contacts` table stays put. New client-feature code should
 * import `Client` for clarity; both names refer to one shape.
 */
export type Client = Contact

/** One entry in a client's append-only notes/remarks timeline. */
export interface ClientNote {
  id: string
  clientId: string
  body: string
  authorId: string | null
  authorName: string | null
  createdAt: string
}

/** A file uploaded to a client, stored in the private `client-documents` bucket. */
export interface ClientDocument {
  id: string
  clientId: string
  fileName: string
  /** Path within the `client-documents` bucket; resolve via a signed URL. */
  filePath: string
  mimeType: string | null
  sizeBytes: number | null
  uploadedBy: string | null
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  propertyInterest: string
  message: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  assignedAgentId: string          // was: assignedTo: string
  assignedAgentName: string        // NEW — resolved via join
  date: string
}

export interface Task {
  id: string
  title: string
  description: string
  category: 'follow-up' | 'inspection' | 'paperwork' | 'showing' | 'other'
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed'
  dueDate: string
  assignedAgentId: string          // was: assignedTo: string
  assignedAgentName: string        // NEW — resolved via join
  /** Optional client this task belongs to (null = standalone agent task). */
  clientId?: string | null
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: 'showing' | 'meeting' | 'inspection' | 'closing'
  location: string
  attendeeIds: string[]            // NEW — uuid[] from DB
  attendees: string[]              // kept for display (names)
}

export interface Document {
  id: string
  title: string
  property: string | null
  clientName: string
  clientEmail: string
  clientPhone: string | null
  /** Full ordered signer list. Empty for legacy rows — fall back to client_* then. */
  recipients: Signer[]
  agentId: string | null
  signwellId: string | null
  status: 'draft' | 'sent' | 'signed' | 'expired'
  signingUrl: string | null
  downloadUrl: string | null
  createdAt: string
  completedAt: string | null
  expiresAt: string | null
}

/** The kinds of field an agent can drop on a document for a signer to complete. */
export type FieldType = 'signature' | 'date' | 'checkbox'

/**
 * One field the agent placed on the PDF, stored as ratios (0–1 from the page's
 * top-left) so it's independent of render scale. `signerIndex` is 0-based and
 * indexes into the document's signer list — that's how a field is bound to the
 * person who must fill it.
 */
export interface PlacedField {
  /** Stable client-side key for React lists / removal; not sent to SignWell. */
  id: string
  signerIndex: number
  type: FieldType
  page: number
  xRatio: number
  yRatio: number
}

/** A person who must sign the document. Index 0 is the primary signer. */
export interface Signer {
  name: string
  email: string
  phone: string
}

export interface SendDocumentPayload {
  title: string
  property: string
  /** Ordered signer list; index 0 mirrors the legacy client_* columns for display. */
  signers: Signer[]
  fileBase64: string
  fileName: string
  agentId: string
  /** Every field dropped across all signers. */
  fields: PlacedField[]
  /** Optional custom email subject; defaults to title/property when blank. */
  subject?: string
  /** Optional custom email body shown to the client; defaults to a standard note when blank. */
  message?: string
}

/**
 * In-app notification shown in the header bell. v1 only emits 'esign_status'
 * rows (a document moved to 'signed'), but `type` is kept open so other
 * domains (leads, tasks…) can reuse the same table + bell later.
 *
 * Display copy is NOT stored — it's rendered from these structured fields by
 * buildEsignNotificationCopy() in services/notifications.ts, so wording can
 * change without a DB migration or webhook redeploy.
 */
export interface AppNotification {
  id: string
  /** auth.users id of the agent who should see this; null = unattributed (admins only). */
  recipientId: string | null
  type: 'esign_status'
  /** The e-sign document this notification points to (for the deep-link). */
  documentId: string | null
  /** The new document status that triggered this, e.g. 'signed'. */
  status: string | null
  /** Denormalized snapshot so the row is self-contained for Realtime + rendering. */
  documentTitle: string | null
  clientName: string | null
  /** Null until the recipient opens/clicks it. */
  readAt: string | null
  createdAt: string
}

export interface AdminUser {
  id: string
  name: string
  role: string
  avatarUrl: string
  email: string
}
