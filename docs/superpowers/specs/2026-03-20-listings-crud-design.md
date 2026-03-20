# Listings CRUD — Design Spec

**Date:** 2026-03-20
**Status:** Approved

## Goal

Wire up Add, Edit, and Delete for the Listings page. The service layer and hook are already complete (`createProperty`, `updateProperty`, `deleteProperty` all exist). This spec covers only the UI layer.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Add/Edit interaction | Side drawer (Sheet) | Keeps the grid visible while editing |
| Card actions | Kebab menu (⋯) | Clean card surface, one icon |
| Image input | URL text field | Avoids Supabase Storage setup |
| Status change | Edit drawer only | No quick-toggle needed |
| Delete flow | Confirmation dialog before delete | Prevents accidental data loss |

## Pre-requisites

### 1. Install DropdownMenu (step 1 — before writing any code)

`DropdownMenu` is not yet in the project. Run this before creating any files that import it, otherwise `tsc --noEmit` will fail with a module-not-found error:

```bash
npx shadcn@latest add dropdown-menu
```

### 2. Fix service bug in `updateProperty`

`src/services/properties.ts` `updateProperty` silently ignores `beds`, `baths`, and `sqft`. Add the missing mappings:

```ts
if (updates.beds  !== undefined) dbUpdates.beds  = updates.beds
if (updates.baths !== undefined) dbUpdates.baths = updates.baths
if (updates.sqft  !== undefined) dbUpdates.sqft  = updates.sqft
```

## Component Structure

Two new files:

```
src/components/listings/
  PropertyDrawer.tsx       — Sheet-based form for Add and Edit
  DeleteConfirmDialog.tsx  — Dialog-based confirmation prompt
```

`ListingsPage.tsx` is updated to hold open/selected state and wire all handlers.

> **Note:** `src/components/dashboard/PropertyCard.tsx` is a separate component used only on the Dashboard. The kebab menu is added to the **inline card JSX inside `ListingsPage.tsx`**, not to `PropertyCard.tsx`.

## State (ListingsPage)

```ts
const [drawerOpen, setDrawerOpen]             = useState(false)
const [editingProperty, setEditingProperty]   = useState<Property | null>(null)
const [deletingProperty, setDeletingProperty] = useState<Property | null>(null)
```

- `editingProperty === null` → drawer title is "Add Listing", form is blank
- `editingProperty !== null` → drawer title is "Edit Listing", form is pre-filled
- `deletingProperty !== null` → `DeleteConfirmDialog` is open for that property

Update the `useProperties()` destructure in `ListingsPage` to include the mutation functions:
```ts
const { properties, loading, error, createProperty, updateProperty, deleteProperty } = useProperties()
```

Flows:
- **Add:** `+ Add Listing` button → `setEditingProperty(null); setDrawerOpen(true)`
- **Edit:** kebab "Edit" → `setEditingProperty(property); setDrawerOpen(true)`
- **Delete:** kebab "Delete" → `setDeletingProperty(property)`
- **Save (add):** `ListingsPage` calls `hook.createProperty(data)`, then `handleDrawerClose()`
- **Save (edit):** `ListingsPage` calls `hook.updateProperty(editingProperty.id, data)`, then `handleDrawerClose()`
- **Confirm delete:** `ListingsPage` calls `hook.deleteProperty(deletingProperty.id)`, then `setDeletingProperty(null)`
- **Drawer close (any path):** use a shared `handleDrawerClose` that clears both `drawerOpen` and `editingProperty`:
  ```ts
  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditingProperty(null)
  }
  ```
  Pass `handleDrawerClose` as the `onClose` prop to `PropertyDrawer` and use it wherever the drawer is dismissed. This ensures re-opening the drawer for Add always starts blank regardless of previous state.

> **Hook mutation state:** `useProperties` exposes no per-mutation `loading` or `error` — only the initial fetch has those. `PropertyDrawer` and `DeleteConfirmDialog` each manage their own `loading` and `error` state locally via `useState`. Mutation functions throw on failure, so wrap with `try/catch`.

## PropertyDrawer

**Props:**
```ts
interface PropertyDrawerProps {
  open: boolean
  onClose: () => void
  property: Property | null        // null = Add mode
  onSave: (id: string | null, data: Omit<Property, 'id'>) => Promise<void>
  // id is null for Add, property.id for Edit
}
```

`ListingsPage` wires `onSave` to branch on `id`:
```ts
async function handleSave(id: string | null, data: Omit<Property, 'id'>) {
  if (id === null) {
    await createProperty(data)
  } else {
    await updateProperty(id, data)
  }
  setDrawerOpen(false)
}
```

**Form fields** (all controlled `useState`, reset when drawer opens):

| Field | Type | Validation |
|---|---|---|
| Name | text input | required |
| City | text input | required |
| State | text input | required |
| Price | number input | required, > 0 |
| Beds | number input | required, integer ≥ 0 |
| Baths | number input | required, integer ≥ 0 |
| Sqft | number input | required, integer > 0 |
| Image URL | text input | required |
| Status | Select | available / pending / sold |

City and State are flat form fields. Before calling `onSave`, the drawer assembles the nested `location` object:
```ts
onSave(property?.id ?? null, {
  name, price, beds, baths, sqft, imageUrl, status,
  location: { city, state },
})
```
Always pass a full `location` object (not partial) — the hook's optimistic update spreads the whole `updates` object.

**Behaviour:**
- Uses shadcn `Sheet`. Wire `onOpenChange` to call `onClose` so the built-in X button and Escape key close correctly:
  ```tsx
  <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
  ```
- Save button shows loading spinner (`disabled` + spinner icon) while async call is in flight
- On error, shows a small red error message below the Save button
- On success, calls `onClose()`
- Error state (`useState<string | null>(null)`) and loading state (`useState(false)`) are managed inside the drawer
- Error catch must handle TypeScript strict mode (`unknown` catch binding):
  ```ts
  } catch (e) {
    setError(e instanceof Error ? e.message : 'An unexpected error occurred')
  } finally {
    setLoading(false)
  }
  ```
- Form resets via `useEffect` with `if (open)` guard — fires when the sheet opens, pre-filling from `property` or blanking for Add:
  ```ts
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
  ```

## DeleteConfirmDialog

**Props:**
```ts
interface DeleteConfirmDialogProps {
  property: Property | null
  onConfirm: () => Promise<void>
  onCancel: () => void
}
```

**Internal state:**
```ts
const [loading, setLoading] = useState(false)
const [error, setError]     = useState<string | null>(null)
```

Reset `error` and `loading` when the dialog opens to prevent stale state from a previous failed attempt:
```ts
useEffect(() => {
  if (property) {
    setError(null)
    setLoading(false)
  }
}, [property])
```

**Behaviour:**
- Uses shadcn `Dialog`. Wire `onOpenChange` to call `onCancel` so the built-in X button and Escape key work:
  ```tsx
  <Dialog open={!!property} onOpenChange={(v) => { if (!v) onCancel() }}>
  ```
- Body text: "Are you sure you want to delete **[property.name]**? This cannot be undone."
- "Cancel" button: ghost variant, calls `onCancel()`; disabled while `loading`
- "Delete" button: destructive variant; disabled while `loading`; on click:
  ```ts
  setLoading(true)
  try {
    await onConfirm()
  } catch (e) {
    setError(e instanceof Error ? e.message : 'An unexpected error occurred')
  } finally {
    setLoading(false)
  }
  ```
- On error, shows a small red message above the action buttons; buttons re-enable

## Kebab Menu (card changes)

The kebab is added to the **inline card JSX in `ListingsPage.tsx`** (not `PropertyCard.tsx`).

Place the `DropdownMenu` trigger inside the existing `relative h-48 overflow-hidden` image div, positioned `absolute top-2 right-2`:

```tsx
<div className="relative h-48 overflow-hidden -mt-4">
  <img ... />
  <Badge className="absolute bottom-3 left-3 ..." />
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/70 text-white z-10">
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
```

The trigger sits inside `overflow-hidden` but its 7×7 button is within the 192px image bounds. Radix portals `DropdownMenuContent` to `document.body` by default, so the dropdown menu items are not clipped by `overflow-hidden`.

## Shadcn Components Used

| Component | Already installed | Used for |
|---|---|---|
| `Sheet` | ✅ | PropertyDrawer |
| `Dialog` | ✅ | DeleteConfirmDialog |
| `DropdownMenu` | ❌ needs install | Kebab menu on card |
| `Input`, `Select`, `Button` | ✅ | Drawer form fields |

## Files Changed

| File | Action |
|---|---|
| `src/services/properties.ts` | Fix: add `beds`, `baths`, `sqft` to `updateProperty` |
| `src/components/listings/PropertyDrawer.tsx` | Create |
| `src/components/listings/DeleteConfirmDialog.tsx` | Create |
| `src/pages/ListingsPage.tsx` | Modify (state + kebab + wire handlers) |
