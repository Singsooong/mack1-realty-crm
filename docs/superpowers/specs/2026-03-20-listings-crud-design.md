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

## Component Structure

Two new files:

```
src/components/listings/
  PropertyDrawer.tsx       — Sheet-based form for Add and Edit
  DeleteConfirmDialog.tsx  — Dialog-based confirmation prompt
```

`ListingsPage.tsx` is updated to hold open/selected state and wire all handlers. No changes to `src/hooks/useProperties.ts` or `src/services/properties.ts`.

## State (ListingsPage)

```ts
const [drawerOpen, setDrawerOpen]             = useState(false)
const [editingProperty, setEditingProperty]   = useState<Property | null>(null)
const [deletingProperty, setDeletingProperty] = useState<Property | null>(null)
```

- `editingProperty === null` → drawer title is "Add Listing", form is blank
- `editingProperty !== null` → drawer title is "Edit Listing", form is pre-filled
- `deletingProperty !== null` → `DeleteConfirmDialog` is open for that property

Flows:
- **Add:** `+ Add Listing` button → `setEditingProperty(null); setDrawerOpen(true)`
- **Edit:** kebab "Edit" → `setEditingProperty(property); setDrawerOpen(true)`
- **Delete:** kebab "Delete" → `setDeletingProperty(property)`
- **Save:** calls `createProperty` or `updateProperty` from hook, then `onClose()`
- **Confirm delete:** calls `deleteProperty` from hook, then `setDeletingProperty(null)`

## PropertyDrawer

**Props:**
```ts
interface PropertyDrawerProps {
  open: boolean
  onClose: () => void
  property: Property | null        // null = Add mode
  onSave: (data: Omit<Property, 'id'>) => Promise<void>
}
```

**Form fields** (all controlled `useState`, reset on open):

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

**Behaviour:**
- Uses shadcn `Sheet` with `side="right"`
- Save button shows loading spinner (`disabled` + spinner icon) while async call is in flight
- On error, shows a small red error message below the Save button
- On success, calls `onClose()`
- Form state is reset via `useEffect` watching `property` and `open`

## DeleteConfirmDialog

**Props:**
```ts
interface DeleteConfirmDialogProps {
  property: Property | null
  onConfirm: () => Promise<void>
  onCancel: () => void
}
```

**Behaviour:**
- Uses shadcn `Dialog`, `open={!!property}`
- Body text: "Are you sure you want to delete **[property.name]**? This cannot be undone."
- "Cancel" button: ghost variant, calls `onCancel()`
- "Delete" button: destructive variant, calls `onConfirm()`
- Both buttons disabled while delete is in flight

## Kebab Menu (card changes)

Each property card gets a `DropdownMenu` (shadcn) in the top-right of the image area:

- Trigger: `MoreHorizontal` icon button, always visible (not hover-only)
- **Edit** item → `setEditingProperty(property); setDrawerOpen(true)`
- **Delete** item → `setDeletingProperty(property)` (destructive text color)

The rest of the card layout is unchanged.

## Shadcn Components Used

| Component | Already installed | Used for |
|---|---|---|
| `Sheet` | ✅ | PropertyDrawer |
| `Dialog` | ✅ | DeleteConfirmDialog |
| `DropdownMenu` | needs install | Kebab menu on card |
| `Input`, `Select`, `Button` | ✅ | Drawer form fields |

`DropdownMenu` is the only component that needs to be added via `npx shadcn@latest add dropdown-menu`.

## Files Changed

| File | Action |
|---|---|
| `src/components/listings/PropertyDrawer.tsx` | Create |
| `src/components/listings/DeleteConfirmDialog.tsx` | Create |
| `src/pages/ListingsPage.tsx` | Modify (state + kebab + wire handlers) |
