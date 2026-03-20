import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Property } from '@/types'

interface PropertyDrawerProps {
  open: boolean
  onClose: () => void
  property: Property | null  // null = Add mode, non-null = Edit mode
  onSave: (id: string | null, data: Omit<Property, 'id'>) => Promise<void>
}

export function PropertyDrawer({ open, onClose, property, onSave }: PropertyDrawerProps) {
  const [name, setName]           = useState('')
  const [city, setCity]           = useState('')
  const [stateField, setStateField] = useState('')
  const [price, setPrice]         = useState(0)
  const [beds, setBeds]           = useState(0)
  const [baths, setBaths]         = useState(0)
  const [sqft, setSqft]           = useState(0)
  const [imageUrl, setImageUrl]   = useState('')
  const [status, setStatus]       = useState<Property['status']>('available')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Pre-fill form when opening in Edit mode; blank form for Add mode
  useEffect(() => {
    if (open) {
      setName(property?.name ?? '')
      setCity(property?.location.city ?? '')
      setStateField(property?.location.state ?? '')
      setPrice(property?.price ?? 0)
      setBeds(property?.beds ?? 0)
      setBaths(property?.baths ?? 0)
      setSqft(property?.sqft ?? 0)
      setImageUrl(property?.imageUrl ?? '')
      setStatus(property?.status ?? 'available')
      setError(null)
    }
  }, [open, property])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(property?.id ?? null, {
        name,
        price,
        beds,
        baths,
        sqft,
        imageUrl,
        status,
        location: { city, state: stateField },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v && !loading) onClose() }}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{property ? 'Edit Listing' : 'Add Listing'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Sunset Villa"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">City</label>
              <Input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Phoenix"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">State</label>
              <Input
                value={stateField}
                onChange={e => setStateField(e.target.value)}
                placeholder="AZ"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Price / mo</label>
            <Input
              type="number"
              min={1}
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Beds</label>
              <Input
                type="number"
                min={0}
                value={beds}
                onChange={e => setBeds(Number(e.target.value))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Baths</label>
              <Input
                type="number"
                min={0}
                value={baths}
                onChange={e => setBaths(Number(e.target.value))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Sqft</label>
              <Input
                type="number"
                min={1}
                value={sqft}
                onChange={e => setSqft(Number(e.target.value))}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Image URL</label>
            <Input
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as Property['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <SheetFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
