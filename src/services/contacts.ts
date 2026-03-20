import { supabase } from '../lib/supabase'
import type { Contact } from '../types'

interface RawContact {
  id: string
  name: string
  email: string
  phone: string
  avatar_url: string
  type: string
  status: string
  last_contact: string
}

function transformContact(row: RawContact): Contact {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    type: row.type as Contact['type'],
    status: row.status as Contact['status'],
    lastContact: row.last_contact,
  }
}

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return (data as RawContact[]).map(transformContact)
}

export async function createContact(data: Omit<Contact, 'id'>): Promise<Contact> {
  const { data: row, error } = await supabase
    .from('contacts')
    .insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar_url: data.avatarUrl,
      type: data.type,
      status: data.status,
      last_contact: data.lastContact,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return transformContact(row as RawContact)
}

export async function updateContact(id: string, updates: Partial<Omit<Contact, 'id'>>): Promise<void> {
  const dbUpdates: Partial<RawContact> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.lastContact !== undefined) dbUpdates.last_contact = updates.lastContact
  const { error } = await supabase.from('contacts').update(dbUpdates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
