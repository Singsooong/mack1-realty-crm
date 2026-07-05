import { supabase } from '../lib/supabase'
import type { Document, SendDocumentPayload, Signer } from '../types'

interface RawDocument {
  id: string
  title: string
  property: string | null
  client_name: string
  client_email: string
  client_phone: string | null
  recipients: Signer[] | null
  agent_id: string | null
  signwell_id: string | null
  status: string
  signing_url: string | null
  download_url: string | null
  created_at: string
  completed_at: string | null
  expires_at: string | null
}

function transformDocument(row: RawDocument): Document {
  return {
    id: row.id,
    title: row.title,
    property: row.property,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    // Legacy rows have an empty recipients array — callers fall back to client_*.
    recipients: row.recipients ?? [],
    agentId: row.agent_id,
    signwellId: row.signwell_id,
    status: row.status as Document['status'],
    signingUrl: row.signing_url,
    downloadUrl: row.download_url,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    expiresAt: row.expires_at,
  }
}

export async function fetchDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as RawDocument[]).map(transformDocument)
}

export async function sendDocument(payload: SendDocumentPayload): Promise<Document> {
  const { data, error } = await supabase.functions.invoke('signwell-send-document', {
    body: {
      title: payload.title,
      property: payload.property,
      // Snake-cased signer list; the edge function maps index 0 → client_* columns.
      signers: payload.signers,
      file_base64: payload.fileBase64,
      file_name: payload.fileName,
      agent_id: payload.agentId,
      fields: payload.fields,
      subject: payload.subject,
      message: payload.message,
    },
  })
  if (error) {
    const body = await (error as { context?: Response }).context?.json().catch(() => null)
    throw new Error(body?.error ?? error.message)
  }
  return transformDocument(data as RawDocument)
}

// Streams the signed PDF bytes through our esign-download edge function.
// We proxy through the function (rather than hitting the SignWell URL directly)
// because SignWell sets X-Frame-Options / frame-ancestors that block both
// cross-origin fetch and iframe embedding.
async function fetchSignedPdfBlob(documentId: string): Promise<Blob> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const res = await fetch(
    `${supabaseUrl}/functions/v1/esign-download?document_id=${documentId}&token=${session.access_token}`,
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `Download failed (${res.status})`)
  }
  return res.blob()
}

export async function downloadDocument(documentId: string, fileName = 'signed-document.pdf'): Promise<void> {
  const blob = await fetchSignedPdfBlob(documentId)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// Opens the signed PDF inline in a new browser tab, routed through our access-controlled
// esign-download function (disposition=inline so the tab renders it instead of downloading).
export async function openSignedPdf(documentId: string): Promise<void> {
  // Open the tab synchronously inside the click gesture to avoid popup blockers,
  // then point it at the authenticated URL once we've resolved the session token.
  const tab = window.open('', '_blank')
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const target = `${supabaseUrl}/functions/v1/esign-download?document_id=${documentId}&token=${session.access_token}&disposition=inline`

    if (tab) tab.location.href = target
    else window.open(target, '_blank', 'noopener,noreferrer')
  } catch (e) {
    tab?.close()
    throw e
  }
}
