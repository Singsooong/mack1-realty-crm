import { useCallback, useEffect, useState } from 'react'
import {
  deleteClientDocument,
  fetchClientDocuments,
  getClientDocumentUrl,
  uploadClientDocument,
} from '../services/clientDocuments'
import { useAuth } from './useAuth'
import type { ClientDocument } from '../types'

export function useClientDocuments(clientId: string) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchClientDocuments(clientId)
      .then(data => { if (!cancelled) setDocuments(data) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [clientId])

  const uploadDocument = useCallback(async (file: File) => {
    const created = await uploadClientDocument(clientId, file, user?.id ?? null)
    setDocuments(prev => [created, ...prev])
  }, [clientId, user?.id])

  const removeDocument = useCallback(async (doc: ClientDocument) => {
    await deleteClientDocument(doc)
    setDocuments(prev => prev.filter(d => d.id !== doc.id))
  }, [])

  return { documents, loading, error, uploadDocument, removeDocument, getDocumentUrl: getClientDocumentUrl }
}
