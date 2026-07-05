# Agents Page CRUD — Design Spec
**Date:** 2026-03-30
**Project:** databrain-dark

---

## Overview

Add full CRUD (Create, Read, Update, Delete) to the Agents page. All mutation operations (add, edit, delete) are gated behind the existing `isAdmin` role (`agentRecord.role === 'admin'`). Creating and deleting agents requires Supabase Edge Functions because they must use the service-role key to manage Supabase Auth users.

---

## Auth Gating

- All read (listing) is visible to every authenticated user.
- "Add New Agent" button: rendered only when `isAdmin === true`.
- Kebab menu (Edit / Delete) on each card: rendered only when `isAdmin === true`.
- Non-admin users see cards in read-only mode with Call/Email buttons only (existing behavior).

---

## Edge Functions

### `create-agent`
**Trigger:** POST from `createAgent()` service
**Input (JSON body):**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "specialty": "string",
  "status": "active | inactive",
  "role": "agent | admin",
  "avatar_url": "string (optional)"
}
```
**Logic:**
1. Use `supabase.auth.admin.createUser({ email, password: <random uuid>, email_confirm: true })` to create the auth user.
2. Insert a row into the `agents` table with the new `user_id`.
3. Return the created agent row (transformed to camelCase).

**Output:** Created `Agent` object (camelCase).

---

### `delete-agent`
**Trigger:** POST from `deleteAgent()` service
**Input (JSON body):**
```json
{ "agentId": "string" }
```
**Logic:**
1. Fetch the `agents` row to get `user_id`.
2. Call `supabase.auth.admin.deleteUser(user_id)` to remove the auth account.
3. Delete the `agents` row by `id`.

**Output:** `{ success: true }` or error.

---

## Service Layer (`src/services/agents.ts`)

Add two functions:

- `createAgent(data)` — calls `/functions/v1/create-agent` with agent data, returns created `Agent`
- `deleteAgent(id)` — calls `/functions/v1/delete-agent` with `{ agentId: id }`

Existing `updateAgent(id, updates)` is unchanged (updates `agents` table directly, no auth changes needed).

---

## Hook (`src/hooks/useAgents.ts`)

Extend to expose:
- `createAgent(data)` — calls service, optimistically appends to local state
- `deleteAgent(id)` — calls service, removes from local state

---

## New Components

### `src/components/agents/AgentDrawer.tsx`
Sheet drawer, mirrors `PropertyDrawer` pattern.

**Props:**
```ts
{
  open: boolean
  onClose: () => void
  agent: Agent | null   // null = Add mode, non-null = Edit mode
  onSave: (id: string | null, data: AgentFormData) => Promise<void>
}
```

**Form fields:** name, email (disabled in edit mode), phone, specialty, status (select), role (select), avatar_url (optional)

**Behavior:**
- Pre-fills fields in Edit mode
- Clears fields in Add mode
- Blocks close via Escape/overlay while saving (same pattern as `PropertyDrawer`)
- Shows inline error on failure

---

### `src/components/agents/DeleteAgentDialog.tsx`
Confirm dialog, mirrors `DeleteConfirmDialog` pattern.

**Props:**
```ts
{
  agent: Agent | null
  onConfirm: () => Promise<void>
  onCancel: () => void
}
```

**Behavior:**
- Blocks close while deleting in flight
- Shows agent name in confirmation message
- Shows inline error on failure

---

## Page (`src/pages/AgentsPage.tsx`)

**UI changes:**
- Replace "Invite Agent" button with "+ Add New Agent" (admin-only, opens drawer in Add mode)
- Add kebab `DropdownMenu` on each card (admin-only): **Edit** → opens drawer in Edit mode, **Delete** → opens delete dialog
- Wire `AgentDrawer` and `DeleteAgentDialog` with state: `drawerOpen`, `editingAgent`, `deletingAgent`

**Handler logic:**
```
handleSave(id, data):
  if id === null → createAgent(data)
  else           → updateAgent(id, data)
  close drawer

handleDelete():
  deleteAgent(deletingAgent.id)
  close dialog
```

---

## Agent Form Data Type

```ts
interface AgentFormData {
  name: string
  email: string
  phone: string
  specialty: string
  status: 'active' | 'inactive'
  role: 'agent' | 'admin'
  avatarUrl: string
}
```

---

## Error Handling

- All errors surface as inline messages inside the drawer/dialog (same as Listings pattern).
- Edge Function errors are forwarded as readable messages.
- On network error, drawer/dialog remains open so the user can retry.

---

## Out of Scope

- Password reset / "send invite email" flow (future feature)
- Editing an agent's email (disabled in edit mode to avoid auth/DB mismatch)
- Avatar image upload (URL input only, matching existing pattern)
