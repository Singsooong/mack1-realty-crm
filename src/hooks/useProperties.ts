import { useState, useEffect } from 'react'
import { fetchProperties, createProperty, updateProperty, deleteProperty } from '../services/properties'
import type { Property } from '../types'

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProperties()
      .then(setProperties)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateProperty(data: Omit<Property, 'id'>) {
    const created = await createProperty(data)
    setProperties(prev => [...prev, created])
    return created
  }

  async function handleUpdateProperty(id: string, updates: Partial<Omit<Property, 'id'>>) {
    await updateProperty(id, updates)
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  async function handleDeleteProperty(id: string) {
    await deleteProperty(id)
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  return { properties, loading, error, createProperty: handleCreateProperty, updateProperty: handleUpdateProperty, deleteProperty: handleDeleteProperty }
}
