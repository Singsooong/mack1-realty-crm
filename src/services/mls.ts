import type { Property } from '@/types'

// SimplyRETS sandbox credentials — replace with your real MLS provider credentials
const MLS_API_BASE = 'https://api.simplyrets.com'
const MLS_API_USER = 'simplyrets'
const MLS_API_PASS = 'simplyrets'

interface SimplyRetsProperty {
  listPrice?: number
  mlsId?: string
  address?: {
    full?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    streetNumber?: string
    streetName?: string
  }
  property?: {
    bedrooms?: number
    bathrooms?: number
    bathsFull?: number
    area?: number
    lotSize?: number
    yearBuilt?: number
    stories?: number
    pool?: boolean | string
    garage?: number
    style?: string
    subType?: string
    view?: string
    waterfront?: boolean
    basement?: string
  }
  remarks?: string
  agent?: {
    firstName?: string
    lastName?: string
    office?: { name?: string }
  }
  photos?: string[]
  association?: { fee?: number; amenities?: string }
}

export interface MlsSearchResult {
  mlsId: string
  address: string
  city: string
  state: string
  listPrice: number | undefined
  beds: number | undefined
  baths: number | undefined
  sqft: number | undefined
  thumbnail: string | undefined
  data: Partial<Property>
}

function safeNum(val: unknown): number | undefined {
  const n = Number(val)
  return val != null && val !== '' && isFinite(n) ? n : undefined
}

function mapToProperty(raw: SimplyRetsProperty): Partial<Property> {
  const p = raw.property ?? {}
  const addr = raw.address ?? {}
  const agent = raw.agent ?? {}

  return {
    listPrice: safeNum(raw.listPrice),
    mlsNumber: raw.mlsId != null ? String(raw.mlsId) : undefined,
    address: addr.full ?? [addr.streetNumber, addr.streetName].filter(Boolean).join(' '),
    city: addr.city,
    state: addr.state,
    zipCode: addr.postalCode,
    country: addr.country,
    beds: safeNum(p.bedrooms),
    baths: safeNum(p.bathrooms ?? p.bathsFull),
    sqft: safeNum(p.area),
    acreage: safeNum(p.lotSize),
    yearBuilt: safeNum(p.yearBuilt),
    stories: safeNum(p.stories),
    pool: p.pool != null ? !!p.pool : undefined,
    garage: safeNum(p.garage),
    style: p.style,
    subType: p.subType,
    view: p.view,
    waterfront: p.waterfront,
    basement: !!p.basement,
    description: raw.remarks,
    mlsAgentName: [agent.firstName, agent.lastName].filter(Boolean).join(' ') || undefined,
    listingOffice: agent.office?.name,
    imageUrls: raw.photos?.slice(0, 10),
    hoa: !!raw.association?.fee,
    hoaDues: safeNum(raw.association?.fee),
  }
}

function toSearchResult(raw: SimplyRetsProperty): MlsSearchResult {
  const addr = raw.address ?? {}
  const p = raw.property ?? {}
  return {
    mlsId: raw.mlsId != null ? String(raw.mlsId) : '',
    address: addr.full ?? [addr.streetNumber, addr.streetName].filter(Boolean).join(' ') ?? '',
    city: addr.city ?? '',
    state: addr.state ?? '',
    listPrice: safeNum(raw.listPrice),
    beds: safeNum(p.bedrooms),
    baths: safeNum(p.bathrooms ?? p.bathsFull),
    sqft: safeNum(p.area),
    thumbnail: raw.photos?.[0],
    data: mapToProperty(raw),
  }
}

async function fetchFromSimplyRets(params: Record<string, string>): Promise<SimplyRetsProperty[]> {
  const credentials = btoa(`${MLS_API_USER}:${MLS_API_PASS}`)
  const res = await fetch(`${MLS_API_BASE}/properties?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Basic ${credentials}` },
  })
  if (!res.ok) throw new Error(`MLS API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function searchMlsListings(query: string): Promise<MlsSearchResult[]> {
  // Try filtered search first; if empty fall back to unfiltered sandbox listings
  let data = await fetchFromSimplyRets({ q: query, limit: '5' })
  if (!data || data.length === 0) {
    data = await fetchFromSimplyRets({ limit: '5' })
  }
  return (data ?? []).map(toSearchResult)
}
