import { supabase } from '../lib/supabase'
import type { ClientDocument } from '../types'

const BUCKET = 'client-documents'

interface RawClientDocument {
  id: string
  client_id: string
  file_name: string
  file_path: string
  mime_type: string | null
  size_bytes: number | null
  uploaded_by: string | null
  created_at: string
}

function transformClientDocument(row: RawClientDocument): ClientDocument {
  return {
    id: row.id,
    clientId: row.client_id,
    fileName: row.file_name,
    filePath: row.file_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  }
}

export async function fetchClientDocuments(clientId: string): Promise<ClientDocument[]> {
  const { data, error } = await supabase
    .from('client_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as RawClientDocument[]).map(transformClientDocument)
}

export async function uploadClientDocument(
  clientId: string,
  file: File,
  uploadedBy: string | null,
): Promise<ClientDocument> {
  // Namespacing the object path by client keeps the bucket organised and makes
  // a future per-client storage policy straightforward.
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined })
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data, error } = await supabase
    .from('client_documents')
    .insert({
      client_id: clientId,
      file_name: file.name,
      file_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  if (error) {
    // Roll back the orphaned object so storage and the table stay in sync.
    await supabase.storage.from(BUCKET).remove([path])
    throw new Error(error.message)
  }
  return transformClientDocument(data as RawClientDocument)
}

/**
 * Mints a short-lived signed URL for a private object. The bucket is not public,
 * so this is the only way to view/download a client document from the browser.
 */
export async function getClientDocumentUrl(filePath: string, expiresIn = 300): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, expiresIn)
  if (error || !data) throw new Error(error?.message ?? 'Could not generate document link')
  return data.signedUrl
}

export async function deleteClientDocument(doc: ClientDocument): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([doc.filePath])
  if (storageError) throw new Error(storageError.message)
  const { error } = await supabase.from('client_documents').delete().eq('id', doc.id)
  if (error) throw new Error(error.message)
}
