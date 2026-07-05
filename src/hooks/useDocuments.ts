import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchDocuments, sendDocument as sendDocumentService, downloadDocument } from '../services/esign'
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

function rawToDocument(row: RawDocument): Document {
  return {
    id: row.id,
    title: row.title,
    property: row.property,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
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

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
      .then(setDocuments)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

    // Realtime: patch local state when webhook updates a document row
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'documents' },
        (payload) => {
          const updated = rawToDocument(payload.new as RawDocument)
          setDocuments(prev =>
            prev.map(d => d.id === updated.id ? updated : d)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleSendDocument(payload: SendDocumentPayload): Promise<Document> {
    const doc = await sendDocumentService(payload)
    setDocuments(prev => [doc, ...prev])
    return doc
  }

  async function handleDownload(documentId: string, title: string) {
    const fileName = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
    await downloadDocument(documentId, fileName)
  }

  function refresh() {
    setLoading(true)
    fetchDocuments()
      .then(setDocuments)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  return {
    documents,
    loading,
    error,
    sendDocument: handleSendDocument,
    download: handleDownload,
    refresh,
  }
}
