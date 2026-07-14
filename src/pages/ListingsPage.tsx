import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { MapPin, BedDouble, Bath, Square, Search, SlidersHorizontal, MoreHorizontal } from 'lucide-react'
import { useProperties } from '@/hooks/useProperties'
import { uploadPropertyImages } from '@/services/properties'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ListingForm } from '@/components/listings/ListingForm'
import { ListingPreviewModal } from '@/components/listings/ListingPreviewModal'
import { DeleteConfirmDialog } from '@/components/listings/DeleteConfirmDialog'
import { ListingsPageSkeleton } from '@/components/listings/ListingsPageSkeleton'
import type { Property } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from '@/lib/router'

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-950',
  sold: 'bg-muted text-muted-foreground hover:bg-muted',
  pending: 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-950',
}

export function ListingsPage() {
  const { isAdmin, user } = useAuth()
  const { properties, loading, error, createProperty, updateProperty, deleteProperty } = useProperties()
  const { params, navigate } = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null)
  const [previewProperty, setPreviewProperty] = useState<Property | null>(null)

  // Deep-link: clicking a card on the dashboard lands here with ?listing=<id>.
  // Open that property's preview once properties have loaded, then strip the
  // param so closing the modal doesn't immediately re-open it.
  useEffect(() => {
    const listingId = params.listing
    if (!listingId || properties.length === 0) return
    const target = properties.find(p => p.id === listingId)
    if (target) {
      setPreviewProperty(target)
      navigate('listings')
    }
  }, [params.listing, properties, navigate])

  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditingProperty(null)
  }

  async function handleSave(id: string | null, data: Omit<Property, 'id'>, imageFiles: File[]) {
    let propertyData = { ...data }

    if (imageFiles.length > 0) {
      const newUrls = await uploadPropertyImages(imageFiles)
      propertyData = {
        ...propertyData,
        imageUrl: propertyData.imageUrl ?? newUrls[0],
        imageUrls: [...(propertyData.imageUrls ?? []), ...newUrls],
      }
    }

    // Ensure imageUrl is always populated so cards can render without imageUrls fallback
    if (!propertyData.imageUrl && propertyData.imageUrls?.[0]) {
      propertyData = { ...propertyData, imageUrl: propertyData.imageUrls[0] }
    }

    if (id === null) {
      await createProperty(propertyData)
    } else {
      await updateProperty(id, propertyData)
    }
    toast.success(id === null ? 'Listing added' : 'Listing updated')
    handleDrawerClose()
  }

  async function handleDelete() {
    if (!deletingProperty) return
    await deleteProperty(deletingProperty.id)
    toast.success('Listing deleted')
    setDeletingProperty(null)
  }

  if (loading) return <ListingsPageSkeleton />
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

  const filtered = properties.filter(p => {
    const name = p.name || p.address || ''
    const city = p.location?.city || p.city || ''
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      city.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Listings</h1>
          <p className="text-sm text-muted-foreground">{properties.length} total properties</p>
        </div>
        <Button onClick={() => { setEditingProperty(null); setDrawerOpen(true) }}>
          + Add Listing
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search listings..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon"><SlidersHorizontal className="h-4 w-4" /></Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(property => (
          <Card
            key={property.id}
            className="overflow-hidden hover:border-border transition-colors group cursor-pointer"
            onClick={() => setPreviewProperty(property)}
          >
            <div className="relative h-48 overflow-hidden -mt-4">
              {(property.imageUrl || property.imageUrls?.[0]) && (
                <img src={property.imageUrl || property.imageUrls?.[0]} alt={property.name || property.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              )}
              <Badge className={`absolute bottom-3 left-3 capitalize ${STATUS_STYLES[property.status || 'available']}`}>{property.status || 'available'}</Badge>
              {(isAdmin || property.createdBy === user?.id) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/70 text-white z-10"
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingProperty(property); setDrawerOpen(true) }}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); setDeletingProperty(property) }}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="font-semibold text-foreground">{property.name || property.address || 'Untitled'}</h3>
                {(property.price || property.listPrice) && (
                  <span className="font-bold text-foreground whitespace-nowrap">${(property.price || property.listPrice)?.toLocaleString()}<span className="text-xs text-muted-foreground">/mo</span></span>
                )}
              </div>
              <div className="flex items-center gap-1 mb-3">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{property.location?.city || property.city || 'N/A'}, {property.location?.state || property.state || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {property.beds !== undefined && <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{property.beds}</span>}
                {property.baths !== undefined && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.baths}</span>}
                {property.sqft && <span className="flex items-center gap-1"><Square className="h-3.5 w-3.5" />{property.sqft.toLocaleString()} sqft</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ListingForm
        open={drawerOpen}
        onClose={handleDrawerClose}
        property={editingProperty}
        onSave={handleSave}
      />
      <ListingPreviewModal
        property={previewProperty}
        open={!!previewProperty}
        onClose={() => setPreviewProperty(null)}
      />
      <DeleteConfirmDialog
        property={deletingProperty}
        onConfirm={handleDelete}
        onCancel={() => setDeletingProperty(null)}
      />
    </div>
  )
}
