import { supabase } from '../lib/supabase'
import type { ClientNote } from '../types'

interface RawClientNote {
  id: string
  client_id: string
  body: string
  author_id: string | null
  author_name: string | null
  created_at: string
}

function transformClientNote(row: RawClientNote): ClientNote {
  return {
    id: row.id,
    clientId: row.client_id,
    body: row.body,
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: row.created_at,
  }
}

export async function fetchClientNotes(clientId: string): Promise<ClientNote[]> {
  const { data, error } = await supabase
    .from('client_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as RawClientNote[]).map(transformClientNote)
}

interface CreateClientNoteInput {
  clientId: string
  body: string
  authorId: string | null
  authorName: string | null
}

export async function createClientNote(input: CreateClientNoteInput): Promise<ClientNote> {
  const { data, error } = await supabase
    .from('client_notes')
    .insert({
      client_id: input.clientId,
      body: input.body,
      author_id: input.authorId,
      author_name: input.authorName,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return transformClientNote(data as RawClientNote)
}

export async function deleteClientNote(id: string): Promise<void> {
  const { error } = await supabase.from('client_notes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
