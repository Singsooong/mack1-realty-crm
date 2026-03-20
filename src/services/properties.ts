import { supabase } from '../lib/supabase'
import type { Property } from '../types'

interface RawProperty {
  id: string
  name: string
  city: string
  state: string
  price: number
  beds: number
  baths: number
  sqft: number
  image_url: string
  status: string
}

function transformProperty(row: RawProperty): Property {
  return {
    id: row.id,
    name: row.name,
    location: { city: row.city, state: row.state },
    price: row.price,
    beds: row.beds,
    baths: row.baths,
    sqft: row.sqft,
    imageUrl: row.image_url,
    status: row.status as Property['status'],
  }
}

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return (data as RawProperty[]).map(transformProperty)
}

export async function createProperty(data: Omit<Property, 'id'>): Promise<Property> {
  const { data: row, error } = await supabase
    .from('properties')
    .insert({
      name: data.name,
      city: data.location.city,
      state: data.location.state,
      price: data.price,
      beds: data.beds,
      baths: data.baths,
      sqft: data.sqft,
      image_url: data.imageUrl,
      status: data.status,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return transformProperty(row as RawProperty)
}

export async function updateProperty(id: string, updates: Partial<Omit<Property, 'id'>>): Promise<void> {
  const dbUpdates: Partial<RawProperty> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.location?.city !== undefined) dbUpdates.city = updates.location.city
  if (updates.location?.state !== undefined) dbUpdates.state = updates.location.state
  if (updates.price !== undefined) dbUpdates.price = updates.price
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl
  if (updates.beds  !== undefined) dbUpdates.beds  = updates.beds
  if (updates.baths !== undefined) dbUpdates.baths = updates.baths
  if (updates.sqft  !== undefined) dbUpdates.sqft  = updates.sqft
  const { error } = await supabase.from('properties').update(dbUpdates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
