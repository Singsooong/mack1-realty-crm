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
  birth_date: string | null
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
    birthDate: row.birth_date ?? undefined,
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
      birth_date: data.birthDate || null,
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
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
  if (updates.type !== undefined) dbUpdates.type = updates.type
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.lastContact !== undefined) dbUpdates.last_contact = updates.lastContact
  if (updates.birthDate !== undefined) dbUpdates.birth_date = updates.birthDate || null
  const { error } = await supabase.from('contacts').update(dbUpdates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadContactAvatar(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('contact-avatars')
    .upload(path, file, { upsert: false })
  if (error) throw new Error(`Avatar upload failed: ${error.message}`)
  const { data } = supabase.storage.from('contact-avatars').getPublicUrl(path)
  return data.publicUrl
}
