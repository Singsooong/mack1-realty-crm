# Supabase Integration Design

**Date:** 2026-03-20
**Project:** DataBrain Dark — Real Estate CRM
**Status:** Approved — codebase is currently in pre-Step-0 state (types, mock-data, and callsites not yet migrated)

---

## Overview

Integrate Supabase as the backend for the existing React + Vite + TypeScript CRM frontend. Replace all static mock data with live Supabase database calls, add per-agent authentication with role-based access control, and enforce data visibility rules at the database level using Row Level Security (RLS).

---

## Goals

- Replace mock-data.ts arrays with real Supabase database queries
- Add email/password authentication for agents and admins
- Agents see only their assigned leads, tasks, and calendar events
- Properties and contacts are visible to all authenticated users
- Dashboard stat cards and charts remain static (not computed from DB)
- ESign/Documents page is out of scope for this phase

---

## Step 0: Type and Callsite Migration (Must Happen First)

Before any service or hook code is written, the following changes must be made in a single commit to keep the codebase compiling. The types, mock-data, and all component callsites must be updated atomically — updating types alone will break mock-data; updating types and mock-data together will then break the pages. All three layers must be updated together.

**Mock-data transition strategy:** Update `src/lib/mock-data.ts` entries to match the new type shapes (replacing `assignedTo` with `assignedAgentId` + `assignedAgentName`, adding `attendeeIds` to events). The mock-data arrays continue to be used until each page's hook is wired to Supabase, at which point the mock-data import for that entity is removed.

### Component callsites that must be updated simultaneously

| File | Line | Old field | New field |
|---|---|---|---|
| `src/pages/LeadsPage.tsx` | 62 | `lead.assignedTo` | `lead.assignedAgentName` |
| `src/pages/TasksPage.tsx` | 62 | `task.assignedTo` | `task.assignedAgentName` |
| `src/pages/CalendarPage.tsx` | 60 | `event.attendees.join(', ')` | no change — `attendees: string[]` is kept for display |

### TypeScript Type Updates Required

Before any service code is written, the following changes must be made to `src/types/index.ts`:

### 1. Add `role` to `Agent`
```ts
export interface Agent {
  // ... existing fields ...
  role: 'admin' | 'agent'
}
```

### 2. Update `Lead.assignedTo` → `assignedAgentId` + `assignedAgentName`
The mock data stored agent names as strings. Supabase stores agent UUIDs. The service layer will join the agents table and return both:
```ts
export interface Lead {
  // ... existing fields (remove assignedTo) ...
  assignedAgentId: string   // uuid FK to agents
  assignedAgentName: string // resolved via join for display
}
```

### 3. Update `Task.assignedTo` → `assignedAgentId` + `assignedAgentName`
Same pattern as Lead:
```ts
export interface Task {
  // ... existing fields (remove assignedTo) ...
  assignedAgentId: string
  assignedAgentName: string
}
```

### 4. Update `CalendarEvent.attendees`
Mock data stored attendee names. Supabase stores agent UUIDs. The service layer resolves names:
```ts
export interface CalendarEvent {
  // ... existing fields ...
  attendeeIds: string[]    // uuid[] from DB
  attendees: string[]      // resolved names for display (kept for UI compatibility)
}
```

### 5. Keep `Property.location` as nested object
The DB stores flat `city` / `state` columns. The service layer reconstructs the nested shape:
```ts
// DB columns: city, state
// Service maps to: { location: { city, state } }
// No type change needed — Property type stays as-is
```

### 6. Date format
Supabase returns PostgreSQL `date` columns as ISO strings (`"2026-03-20"`). All `string` date fields in existing types are compatible. No format changes needed.

---

## Database Schema

### `agents`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | `gen_random_uuid()` default |
| user_id | uuid (nullable) | FK → auth.users.id; null until agent creates account |
| name | text | |
| email | text | |
| phone | text | |
| avatar_url | text | |
| specialty | text | |
| listings | integer | default 0 |
| sales | integer | default 0 |
| revenue | text | |
| rating | numeric | |
| status | text | `'active' \| 'inactive'` |
| role | text | `'admin' \| 'agent'` |

### `properties`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| city | text | Flat — service maps to `location.city` |
| state | text | Flat — service maps to `location.state` |
| price | numeric | |
| beds | integer | |
| baths | integer | |
| sqft | integer | |
| image_url | text | |
| status | text | `'available' \| 'sold' \| 'pending'` |

### `contacts`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| email | text | |
| phone | text | |
| avatar_url | text | |
| type | text | `'buyer' \| 'seller' \| 'investor'` |
| status | text | `'active' \| 'inactive'` |
| last_contact | date | Returns ISO string from Supabase |

### `leads`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| email | text | |
| phone | text | |
| property_interest | text | Maps to `propertyInterest` in TS |
| message | text | |
| status | text | `'new' \| 'contacted' \| 'qualified' \| 'converted' \| 'lost'` |
| assigned_agent_id | uuid | FK → agents.id |
| date | date | |

### `tasks`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| title | text | |
| description | text | |
| category | text | `'follow-up' \| 'inspection' \| 'paperwork' \| 'showing' \| 'other'` |
| priority | text | `'low' \| 'medium' \| 'high'` |
| completed | boolean | default false |
| due_date | date | Maps to `dueDate` in TS |
| assigned_agent_id | uuid | FK → agents.id |

### `calendar_events`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| title | text | |
| date | date | |
| time | text | e.g. `"10:00 AM"` |
| type | text | `'showing' \| 'meeting' \| 'inspection' \| 'closing'` |
| location | text | |
| agent_attendees | uuid[] | Array of agents.id; used for RLS filtering |

---

## camelCase ↔ snake_case Mapping Strategy

Supabase returns snake_case column names. The existing TypeScript types use camelCase. Each service file is responsible for transforming the raw Supabase row into the TypeScript type. No automatic mapping — explicit transform functions only.

Example pattern:
```ts
// services/leads.ts
function transformLead(row: SupabaseLead): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    propertyInterest: row.property_interest,
    message: row.message,
    status: row.status,
    assignedAgentId: row.assigned_agent_id,
    assignedAgentName: row.agents?.name ?? '',
    date: row.date,
  }
}
```

All services must follow this pattern. Never expose raw Supabase row objects to hooks or components.

---

## Row Level Security (RLS)

All tables have RLS enabled. All policies require the user to be authenticated.

### Helper function
```sql
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM agents WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

**Note:** If the authenticated user has no matching agent row, `get_my_role()` returns `NULL`. All `= 'admin'` checks will evaluate to false, and all agent-specific filters will return no rows. This is intentional — a user with no agent record gets access to nothing until an admin links their account. No special error handling is needed at the DB level.

### `properties` and `contacts`
- **SELECT:** Any authenticated user (`auth.uid() IS NOT NULL`)
- **INSERT / UPDATE / DELETE:** `get_my_role() = 'admin'`

### `agents`
- **SELECT:** Any authenticated user (needed for assignment dropdowns and name resolution)
- **INSERT / UPDATE / DELETE:** `get_my_role() = 'admin'`

### `leads`
- **SELECT (admin):** `get_my_role() = 'admin'`
- **SELECT (agent):** `assigned_agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())`
- **INSERT:** `get_my_role() = 'admin'`
- **UPDATE:** `get_my_role() = 'admin'` OR `assigned_agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())`
- **DELETE:** `get_my_role() = 'admin'`

### `tasks`
- Same pattern as `leads`

### `calendar_events`
- **SELECT (admin):** `get_my_role() = 'admin'`
- **SELECT (agent):** `(SELECT id FROM agents WHERE user_id = auth.uid()) = ANY(agent_attendees)`
- **INSERT / UPDATE / DELETE:** `get_my_role() = 'admin'`

---

## File Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client singleton
├── services/                    # NEW — entity-specific DB functions + transforms
│   ├── agents.ts
│   ├── properties.ts
│   ├── contacts.ts
│   ├── leads.ts
│   ├── tasks.ts
│   └── events.ts
├── hooks/                       # NEW — React hooks wrapping services
│   ├── useAuth.ts               # re-exports useContext(AuthContext) for convenience
│   ├── useAgents.ts
│   ├── useProperties.ts
│   ├── useContacts.ts
│   ├── useLeads.ts
│   ├── useTasks.ts
│   └── useEvents.ts
├── context/
│   └── AuthContext.tsx          # NEW — provides auth state globally
└── pages/
    └── LoginPage.tsx            # NEW — email/password sign in
```

---

## Service Layer — Required Functions

Each service exports only async functions (no React). All return typed domain objects, never raw Supabase rows.

### `agents.ts`
- `fetchAgents(): Promise<Agent[]>`
- `updateAgent(id: string, updates: Partial<Agent>): Promise<void>`

### `properties.ts`
- `fetchProperties(): Promise<Property[]>`
- `createProperty(data: Omit<Property, 'id'>): Promise<Property>`
- `updateProperty(id: string, updates: Partial<Property>): Promise<void>`
- `deleteProperty(id: string): Promise<void>`

### `contacts.ts`
- `fetchContacts(): Promise<Contact[]>`
- `createContact(data: Omit<Contact, 'id'>): Promise<Contact>`
- `updateContact(id: string, updates: Partial<Contact>): Promise<void>`
- `deleteContact(id: string): Promise<void>`

### `leads.ts`
- `fetchLeads(): Promise<Lead[]>` — joins agents for `assignedAgentName`
- `createLead(data: Omit<Lead, 'id' | 'assignedAgentName'>): Promise<Lead>`
- `updateLeadStatus(id: string, status: Lead['status']): Promise<void>`
- `reassignLead(id: string, agentId: string): Promise<void>` — admin only

### `tasks.ts`
- `fetchTasks(): Promise<Task[]>` — joins agents for `assignedAgentName`
- `createTask(data: Omit<Task, 'id' | 'assignedAgentName'>): Promise<Task>`
- `toggleTaskComplete(id: string, completed: boolean): Promise<void>`
- `updateTask(id: string, updates: Partial<Task>): Promise<void>`

### `events.ts`
- `fetchEvents(): Promise<CalendarEvent[]>` — joins agents to resolve `attendees` names
- `createEvent(data: Omit<CalendarEvent, 'id' | 'attendees'>): Promise<CalendarEvent>` — caller provides `attendeeIds: string[]` (already on CalendarEvent type); service resolves `attendees` names
- `updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<void>`
- `deleteEvent(id: string): Promise<void>`

---

## Auth Flow

### `src/lib/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### `AuthContext` state shape
```ts
interface AuthContextValue {
  user: User | null          // Supabase Auth user
  agentRecord: Agent | null  // Row from agents table (includes role)
  isAdmin: boolean
  authLoading: boolean       // true while session/agent is being resolved
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}
```

### Initialization sequence
1. On mount, call `supabase.auth.getSession()` — set `authLoading = true`
2. If session exists, fetch agent row WHERE `user_id = session.user.id`
3. If no agent row found → set `user = session.user`, `agentRecord = null`, `isAdmin = false` — user sees an "Account not configured" error page (not a crash)
4. Set `authLoading = false`
5. Subscribe to `supabase.auth.onAuthStateChange` for sign-in / sign-out events

### Loading state handling
While `authLoading = true`, the router guard renders a full-page spinner (not a redirect). This prevents the login page flash on refresh.

### Sign-in flow
```
LoginPage → signIn(email, password)
  → supabase.auth.signInWithPassword()
  → on success: AuthContext fetches agent row, sets state
  → on error: returns { error: 'Invalid credentials' } → shown in LoginPage
```

---

## Route Guard

The project uses a custom state-based router (not React Router). The routing tree is:

```
App.tsx
  └── RouterProvider (src/lib/router.tsx — manages `page` state)
        └── AppLayout
              └── PageRouter (src/components/shared/PageRouter.tsx — renders active page)
```

`PageRouter` switches on `page` state to render each page component. The guard wraps at the `App.tsx` level, replacing the current structure with:

```tsx
// App.tsx (updated)
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>          {/* new — wraps everything */}
        <RouterProvider>
          <ProtectedRoute>    {/* new — guards the whole app */}
            <AppLayout>
              <PageRouter />
            </AppLayout>
          </ProtectedRoute>
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

`ProtectedRoute` is a component in `src/context/AuthContext.tsx` (co-located with the provider). Its behavior:
- If `authLoading`: render full-page centered spinner
- If `!user`: render `<LoginPage />` directly (no URL redirect — compatible with the state-based router)
- If `user && !agentRecord`: render an "Account not configured" error screen
- Otherwise: render children

---

## Environment Variables

```
# .env (never committed)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Verify `.gitignore` contains `.env` before adding credentials. Vite's default scaffold includes this, but confirm before proceeding.

---

## Out of Scope (This Phase)

- ESign / Documents page (no file storage)
- Dashboard stat cards and charts (remain static)
- Realtime subscriptions
- Password reset / invite flows
- Avatar/image upload
