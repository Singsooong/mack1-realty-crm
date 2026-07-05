import { useCallback, useEffect, useState } from 'react'
import { createClientNote, deleteClientNote, fetchClientNotes } from '../services/clientNotes'
import { useAuth } from './useAuth'
import type { ClientNote } from '../types'

export function useClientNotes(clientId: string) {
  const { user, agentRecord } = useAuth()
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchClientNotes(clientId)
      .then(data => { if (!cancelled) setNotes(data) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [clientId])

  const addNote = useCallback(async (body: string) => {
    const created = await createClientNote({
      clientId,
      body,
      authorId: user?.id ?? null,
      authorName: agentRecord?.name ?? null,
    })
    setNotes(prev => [created, ...prev])
  }, [clientId, user?.id, agentRecord?.name])

  const removeNote = useCallback(async (id: string) => {
    await deleteClientNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }, [])

  return { notes, loading, error, addNote, removeNote }
}
