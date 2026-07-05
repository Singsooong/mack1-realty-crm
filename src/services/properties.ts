import { supabase } from '../lib/supabase'
import type { Property } from '../types'

interface RawProperty {
  id: string
  // All fields are optional because the database may not have all of them
  status?: string | null
  list_price?: number | null
  mls_number?: string | null

  // Contact Information
  agent1_id?: string | null
  agent1_name?: string | null
  agent2_id?: string | null
  agent2_name?: string | null
  mls_agent_name?: string | null
  listing_office?: string | null
  seller?: string | null

  // Location Information
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  area?: string | null
  sub_area?: string | null
  community_name?: string | null
  school_district?: string | null
  high_school?: string | null
  jr_high_school?: string | null
  elementary_school?: string | null

  // Details
  beds?: number | null
  baths?: number | null
  garage?: number | null
  cart_port?: number | null
  pool?: boolean | null
  sqft?: number | null
  acreage?: number | null
  stories?: number | null
  basement?: boolean | null
  building_name?: string | null
  unit_floor?: string | null
  hoa?: boolean | null
  hoa_dues?: number | null
  sub_type?: string | null
  style?: string | null
  year_built?: number | null
  view?: string | null
  waterfront?: boolean | null
  golf_course?: boolean | null

  // Media
  image_url?: string | null
  image_urls?: string[] | null

  // Metadata
  description?: string | null
  created_by?: string | null

  // Legacy fields for backward compatibility
  name?: string | null
  price?: number | null
}

function transformProperty(row: RawProperty): Property {
  return {
    id: row.id,
    status: row.status as Property['status'],
    listPrice: row.list_price || undefined,
    mlsNumber: row.mls_number || undefined,
    agent1Id: row.agent1_id || undefined,
    agent1Name: row.agent1_name || undefined,
    agent2Id: row.agent2_id || undefined,
    agent2Name: row.agent2_name || undefined,
    mlsAgentName: row.mls_agent_name || undefined,
    listingOffice: row.listing_office || undefined,
    seller: row.seller || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    zipCode: row.zip_code || undefined,
    country: row.country || undefined,
    area: row.area || undefined,
    subArea: row.sub_area || undefined,
    communityName: row.community_name || undefined,
    schoolDistrict: row.school_district || undefined,
    highSchool: row.high_school || undefined,
    jrHighSchool: row.jr_high_school || undefined,
    elementarySchool: row.elementary_school || undefined,
    beds: row.beds || undefined,
    baths: row.baths || undefined,
    garage: row.garage || undefined,
    cartPort: row.cart_port || undefined,
    pool: row.pool || undefined,
    sqft: row.sqft || undefined,
    acreage: row.acreage || undefined,
    stories: row.stories || undefined,
    basement: row.basement || undefined,
    buildingName: row.building_name || undefined,
    unitFloor: row.unit_floor || undefined,
    hoa: row.hoa || undefined,
    hoaDues: row.hoa_dues || undefined,
    subType: row.sub_type || undefined,
    style: row.style || undefined,
    yearBuilt: row.year_built || undefined,
    view: row.view || undefined,
    waterfront: row.waterfront || undefined,
    golfCourse: row.golf_course || undefined,
    imageUrl: row.image_url || undefined,
    imageUrls: row.image_urls?.length ? row.image_urls : undefined,
    description: row.description || undefined,
    createdBy: row.created_by,
    // Legacy backward compatibility
    name: row.name || row.address || undefined,
    price: row.price || row.list_price || undefined,
    location: row.city || row.state ? { city: row.city || '', state: row.state || '' } : undefined,
  }
}

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return (data as unknown as RawProperty[]).map(transformProperty)
}

export async function createProperty(data: Omit<Property, 'id'>): Promise<Property> {
  const { data: { user } } = await supabase.auth.getUser()
  const insertData: any = {
    status: data.status,
    list_price: data.listPrice,
    mls_number: data.mlsNumber,
    agent1_id: data.agent1Id,
    agent1_name: data.agent1Name,
    agent2_id: data.agent2Id,
    agent2_name: data.agent2Name,
    mls_agent_name: data.mlsAgentName,
    listing_office: data.listingOffice,
    seller: data.seller,
    address: data.address,
    city: data.city,
    state: data.state,
    zip_code: data.zipCode,
    country: data.country,
    area: data.area,
    sub_area: data.subArea,
    community_name: data.communityName,
    school_district: data.schoolDistrict,
    high_school: data.highSchool,
    jr_high_school: data.jrHighSchool,
    elementary_school: data.elementarySchool,
    beds: data.beds,
    baths: data.baths,
    garage: data.garage,
    cart_port: data.cartPort,
    pool: data.pool,
    sqft: data.sqft,
    acreage: data.acreage,
    stories: data.stories,
    basement: data.basement,
    building_name: data.buildingName,
    unit_floor: data.unitFloor,
    hoa: data.hoa,
    hoa_dues: data.hoaDues,
    sub_type: data.subType,
    style: data.style,
    year_built: data.yearBuilt,
    view: data.view,
    waterfront: data.waterfront,
    golf_course: data.golfCourse,
    image_url: data.imageUrl,
    image_urls: data.imageUrls ?? [],
    description: data.description,
    created_by: user?.id ?? null,
    name: data.name || data.address,
    price: data.price || data.listPrice,
  }

  const { data: row, error } = await supabase
    .from('properties')
    .insert(insertData)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return transformProperty(row as unknown as RawProperty)
}

export async function updateProperty(id: string, updates: Partial<Omit<Property, 'id'>>): Promise<void> {
  const dbUpdates: Partial<RawProperty> = {}

  // Listing Information
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.listPrice !== undefined) dbUpdates.list_price = updates.listPrice
  if (updates.mlsNumber !== undefined) dbUpdates.mls_number = updates.mlsNumber

  // Contact Information
  if (updates.agent1Id !== undefined) dbUpdates.agent1_id = updates.agent1Id
  if (updates.agent1Name !== undefined) dbUpdates.agent1_name = updates.agent1Name
  if (updates.agent2Id !== undefined) dbUpdates.agent2_id = updates.agent2Id
  if (updates.agent2Name !== undefined) dbUpdates.agent2_name = updates.agent2Name
  if (updates.mlsAgentName !== undefined) dbUpdates.mls_agent_name = updates.mlsAgentName
  if (updates.listingOffice !== undefined) dbUpdates.listing_office = updates.listingOffice
  if (updates.seller !== undefined) dbUpdates.seller = updates.seller

  // Location Information
  if (updates.address !== undefined) dbUpdates.address = updates.address
  if (updates.city !== undefined) dbUpdates.city = updates.city
  if (updates.state !== undefined) dbUpdates.state = updates.state
  if (updates.zipCode !== undefined) dbUpdates.zip_code = updates.zipCode
  if (updates.country !== undefined) dbUpdates.country = updates.country
  if (updates.area !== undefined) dbUpdates.area = updates.area
  if (updates.subArea !== undefined) dbUpdates.sub_area = updates.subArea
  if (updates.communityName !== undefined) dbUpdates.community_name = updates.communityName
  if (updates.schoolDistrict !== undefined) dbUpdates.school_district = updates.schoolDistrict
  if (updates.highSchool !== undefined) dbUpdates.high_school = updates.highSchool
  if (updates.jrHighSchool !== undefined) dbUpdates.jr_high_school = updates.jrHighSchool
  if (updates.elementarySchool !== undefined) dbUpdates.elementary_school = updates.elementarySchool

  // Details
  if (updates.beds !== undefined) dbUpdates.beds = updates.beds
  if (updates.baths !== undefined) dbUpdates.baths = updates.baths
  if (updates.garage !== undefined) dbUpdates.garage = updates.garage
  if (updates.cartPort !== undefined) dbUpdates.cart_port = updates.cartPort
  if (updates.pool !== undefined) dbUpdates.pool = updates.pool
  if (updates.sqft !== undefined) dbUpdates.sqft = updates.sqft
  if (updates.acreage !== undefined) dbUpdates.acreage = updates.acreage
  if (updates.stories !== undefined) dbUpdates.stories = updates.stories
  if (updates.basement !== undefined) dbUpdates.basement = updates.basement
  if (updates.buildingName !== undefined) dbUpdates.building_name = updates.buildingName
  if (updates.unitFloor !== undefined) dbUpdates.unit_floor = updates.unitFloor
  if (updates.hoa !== undefined) dbUpdates.hoa = updates.hoa
  if (updates.hoaDues !== undefined) dbUpdates.hoa_dues = updates.hoaDues
  if (updates.subType !== undefined) dbUpdates.sub_type = updates.subType
  if (updates.style !== undefined) dbUpdates.style = updates.style
  if (updates.yearBuilt !== undefined) dbUpdates.year_built = updates.yearBuilt
  if (updates.view !== undefined) dbUpdates.view = updates.view
  if (updates.waterfront !== undefined) dbUpdates.waterfront = updates.waterfront
  if (updates.golfCourse !== undefined) dbUpdates.golf_course = updates.golfCourse

  // Media
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl
  if (updates.imageUrls !== undefined) dbUpdates.image_urls = updates.imageUrls

  // Description
  if (updates.description !== undefined) dbUpdates.description = updates.description

  // Legacy backward compatibility
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.price !== undefined) dbUpdates.price = updates.price
  if (updates.location?.city !== undefined) dbUpdates.city = updates.location.city
  if (updates.location?.state !== undefined) dbUpdates.state = updates.location.state

  const { error } = await supabase.from('properties').update(dbUpdates as any).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadPropertyImages(files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('property-images')
      .upload(path, file, { upsert: false })
    if (error) throw new Error(`Image upload failed: ${error.message}`)
    const { data } = supabase.storage.from('property-images').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}
