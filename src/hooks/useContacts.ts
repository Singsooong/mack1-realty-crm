import { useState, useEffect } from 'react'
import { fetchContacts, createContact, updateContact, deleteContact } from '../services/contacts'
import type { Contact } from '../types'

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContacts()
      .then(setContacts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateContact(data: Omit<Contact, 'id'>) {
    const created = await createContact(data)
    setContacts(prev => [...prev, created])
    return created
  }

  async function handleUpdateContact(id: string, updates: Partial<Omit<Contact, 'id'>>) {
    await updateContact(id, updates)
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  async function handleDeleteContact(id: string) {
    await deleteContact(id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return { contacts, loading, error, createContact: handleCreateContact, updateContact: handleUpdateContact, deleteContact: handleDeleteContact }
}
