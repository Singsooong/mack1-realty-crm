# Supabase Integration Design

**Date:** 2026-03-20
**Project:** DataBrain Dark — Real Estate CRM
**Status:** Approved

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

## Database Schema

### `agents`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid | FK → auth.users.id (nullable until account created) |
| name | text | |
| email | text | |
| phone | text | |
| avatar_url | text | |
| specialty | text | |
| listings | integer | |
| sales | integer | |
| revenue | text | |
| rating | numeric | |
| status | text | `'active' \| 'inactive'` |
| role | text | `'admin' \| 'agent'` |

### `properties`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| city | text | |
| state | text | |
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
| last_contact | date | |

### `leads`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| email | text | |
| phone | text | |
| property_interest | text | |
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
| completed | boolean | |
| due_date | date | |
| assigned_agent_id | uuid | FK → agents.id |

### `calendar_events`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| title | text | |
| date | date | |
| time | text | |
| type | text | `'showing' \| 'meeting' \| 'inspection' \| 'closing'` |
| location | text | |
| agent_attendees | uuid[] | Array of agents.id values |

---

## Row Level Security (RLS)

All tables have RLS enabled. All policies require `auth.uid() IS NOT NULL` (authenticated users only).

### Helper function
```sql
-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM agents WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

### `properties` and `contacts`
- **SELECT:** Any authenticated user
- **INSERT / UPDATE / DELETE:** Only admins (`get_my_role() = 'admin'`)

### `agents`
- **SELECT:** Any authenticated user (agents need to see each other for assignment dropdowns)
- **INSERT / UPDATE / DELETE:** Only admins

### `leads`
- **SELECT (admin):** `get_my_role() = 'admin'`
- **SELECT (agent):** `assigned_agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())`
- **INSERT:** Admins only
- **UPDATE:** Admins or the assigned agent (status updates)
- **DELETE:** Admins only

### `tasks`
- Same pattern as `leads` — agents see/update only their assigned tasks

### `calendar_events`
- **SELECT (admin):** All rows
- **SELECT (agent):** Rows where `(SELECT id FROM agents WHERE user_id = auth.uid()) = ANY(agent_attendees)`
- **INSERT / UPDATE / DELETE:** Admins only

---

## File Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client singleton
├── services/                    # NEW — entity-specific DB functions
│   ├── agents.ts
│   ├── properties.ts
│   ├── contacts.ts
│   ├── leads.ts
│   ├── tasks.ts
│   └── events.ts
├── hooks/                       # NEW — React hooks wrapping services
│   ├── useAuth.ts               # user, role, isAdmin, signIn, signOut
│   ├── useAgents.ts
│   ├── useProperties.ts
│   ├── useContacts.ts
│   ├── useLeads.ts
│   ├── useTasks.ts
│   └── useEvents.ts
├── context/
│   └── AuthContext.tsx          # NEW — provides auth state to all pages
└── pages/
    └── LoginPage.tsx            # NEW — email/password sign in
```

---

## Architecture: Service Layer + React Hooks

Each service file exports plain async functions (no React dependencies):

```ts
// src/services/leads.ts
export async function fetchLeads(): Promise<Lead[]> { ... }
export async function updateLeadStatus(id: string, status: Lead['status']): Promise<void> { ... }
```

Each hook wraps a service with `useState` + `useEffect` for loading/error states:

```ts
// src/hooks/useLeads.ts
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // fetches on mount via services/leads.ts
  return { leads, loading, error, updateLeadStatus }
}
```

Pages replace mock-data imports with hook calls — no other UI changes needed.

---

## Auth Flow

```
LoginPage
  → supabase.auth.signInWithPassword({ email, password })
  → AuthContext: fetch agents WHERE user_id = auth.uid()
  → store { user, agentRecord, role } in context
  → redirect to Dashboard

On refresh:
  → supabase.auth.getSession() restores session automatically
  → AuthContext re-fetches agent record
```

`useAuth()` hook exposes:
- `user` — Supabase Auth user object
- `agentRecord` — row from agents table
- `role` — `'admin' | 'agent'`
- `isAdmin` — boolean shorthand
- `signIn(email, password)` — returns error if failed
- `signOut()`

---

## Role-Based UI

- `isAdmin` from `useAuth()` controls visibility of admin-only actions (reassign lead, delete contact, etc.)
- RLS is the real enforcement layer — frontend restrictions are cosmetic only
- Unauthenticated users are redirected to `LoginPage` via a route guard in `router.tsx`

---

## Environment Variables

```
# .env (never committed)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

`.env` must be listed in `.gitignore`.

---

## Out of Scope (This Phase)

- ESign / Documents page (no file storage)
- Dashboard stat cards and charts (remain static)
- Realtime subscriptions
- Password reset / invite flows
- Avatar/image upload
