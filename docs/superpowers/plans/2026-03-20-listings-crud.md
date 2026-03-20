# Listings CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Add, Edit, and Delete UI to the Listings page via a side drawer, kebab card menu, and delete confirmation dialog.

**Architecture:** Two new focused components (`PropertyDrawer`, `DeleteConfirmDialog`) under `src/components/listings/`. `ListingsPage` holds all open/selected state and wires handlers. The service layer (`src/services/properties.ts`) and hook (`src/hooks/useProperties.ts`) are already fully implemented — this plan is UI-only plus one service bug fix.

**Tech Stack:** React 19, TypeScript (strict), Vite, shadcn/ui (Sheet, Dialog, DropdownMenu), Tailwind CSS, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-20-listings-crud-design.md`

**Note on testing:** No test framework exists. Verification uses `npx tsc --noEmit` (compile check) and browser smoke tests. Each task ends with a compile check before committing.

---

## Task 1: Pre-requisites — install DropdownMenu + fix service bug

**Files:**
- Modify: `src/services/properties.ts`

- [ ] **Step 1: Install the DropdownMenu shadcn component**

  Run from the project root:
  ```bash
  npx shadcn@latest add dropdown-menu
  ```
  Expected: `src/components/ui/dropdown-menu.tsx` is created. Answer any prompts with the defaults.

- [ ] **Step 2: Fix the `updateProperty` silent data-loss bug**

  Open `src/services/properties.ts`. Find `updateProperty` (around line 60). The function builds a `dbUpdates` object but is missing mappings for `beds`, `baths`, and `sqft`. Add these three lines after the existing mappings (before the `supabase.from` call):

  ```ts
  if (updates.beds  !== undefined) dbUpdates.beds  = updates.beds
  if (updates.baths !== undefined) dbUpdates.baths = updates.baths
  if (updates.sqft  !== undefined) dbUpdates.sqft  = updates.sqft
  ```

  The full `updateProperty` function should now look like:
  ```ts
  export async function updateProperty(id: string, updates: Partial<Omit<Property, 'id'>>): Promise<void> {
    const dbUpdates: Partial<RawProperty> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.location?.city !== undefined) dbUpdates.city = updates.location.city
    if (updates.location?.state !== undefined) dbUpdates.state = updates.location.state
    if (updates.price !== undefined) dbUpdates.price = updates.price
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl
    if (updates.beds  !== undefined) dbUpdates.beds  = updates.beds
    if (updates.baths !== undefined) dbUpdates.baths = updates.baths
    if (updates.sqft  !== undefined) dbUpdates.sqft  = updates.sqft
    const { error } = await supabase.from('properties').update(dbUpdates).eq('id', id)
    if (error) throw new Error(error.message)
  }
  ```

- [ ] **Step 3: Compile check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/services/properties.ts src/components/ui/dropdown-menu.tsx
  git commit -m "feat: install dropdown-menu + fix updateProperty missing beds/baths/sqft"
  ```

---

## Task 2: Create `DeleteConfirmDialog`

**Files:**
- Create: `src/components/listings/DeleteConfirmDialog.tsx`

- [ ] **Step 1: Create the directory and component file**

  Create `src/components/listings/DeleteConfirmDialog.tsx` with this content:

  ```tsx
  import { useEffect, useState } from 'react'
  import { Loader2 } from 'lucide-react'
  import { Button } from '@/components/ui/button'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog'
  import type { Property } from '@/types'

  interface DeleteConfirmDialogProps {
    property: Property | null
    onConfirm: () => Promise<void>
    onCancel: () => void
  }

  export function DeleteConfirmDialog({ property, onConfirm, onCancel }: DeleteConfirmDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Reset stale state each time a new property is targeted for deletion
    useEffect(() => {
      if (property) {
        setError(null)
        setLoading(false)
      }
    }, [property])

    async function handleConfirm() {
      setLoading(true)
      try {
        await onConfirm()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    return (
      <Dialog open={!!property} onOpenChange={(v) => { if (!v) onCancel() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{property?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
  ```

- [ ] **Step 2: Compile check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/listings/DeleteConfirmDialog.tsx
  git commit -m "feat: add DeleteConfirmDialog component"
  ```

---

## Task 3: Create `PropertyDrawer`

**Files:**
- Create: `src/components/listings/PropertyDrawer.tsx`

- [ ] **Step 1: Create the component file**

  Create `src/components/listings/PropertyDrawer.tsx` with this content:

  ```tsx
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
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
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
  ```

- [ ] **Step 2: Compile check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/listings/PropertyDrawer.tsx
  git commit -m "feat: add PropertyDrawer component"
  ```

---

## Task 4: Wire `ListingsPage`

**Files:**
- Modify: `src/pages/ListingsPage.tsx`

Replace the entire contents of `src/pages/ListingsPage.tsx` with:

- [ ] **Step 1: Replace `src/pages/ListingsPage.tsx`**

  ```tsx
  import { useState } from 'react'
  import { MapPin, BedDouble, Bath, Square, Search, SlidersHorizontal, MoreHorizontal } from 'lucide-react'
  import { useProperties } from '@/hooks/useProperties'
  import { Card, CardContent } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
  import { PropertyDrawer } from '@/components/listings/PropertyDrawer'
  import { DeleteConfirmDialog } from '@/components/listings/DeleteConfirmDialog'
  import type { Property } from '@/types'

  const STATUS_STYLES: Record<Property['status'], string> = {
    available: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-950',
    sold: 'bg-muted text-muted-foreground hover:bg-muted',
    pending: 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-950',
  }

  export function ListingsPage() {
    const { properties, loading, error, createProperty, updateProperty, deleteProperty } = useProperties()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editingProperty, setEditingProperty] = useState<Property | null>(null)
    const [deletingProperty, setDeletingProperty] = useState<Property | null>(null)

    function handleDrawerClose() {
      setDrawerOpen(false)
      setEditingProperty(null)
    }

    async function handleSave(id: string | null, data: Omit<Property, 'id'>) {
      if (id === null) {
        await createProperty(data)
      } else {
        await updateProperty(id, data)
      }
      handleDrawerClose()
    }

    async function handleDelete() {
      if (!deletingProperty) return
      await deleteProperty(deletingProperty.id)
      setDeletingProperty(null)
    }

    if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading listings…</div>
    if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

    const filtered = properties.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.location.city.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchStatus
    })

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Listings</h1>
            <p className="text-sm text-muted-foreground">{properties.length} total properties</p>
          </div>
          <Button size="sm" onClick={() => { setEditingProperty(null); setDrawerOpen(true) }}>
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
            <Card key={property.id} className="overflow-hidden hover:border-border transition-colors group">
              <div className="relative h-48 overflow-hidden -mt-4">
                <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <Badge className={`absolute bottom-3 left-3 capitalize ${STATUS_STYLES[property.status]}`}>{property.status}</Badge>
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
                    <DropdownMenuItem onClick={() => { setEditingProperty(property); setDrawerOpen(true) }}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeletingProperty(property)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-foreground">{property.name}</h3>
                  <span className="font-bold text-foreground whitespace-nowrap">${property.price.toLocaleString()}<span className="text-xs text-muted-foreground">/mo</span></span>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{property.location.city}, {property.location.state}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{property.beds}</span>
                  <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.baths}</span>
                  <span className="flex items-center gap-1"><Square className="h-3.5 w-3.5" />{property.sqft.toLocaleString()} sqft</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <PropertyDrawer
          open={drawerOpen}
          onClose={handleDrawerClose}
          property={editingProperty}
          onSave={handleSave}
        />
        <DeleteConfirmDialog
          property={deletingProperty}
          onConfirm={handleDelete}
          onCancel={() => setDeletingProperty(null)}
        />
      </div>
    )
  }
  ```

- [ ] **Step 2: Compile check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

- [ ] **Step 3: Browser smoke test**

  Start the dev server (`npm run dev`) and verify:
  - [ ] Listings page loads and shows the property grid
  - [ ] Each card has a `⋯` button in the top-right of the image
  - [ ] `+ Add Listing` opens the drawer with a blank form titled "Add Listing"
  - [ ] Filling out the form and saving adds a new card to the grid (and persists after page refresh)
  - [ ] Clicking `⋯` → Edit opens the drawer pre-filled with that property's data, titled "Edit Listing"
  - [ ] Editing and saving updates the card immediately (and persists after page refresh); beds/baths/sqft values are preserved
  - [ ] Clicking `⋯` → Delete opens the confirmation dialog naming the property
  - [ ] Confirming delete removes the card from the grid (and is gone after page refresh)
  - [ ] Cancelling delete (Cancel button, X button, Escape key) closes the dialog without deleting
  - [ ] Closing the drawer (Cancel button, X button, Escape key) clears the form — reopening via `+ Add Listing` shows a blank form

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/ListingsPage.tsx
  git commit -m "feat: wire Listings page with Add, Edit, Delete via drawer and kebab menu"
  ```
