# Supabase Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all static mock data with Supabase PostgreSQL, add email/password auth with per-agent RLS, and wire all CRM pages to live data.

**Architecture:** Service layer (`src/services/`) holds all Supabase queries and camelCase transforms. React hooks (`src/hooks/`) wrap services with useState/useEffect. Pages import hooks only — no direct Supabase calls in components. Auth lives in `src/context/AuthContext.tsx` and guards the app via a `ProtectedRoute` wrapper in `App.tsx`.

**Tech Stack:** React 19, TypeScript, Vite, `@supabase/supabase-js`, Tailwind CSS, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-20-supabase-integration-design.md`

**Note on testing:** This project has no test framework. Verification steps use `npx tsc --noEmit` (compile check) and browser smoke tests. Each task ends with a compile check before committing.

---

## Task 1: Supabase package + client + .gitignore

**Files:**
- Modify: `.gitignore`
- Create: `.env` (not committed)
- Create: `.env.example` (committed)
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Add `.env` to `.gitignore`**

  Open `.gitignore` and add at the bottom:
  ```
  .env
  .env.local
  ```
  Note: the current `.gitignore` does NOT include `.env` — this must be done before creating the file.

- [ ] **Step 2: Install the Supabase client**

  ```bash
  npm install @supabase/supabase-js
  ```

  Expected: package added to `node_modules`, `package.json` updated.

- [ ] **Step 3: Create `.env.example`**

  Create `/.env.example`:
  ```
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```

- [ ] **Step 4: Create your own `.env` file**

  Create `/.env` (this file is git-ignored):
  ```
  VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
  VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
  ```

  To get these values: go to your Supabase project → Settings → API. Copy "Project URL" and "anon public" key.

- [ ] **Step 5: Create `src/lib/supabase.ts`**

  ```ts
  import { createClient } from '@supabase/supabase-js'

  export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string
  )
  ```

- [ ] **Step 6: Compile check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 7: Commit**

  ```bash
  git add .gitignore .env.example src/lib/supabase.ts package.json package-lock.json
  git commit -m "feat: add Supabase client and package"
  ```

---

## Task 2: Step 0 — Atomic type + mock-data + callsite migration

**This entire task must be committed as a single atomic commit. Do not commit partial changes.**

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/mock-data.ts`
- Modify: `src/pages/LeadsPage.tsx` (line 62)
- Modify: `src/pages/TasksPage.tsx` (line 62)

- [ ] **Step 1: Update `src/types/index.ts`**

  Replace the `Agent`, `Lead`, `Task`, and `CalendarEvent` interfaces with the updated versions below. Leave all other interfaces unchanged.

  ```ts
  export interface Agent {
    id: string
    name: string
    email: string
    phone: string
    avatarUrl: string
    specialty: string
    listings: number
    sales: number
    revenue: string
    rating: number
    status: 'active' | 'inactive'
    role: 'admin' | 'agent'          // NEW
  }

  export interface Lead {
    id: string
    name: string
    email: string
    phone: string
    propertyInterest: string
    message: string
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
    assignedAgentId: string          // was: assignedTo: string
    assignedAgentName: string        // NEW — resolved via join
    date: string
  }

  export interface Task {
    id: string
    title: string
    description: string
    category: 'follow-up' | 'inspection' | 'paperwork' | 'showing' | 'other'
    priority: 'low' | 'medium' | 'high'
    completed: boolean
    dueDate: string
    assignedAgentId: string          // was: assignedTo: string
    assignedAgentName: string        // NEW — resolved via join
  }

  export interface CalendarEvent {
    id: string
    title: string
    date: string
    time: string
    type: 'showing' | 'meeting' | 'inspection' | 'closing'
    location: string
    attendeeIds: string[]            // NEW — uuid[] from DB
    attendees: string[]              // kept for display (names)
  }
  ```

- [ ] **Step 2: Update `src/lib/mock-data.ts` leads**

  Replace `assignedTo` with `assignedAgentId` (use `'mock-agent-id'` as placeholder) and `assignedAgentName` on every lead:

  ```ts
  export const leadsData: Lead[] = [
    { id: 'ld-1', name: 'Ryan Thompson', email: 'ryan.t@email.com', phone: '+1 (555) 101-0101', propertyInterest: '3BR For Sale, Austin TX', message: 'Looking for a family home near good schools, budget around $600k', status: 'new', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Alex Morgan', date: '2026-03-05' },
    { id: 'ld-2', name: 'Chloe Adams', email: 'chloe.a@email.com', phone: '+1 (555) 202-0202', propertyInterest: 'For Rent, Downtown', message: 'Need a 1BR apartment within 6 blocks of the metro, max $2,200/mo', status: 'contacted', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Sarah Chen', date: '2026-03-04' },
    { id: 'ld-3', name: 'Derek Wu', email: 'derek.wu@email.com', phone: '+1 (555) 303-0303', propertyInterest: 'Commercial Lease, Chicago', message: 'Looking for office space 2,000 sq ft, ground floor preferred', status: 'qualified', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Marcus Webb', date: '2026-03-03' },
    { id: 'ld-4', name: 'Tiffany Brooks', email: 'tbrooks@email.com', phone: '+1 (555) 404-0404', propertyInterest: 'For Sale, Portland OR', message: 'Buying as investment, cash buyer, closing within 30 days', status: 'converted', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Priya Nair', date: '2026-03-02' },
    { id: 'ld-5', name: 'Nathan Rivera', email: 'n.rivera@email.com', phone: '+1 (555) 505-0505', propertyInterest: 'For Lease, Miami FL', message: 'Retail space inquiry for boutique clothing store, need foot traffic', status: 'lost', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Alex Morgan', date: '2026-03-01' },
    { id: 'ld-6', name: 'Hannah Scott', email: 'h.scott@email.com', phone: '+1 (555) 606-0606', propertyInterest: '4BR For Sale, Boulder CO', message: 'Relocating from East Coast, timeline is flexible, prefer mountain views', status: 'new', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Sarah Chen', date: '2026-02-28' },
    { id: 'ld-7', name: 'Kevin Park', email: 'k.park@email.com', phone: '+1 (555) 707-0707', propertyInterest: 'Condo For Sale, Seattle WA', message: 'First-time buyer, pre-qualified $450k, wants in-unit laundry', status: 'qualified', assignedAgentId: 'mock-agent-id', assignedAgentName: 'James Okafor', date: '2026-02-27' },
    { id: 'ld-8', name: 'Brianna Lee', email: 'blee@email.com', phone: '+1 (555) 808-0808', propertyInterest: 'For Rent, Nashville TN', message: 'Pet owner, needs yard space, two large dogs', status: 'contacted', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Elena Vasquez', date: '2026-02-26' },
  ]
  ```

- [ ] **Step 3: Update `src/lib/mock-data.ts` tasks**

  Replace `assignedTo` with `assignedAgentId` + `assignedAgentName` on every task:

  ```ts
  export const tasksData: Task[] = [
    { id: 'tk-1', title: 'Follow up with Alice Thompson', description: 'Call regarding Sunset Retreat Villa offer', category: 'follow-up', priority: 'high', completed: false, dueDate: '2026-03-10', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Sarah Chen' },
    { id: 'tk-2', title: 'Schedule inspection — Lakefront Manor', description: 'Coordinate with inspector and buyer', category: 'inspection', priority: 'high', completed: false, dueDate: '2026-03-11', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Elena Vasquez' },
    { id: 'tk-3', title: 'Prepare purchase agreement', description: 'Ocean Breeze Cottage — Robert Kim', category: 'paperwork', priority: 'medium', completed: true, dueDate: '2026-03-07', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Priya Nair' },
    { id: 'tk-4', title: 'Showing — Desert Modern 2pm', description: 'Show property to Fontaine family', category: 'showing', priority: 'medium', completed: false, dueDate: '2026-03-12', assignedAgentId: 'mock-agent-id', assignedAgentName: 'James Okafor' },
    { id: 'tk-5', title: 'Submit closing docs — Mountain View', description: 'Final paperwork to escrow', category: 'paperwork', priority: 'high', completed: true, dueDate: '2026-03-06', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Marcus Webb' },
    { id: 'tk-6', title: 'Send market analysis to Ben Caldwell', description: 'Comparative market analysis for Boulder area', category: 'follow-up', priority: 'low', completed: false, dueDate: '2026-03-14', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Sarah Chen' },
    { id: 'tk-7', title: 'Update MLS listing — Riverside Haven', description: 'New photos and updated description', category: 'other', priority: 'medium', completed: false, dueDate: '2026-03-13', assignedAgentId: 'mock-agent-id', assignedAgentName: 'Tom Nakamura' },
  ]
  ```

- [ ] **Step 4: Update `src/lib/mock-data.ts` events**

  Add `attendeeIds: []` to every event (empty array — mock IDs don't exist in DB):

  ```ts
  export const eventsData: CalendarEvent[] = [
    { id: 'ev-1', title: 'Showing — Sunset Retreat', date: '2026-03-10', time: '10:00 AM', type: 'showing', location: 'Austin, TX', attendeeIds: [], attendees: ['Sarah Chen', 'Alice Thompson'] },
    { id: 'ev-2', title: 'Team Standup', date: '2026-03-10', time: '9:00 AM', type: 'meeting', location: 'Zoom', attendeeIds: [], attendees: ['All agents'] },
    { id: 'ev-3', title: 'Inspection — Lakefront Manor', date: '2026-03-11', time: '2:00 PM', type: 'inspection', location: 'Chicago, IL', attendeeIds: [], attendees: ['Elena Vasquez', 'Inspector John'] },
    { id: 'ev-4', title: 'Closing — Mountain View Villa', date: '2026-03-12', time: '11:00 AM', type: 'closing', location: 'Boulder, CO', attendeeIds: [], attendees: ['Marcus Webb', 'Buyer', 'Escrow'] },
    { id: 'ev-5', title: 'Showing — Desert Modern', date: '2026-03-12', time: '2:00 PM', type: 'showing', location: 'Scottsdale, AZ', attendeeIds: [], attendees: ['James Okafor', 'Fontaine Family'] },
    { id: 'ev-6', title: 'Quarterly Review', date: '2026-03-15', time: '3:00 PM', type: 'meeting', location: 'HQ Conference Room', attendeeIds: [], attendees: ['All agents', 'Management'] },
    { id: 'ev-7', title: 'Open House — Riverside Haven', date: '2026-03-16', time: '1:00 PM', type: 'showing', location: 'Portland, OR', attendeeIds: [], attendees: ['Tom Nakamura'] },
  ]
  ```

- [ ] **Step 5: Update `src/pages/LeadsPage.tsx` line 62**

  Change:
  ```tsx
  <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">{lead.assignedTo}</TableCell>
  ```
  To:
  ```tsx
  <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">{lead.assignedAgentName}</TableCell>
  ```

- [ ] **Step 6: Update `src/pages/TasksPage.tsx` line 62**

  Change:
  ```tsx
  <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignedTo}</span>
  ```
  To:
  ```tsx
  <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignedAgentName}</span>
  ```

- [ ] **Step 7: Compile check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: zero errors. If there are errors, fix them before committing — do NOT commit a broken build.

- [ ] **Step 8: Smoke test in browser**

  ```bash
  npm run dev
  ```

  Open http://localhost:5173. Navigate to Leads page and Tasks page. Verify agent names still display correctly. No console errors.

- [ ] **Step 9: Commit atomically**

  ```bash
  git add src/types/index.ts src/lib/mock-data.ts src/pages/LeadsPage.tsx src/pages/TasksPage.tsx
  git commit -m "refactor: atomic type migration for Supabase integration (Step 0)"
  ```

---

## Task 3: Database setup — tables, RLS, seed data

This task is done entirely in the Supabase dashboard SQL editor. No local files are created. Go to your Supabase project → SQL Editor.

- [ ] **Step 1: Create all tables**

  Run this SQL:
  ```sql
  -- Agents table
  CREATE TABLE agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL DEFAULT '',
    avatar_url text DEFAULT '',
    specialty text DEFAULT '',
    listings integer DEFAULT 0,
    sales integer DEFAULT 0,
    revenue text DEFAULT '',
    rating numeric DEFAULT 0,
    status text NOT NULL DEFAULT 'active',
    role text NOT NULL DEFAULT 'agent'
  );

  -- Properties table
  CREATE TABLE properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    price numeric NOT NULL DEFAULT 0,
    beds integer DEFAULT 0,
    baths integer DEFAULT 0,
    sqft integer DEFAULT 0,
    image_url text DEFAULT '',
    status text NOT NULL DEFAULT 'available'
  );

  -- Contacts table
  CREATE TABLE contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL DEFAULT '',
    avatar_url text DEFAULT '',
    type text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    last_contact date
  );

  -- Leads table
  CREATE TABLE leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL DEFAULT '',
    property_interest text DEFAULT '',
    message text DEFAULT '',
    status text NOT NULL DEFAULT 'new',
    assigned_agent_id uuid REFERENCES agents(id),
    date date DEFAULT CURRENT_DATE
  );

  -- Tasks table
  CREATE TABLE tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text DEFAULT '',
    category text NOT NULL DEFAULT 'other',
    priority text NOT NULL DEFAULT 'medium',
    completed boolean DEFAULT false,
    due_date date,
    assigned_agent_id uuid REFERENCES agents(id)
  );

  -- Calendar events table
  CREATE TABLE calendar_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    date date NOT NULL,
    time text NOT NULL DEFAULT '',
    type text NOT NULL,
    location text DEFAULT '',
    agent_attendees uuid[] DEFAULT '{}'
  );
  ```

- [ ] **Step 2: Enable RLS on all tables**

  ```sql
  ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
  ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
  ```

- [ ] **Step 3: Create the role helper function**

  ```sql
  CREATE OR REPLACE FUNCTION get_my_role()
  RETURNS text AS $$
    SELECT role FROM agents WHERE user_id = auth.uid()
  $$ LANGUAGE sql SECURITY DEFINER;
  ```

- [ ] **Step 4: Add RLS policies for `agents`, `properties`, `contacts`**

  ```sql
  -- agents: authenticated users can read; only admins can write
  CREATE POLICY "agents_select" ON agents FOR SELECT TO authenticated USING (true);
  CREATE POLICY "agents_insert" ON agents FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
  CREATE POLICY "agents_update" ON agents FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
  CREATE POLICY "agents_delete" ON agents FOR DELETE TO authenticated USING (get_my_role() = 'admin');

  -- properties
  CREATE POLICY "properties_select" ON properties FOR SELECT TO authenticated USING (true);
  CREATE POLICY "properties_insert" ON properties FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
  CREATE POLICY "properties_update" ON properties FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
  CREATE POLICY "properties_delete" ON properties FOR DELETE TO authenticated USING (get_my_role() = 'admin');

  -- contacts
  CREATE POLICY "contacts_select" ON contacts FOR SELECT TO authenticated USING (true);
  CREATE POLICY "contacts_insert" ON contacts FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
  CREATE POLICY "contacts_update" ON contacts FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
  CREATE POLICY "contacts_delete" ON contacts FOR DELETE TO authenticated USING (get_my_role() = 'admin');
  ```

- [ ] **Step 5: Add RLS policies for `leads` and `tasks`**

  ```sql
  -- leads: admins see all; agents see only their assigned leads
  CREATE POLICY "leads_select_admin" ON leads FOR SELECT TO authenticated USING (get_my_role() = 'admin');
  CREATE POLICY "leads_select_agent" ON leads FOR SELECT TO authenticated USING (
    assigned_agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())
  );
  CREATE POLICY "leads_insert" ON leads FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
  CREATE POLICY "leads_update" ON leads FOR UPDATE TO authenticated USING (
    get_my_role() = 'admin' OR
    assigned_agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())
  );
  CREATE POLICY "leads_delete" ON leads FOR DELETE TO authenticated USING (get_my_role() = 'admin');

  -- tasks: same pattern as leads
  CREATE POLICY "tasks_select_admin" ON tasks FOR SELECT TO authenticated USING (get_my_role() = 'admin');
  CREATE POLICY "tasks_select_agent" ON tasks FOR SELECT TO authenticated USING (
    assigned_agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())
  );
  CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
  CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING (
    get_my_role() = 'admin' OR
    assigned_agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())
  );
  CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated USING (get_my_role() = 'admin');
  ```

- [ ] **Step 6: Add RLS policies for `calendar_events`**

  ```sql
  CREATE POLICY "events_select_admin" ON calendar_events FOR SELECT TO authenticated USING (get_my_role() = 'admin');
  CREATE POLICY "events_select_agent" ON calendar_events FOR SELECT TO authenticated USING (
    (SELECT id FROM agents WHERE user_id = auth.uid()) = ANY(agent_attendees)
  );
  CREATE POLICY "events_insert" ON calendar_events FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin');
  CREATE POLICY "events_update" ON calendar_events FOR UPDATE TO authenticated USING (get_my_role() = 'admin');
  CREATE POLICY "events_delete" ON calendar_events FOR DELETE TO authenticated USING (get_my_role() = 'admin');
  ```

- [ ] **Step 7: Seed agents with fixed UUIDs**

  The agent UUIDs are fixed so that leads and tasks can reference them:
  ```sql
  INSERT INTO agents (id, name, email, phone, avatar_url, specialty, listings, sales, revenue, rating, status, role) VALUES
  ('a0000000-0000-0000-0000-000000000000', 'Alex Morgan', 'alex.morgan@mack1.io', '+1 (512) 555-0100', 'https://i.pravatar.cc/150?img=47', 'Management', 0, 0, '$0', 5.0, 'active', 'admin'),
  ('a0000000-0000-0000-0000-000000000001', 'Sarah Chen', 'sarah.chen@mack1.io', '+1 (512) 555-0101', 'https://i.pravatar.cc/150?img=47', 'Luxury Residential', 24, 18, '$2.4M', 4.9, 'active', 'agent'),
  ('a0000000-0000-0000-0000-000000000002', 'Marcus Webb', 'marcus.webb@mack1.io', '+1 (512) 555-0102', 'https://i.pravatar.cc/150?img=12', 'Commercial', 16, 11, '$5.1M', 4.7, 'active', 'agent'),
  ('a0000000-0000-0000-0000-000000000003', 'Priya Nair', 'priya.nair@mack1.io', '+1 (503) 555-0103', 'https://i.pravatar.cc/150?img=23', 'Investment', 31, 22, '$3.8M', 4.8, 'active', 'agent'),
  ('a0000000-0000-0000-0000-000000000004', 'James Okafor', 'james.okafor@mack1.io', '+1 (720) 555-0104', 'https://i.pravatar.cc/150?img=33', 'First-Time Buyers', 19, 14, '$1.9M', 4.6, 'active', 'agent'),
  ('a0000000-0000-0000-0000-000000000005', 'Elena Vasquez', 'elena.vasquez@mack1.io', '+1 (619) 555-0105', 'https://i.pravatar.cc/150?img=56', 'Coastal Properties', 28, 20, '$6.2M', 4.9, 'active', 'agent'),
  ('a0000000-0000-0000-0000-000000000006', 'Tom Nakamura', 'tom.nakamura@mack1.io', '+1 (312) 555-0106', 'https://i.pravatar.cc/150?img=68', 'Urban Condos', 12, 8, '$1.2M', 4.4, 'inactive', 'agent');
  ```

- [ ] **Step 8: Seed properties**

  ```sql
  INSERT INTO properties (name, city, state, price, beds, baths, sqft, image_url, status) VALUES
  ('Sunset Retreat Villa', 'Austin', 'Texas', 7548, 3, 2, 1400, 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=250&fit=crop', 'available'),
  ('Riverside Haven', 'Portland', 'Oregon', 1548, 4, 3, 2000, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop', 'available'),
  ('Mountain View Villa', 'Boulder', 'Colorado', 2048, 2, 2, 1400, 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&h=250&fit=crop', 'sold'),
  ('Ocean Breeze Cottage', 'San Diego', 'California', 6948, 2, 1, 1200, 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&h=250&fit=crop', 'available'),
  ('Lakefront Manor', 'Chicago', 'Illinois', 12500, 5, 4, 3800, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop', 'pending'),
  ('Desert Modern', 'Scottsdale', 'Arizona', 4200, 3, 2, 2100, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=250&fit=crop', 'available');
  ```

- [ ] **Step 9: Seed contacts**

  ```sql
  INSERT INTO contacts (name, email, phone, avatar_url, type, status, last_contact) VALUES
  ('Alice Thompson', 'alice@example.com', '+1 (512) 555-2001', 'https://i.pravatar.cc/150?img=1', 'buyer', 'active', '2026-03-07'),
  ('Robert Kim', 'robert.kim@example.com', '+1 (415) 555-2002', 'https://i.pravatar.cc/150?img=3', 'investor', 'active', '2026-03-05'),
  ('Diana Foster', 'diana.f@example.com', '+1 (720) 555-2003', 'https://i.pravatar.cc/150?img=5', 'seller', 'active', '2026-03-01'),
  ('Michael Torres', 'm.torres@example.com', '+1 (619) 555-2004', 'https://i.pravatar.cc/150?img=7', 'buyer', 'inactive', '2026-02-20'),
  ('Naomi Patel', 'naomi.p@example.com', '+1 (312) 555-2005', 'https://i.pravatar.cc/150?img=9', 'investor', 'active', '2026-03-08'),
  ('Chris Andersen', 'c.andersen@example.com', '+1 (503) 555-2006', 'https://i.pravatar.cc/150?img=11', 'seller', 'active', '2026-03-06'),
  ('Fatima Hassan', 'fatima.h@example.com', '+1 (602) 555-2007', 'https://i.pravatar.cc/150?img=20', 'buyer', 'active', '2026-03-04'),
  ('Leo Marchetti', 'leo.m@example.com', '+1 (213) 555-2008', 'https://i.pravatar.cc/150?img=15', 'investor', 'inactive', '2026-02-15');
  ```

- [ ] **Step 10: Seed leads and tasks**

  ```sql
  INSERT INTO leads (name, email, phone, property_interest, message, status, assigned_agent_id, date) VALUES
  ('Ryan Thompson', 'ryan.t@email.com', '+1 (555) 101-0101', '3BR For Sale, Austin TX', 'Looking for a family home near good schools, budget around $600k', 'new', 'a0000000-0000-0000-0000-000000000000', '2026-03-05'),
  ('Chloe Adams', 'chloe.a@email.com', '+1 (555) 202-0202', 'For Rent, Downtown', 'Need a 1BR apartment within 6 blocks of the metro, max $2,200/mo', 'contacted', 'a0000000-0000-0000-0000-000000000001', '2026-03-04'),
  ('Derek Wu', 'derek.wu@email.com', '+1 (555) 303-0303', 'Commercial Lease, Chicago', 'Looking for office space 2,000 sq ft, ground floor preferred', 'qualified', 'a0000000-0000-0000-0000-000000000002', '2026-03-03'),
  ('Tiffany Brooks', 'tbrooks@email.com', '+1 (555) 404-0404', 'For Sale, Portland OR', 'Buying as investment, cash buyer, closing within 30 days', 'converted', 'a0000000-0000-0000-0000-000000000003', '2026-03-02'),
  ('Nathan Rivera', 'n.rivera@email.com', '+1 (555) 505-0505', 'For Lease, Miami FL', 'Retail space inquiry for boutique clothing store, need foot traffic', 'lost', 'a0000000-0000-0000-0000-000000000000', '2026-03-01'),
  ('Hannah Scott', 'h.scott@email.com', '+1 (555) 606-0606', '4BR For Sale, Boulder CO', 'Relocating from East Coast, timeline is flexible, prefer mountain views', 'new', 'a0000000-0000-0000-0000-000000000001', '2026-02-28'),
  ('Kevin Park', 'k.park@email.com', '+1 (555) 707-0707', 'Condo For Sale, Seattle WA', 'First-time buyer, pre-qualified $450k, wants in-unit laundry', 'qualified', 'a0000000-0000-0000-0000-000000000004', '2026-02-27'),
  ('Brianna Lee', 'blee@email.com', '+1 (555) 808-0808', 'For Rent, Nashville TN', 'Pet owner, needs yard space, two large dogs', 'contacted', 'a0000000-0000-0000-0000-000000000005', '2026-02-26');

  INSERT INTO tasks (title, description, category, priority, completed, due_date, assigned_agent_id) VALUES
  ('Follow up with Alice Thompson', 'Call regarding Sunset Retreat Villa offer', 'follow-up', 'high', false, '2026-03-10', 'a0000000-0000-0000-0000-000000000001'),
  ('Schedule inspection — Lakefront Manor', 'Coordinate with inspector and buyer', 'inspection', 'high', false, '2026-03-11', 'a0000000-0000-0000-0000-000000000005'),
  ('Prepare purchase agreement', 'Ocean Breeze Cottage — Robert Kim', 'paperwork', 'medium', true, '2026-03-07', 'a0000000-0000-0000-0000-000000000003'),
  ('Showing — Desert Modern 2pm', 'Show property to Fontaine family', 'showing', 'medium', false, '2026-03-12', 'a0000000-0000-0000-0000-000000000004'),
  ('Submit closing docs — Mountain View', 'Final paperwork to escrow', 'paperwork', 'high', true, '2026-03-06', 'a0000000-0000-0000-0000-000000000002'),
  ('Send market analysis to Ben Caldwell', 'Comparative market analysis for Boulder area', 'follow-up', 'low', false, '2026-03-14', 'a0000000-0000-0000-0000-000000000001'),
  ('Update MLS listing — Riverside Haven', 'New photos and updated description', 'other', 'medium', false, '2026-03-13', 'a0000000-0000-0000-0000-000000000006');

  INSERT INTO calendar_events (title, date, time, type, location, agent_attendees) VALUES
  ('Showing — Sunset Retreat', '2026-03-10', '10:00 AM', 'showing', 'Austin, TX', ARRAY['a0000000-0000-0000-0000-000000000001']::uuid[]),
  ('Team Standup', '2026-03-10', '9:00 AM', 'meeting', 'Zoom', ARRAY['a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006']::uuid[]),
  ('Inspection — Lakefront Manor', '2026-03-11', '2:00 PM', 'inspection', 'Chicago, IL', ARRAY['a0000000-0000-0000-0000-000000000005']::uuid[]),
  ('Closing — Mountain View Villa', '2026-03-12', '11:00 AM', 'closing', 'Boulder, CO', ARRAY['a0000000-0000-0000-0000-000000000002']::uuid[]),
  ('Showing — Desert Modern', '2026-03-12', '2:00 PM', 'showing', 'Scottsdale, AZ', ARRAY['a0000000-0000-0000-0000-000000000004']::uuid[]),
  ('Quarterly Review', '2026-03-15', '3:00 PM', 'meeting', 'HQ Conference Room', ARRAY['a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006']::uuid[]),
  ('Open House — Riverside Haven', '2026-03-16', '1:00 PM', 'showing', 'Portland, OR', ARRAY['a0000000-0000-0000-0000-000000000006']::uuid[]);
  ```

- [ ] **Step 11: Create admin user in Supabase Auth and link to agent record**

  In Supabase dashboard → Authentication → Users → "Add user":
  - Email: `alex.morgan@mack1.io`
  - Password: (choose a secure password)
  - Click "Create user" — copy the new user's UUID

  Then run in SQL editor (replace `YOUR_USER_UUID` with the copied UUID):
  ```sql
  UPDATE agents SET user_id = 'YOUR_USER_UUID' WHERE id = 'a0000000-0000-0000-0000-000000000000';
  ```

- [ ] **Step 12: Verify data in Supabase Table Editor**

  In Supabase dashboard → Table Editor, confirm:
  - `agents` has 7 rows (1 admin + 6 agents)
  - `leads` has 8 rows
  - `tasks` has 7 rows
  - `calendar_events` has 7 rows

  No code commit — this task is DB-only.

---

## Task 4: Service layer — agents, properties, contacts

**Files:**
- Create: `src/services/agents.ts`
- Create: `src/services/properties.ts`
- Create: `src/services/contacts.ts`

- [ ] **Step 1: Create `src/services/agents.ts`**

  ```ts
  import { supabase } from '../lib/supabase'
  import type { Agent } from '../types'

  interface RawAgent {
    id: string
    user_id: string | null
    name: string
    email: string
    phone: string
    avatar_url: string
    specialty: string
    listings: number
    sales: number
    revenue: string
    rating: number
    status: string
    role: string
  }

  function transformAgent(row: RawAgent): Agent {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      specialty: row.specialty,
      listings: row.listings,
      sales: row.sales,
      revenue: row.revenue,
      rating: row.rating,
      status: row.status as Agent['status'],
      role: row.role as Agent['role'],
    }
  }

  export async function fetchAgents(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name')
    if (error) throw new Error(error.message)
    return (data as RawAgent[]).map(transformAgent)
  }

  export async function updateAgent(id: string, updates: Partial<Omit<Agent, 'id'>>): Promise<void> {
    const dbUpdates: Partial<RawAgent> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
    if (updates.specialty !== undefined) dbUpdates.specialty = updates.specialty
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.role !== undefined) dbUpdates.role = updates.role
    const { error } = await supabase.from('agents').update(dbUpdates).eq('id', id)
    if (error) throw new Error(error.message)
  }
  ```

- [ ] **Step 2: Create `src/services/properties.ts`**

  ```ts
  import { supabase } from '../lib/supabase'
  import type { Property } from '../types'

  interface RawProperty {
    id: string
    name: string
    city: string
    state: string
    price: number
    beds: number
    baths: number
    sqft: number
    image_url: string
    status: string
  }

  function transformProperty(row: RawProperty): Property {
    return {
      id: row.id,
      name: row.name,
      location: { city: row.city, state: row.state },
      price: row.price,
      beds: row.beds,
      baths: row.baths,
      sqft: row.sqft,
      imageUrl: row.image_url,
      status: row.status as Property['status'],
    }
  }

  export async function fetchProperties(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('name')
    if (error) throw new Error(error.message)
    return (data as RawProperty[]).map(transformProperty)
  }

  export async function createProperty(data: Omit<Property, 'id'>): Promise<Property> {
    const { data: row, error } = await supabase
      .from('properties')
      .insert({
        name: data.name,
        city: data.location.city,
        state: data.location.state,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        sqft: data.sqft,
        image_url: data.imageUrl,
        status: data.status,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return transformProperty(row as RawProperty)
  }

  export async function updateProperty(id: string, updates: Partial<Omit<Property, 'id'>>): Promise<void> {
    const dbUpdates: Partial<RawProperty> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.location?.city !== undefined) dbUpdates.city = updates.location.city
    if (updates.location?.state !== undefined) dbUpdates.state = updates.location.state
    if (updates.price !== undefined) dbUpdates.price = updates.price
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl
    const { error } = await supabase.from('properties').update(dbUpdates).eq('id', id)
    if (error) throw new Error(error.message)
  }

  export async function deleteProperty(id: string): Promise<void> {
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
  ```

- [ ] **Step 3: Create `src/services/contacts.ts`**

  ```ts
  import { supabase } from '../lib/supabase'
  import type { Contact } from '../types'

  interface RawContact {
    id: string
    name: string
    email: string
    phone: string
    avatar_url: string
    type: string
    status: string
    last_contact: string
  }

  function transformContact(row: RawContact): Contact {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      type: row.type as Contact['type'],
      status: row.status as Contact['status'],
      lastContact: row.last_contact,
    }
  }

  export async function fetchContacts(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('name')
    if (error) throw new Error(error.message)
    return (data as RawContact[]).map(transformContact)
  }

  export async function createContact(data: Omit<Contact, 'id'>): Promise<Contact> {
    const { data: row, error } = await supabase
      .from('contacts')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar_url: data.avatarUrl,
        type: data.type,
        status: data.status,
        last_contact: data.lastContact,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return transformContact(row as RawContact)
  }

  export async function updateContact(id: string, updates: Partial<Omit<Contact, 'id'>>): Promise<void> {
    const dbUpdates: Partial<RawContact> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.lastContact !== undefined) dbUpdates.last_contact = updates.lastContact
    const { error } = await supabase.from('contacts').update(dbUpdates).eq('id', id)
    if (error) throw new Error(error.message)
  }

  export async function deleteContact(id: string): Promise<void> {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
  ```

- [ ] **Step 4: Compile check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: zero errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/services/agents.ts src/services/properties.ts src/services/contacts.ts
  git commit -m "feat: add service layer for agents, properties, contacts"
  ```

---

## Task 5: Service layer — leads, tasks, events

**Files:**
- Create: `src/services/leads.ts`
- Create: `src/services/tasks.ts`
- Create: `src/services/events.ts`

- [ ] **Step 1: Create `src/services/leads.ts`**

  ```ts
  import { supabase } from '../lib/supabase'
  import type { Lead } from '../types'

  interface RawLead {
    id: string
    name: string
    email: string
    phone: string
    property_interest: string
    message: string
    status: string
    assigned_agent_id: string
    date: string
    agents: { name: string } | null
  }

  function transformLead(row: RawLead): Lead {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      propertyInterest: row.property_interest,
      message: row.message,
      status: row.status as Lead['status'],
      assignedAgentId: row.assigned_agent_id,
      assignedAgentName: row.agents?.name ?? '',
      date: row.date,
    }
  }

  export async function fetchLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*, agents(name)')
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as RawLead[]).map(transformLead)
  }

  export async function createLead(data: Omit<Lead, 'id' | 'assignedAgentName'>): Promise<Lead> {
    const { data: row, error } = await supabase
      .from('leads')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        property_interest: data.propertyInterest,
        message: data.message,
        status: data.status,
        assigned_agent_id: data.assignedAgentId,
        date: data.date,
      })
      .select('*, agents(name)')
      .single()
    if (error) throw new Error(error.message)
    return transformLead(row as RawLead)
  }

  export async function updateLeadStatus(id: string, status: Lead['status']): Promise<void> {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id)
    if (error) throw new Error(error.message)
  }

  export async function reassignLead(id: string, agentId: string): Promise<void> {
    const { error } = await supabase.from('leads').update({ assigned_agent_id: agentId }).eq('id', id)
    if (error) throw new Error(error.message)
  }
  ```

- [ ] **Step 2: Create `src/services/tasks.ts`**

  ```ts
  import { supabase } from '../lib/supabase'
  import type { Task } from '../types'

  interface RawTask {
    id: string
    title: string
    description: string
    category: string
    priority: string
    completed: boolean
    due_date: string
    assigned_agent_id: string
    agents: { name: string } | null
  }

  function transformTask(row: RawTask): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category as Task['category'],
      priority: row.priority as Task['priority'],
      completed: row.completed,
      dueDate: row.due_date,
      assignedAgentId: row.assigned_agent_id,
      assignedAgentName: row.agents?.name ?? '',
    }
  }

  export async function fetchTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, agents(name)')
      .order('due_date', { ascending: true })
    if (error) throw new Error(error.message)
    return (data as RawTask[]).map(transformTask)
  }

  export async function createTask(data: Omit<Task, 'id' | 'assignedAgentName'>): Promise<Task> {
    const { data: row, error } = await supabase
      .from('tasks')
      .insert({
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        completed: data.completed,
        due_date: data.dueDate,
        assigned_agent_id: data.assignedAgentId,
      })
      .select('*, agents(name)')
      .single()
    if (error) throw new Error(error.message)
    return transformTask(row as RawTask)
  }

  export async function toggleTaskComplete(id: string, completed: boolean): Promise<void> {
    const { error } = await supabase.from('tasks').update({ completed }).eq('id', id)
    if (error) throw new Error(error.message)
  }

  export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'assignedAgentName'>>): Promise<void> {
    const dbUpdates: Partial<RawTask> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.assignedAgentId !== undefined) dbUpdates.assigned_agent_id = updates.assignedAgentId
    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id)
    if (error) throw new Error(error.message)
  }
  ```

- [ ] **Step 3: Create `src/services/events.ts`**

  > **Design note:** `agent_attendees` is a `uuid[]` column — PostgreSQL arrays cannot have FK constraints, so PostgREST cannot join them automatically. Attendee names are resolved client-side by fetching agents in parallel and building a lookup map.

  ```ts
  import { supabase } from '../lib/supabase'
  import type { CalendarEvent } from '../types'

  interface RawEvent {
    id: string
    title: string
    date: string
    time: string
    type: string
    location: string
    agent_attendees: string[]
  }

  export async function fetchEvents(): Promise<CalendarEvent[]> {
    const [eventsResult, agentsResult] = await Promise.all([
      supabase.from('calendar_events').select('*').order('date', { ascending: true }),
      supabase.from('agents').select('id, name'),
    ])
    if (eventsResult.error) throw new Error(eventsResult.error.message)
    if (agentsResult.error) throw new Error(agentsResult.error.message)

    const agentMap = new Map(
      (agentsResult.data as { id: string; name: string }[]).map(a => [a.id, a.name])
    )

    return (eventsResult.data as RawEvent[]).map(row => ({
      id: row.id,
      title: row.title,
      date: row.date,
      time: row.time,
      type: row.type as CalendarEvent['type'],
      location: row.location,
      attendeeIds: row.agent_attendees ?? [],
      attendees: (row.agent_attendees ?? []).map(id => agentMap.get(id) ?? id),
    }))
  }

  export async function createEvent(data: Omit<CalendarEvent, 'id' | 'attendees'>): Promise<CalendarEvent> {
    const { data: row, error } = await supabase
      .from('calendar_events')
      .insert({
        title: data.title,
        date: data.date,
        time: data.time,
        type: data.type,
        location: data.location,
        agent_attendees: data.attendeeIds,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    // Resolve attendee names after insert
    const agentsResult = await supabase.from('agents').select('id, name')
    const agentMap = new Map(
      (agentsResult.data ?? []).map((a: { id: string; name: string }) => [a.id, a.name])
    )
    const raw = row as RawEvent
    return {
      id: raw.id,
      title: raw.title,
      date: raw.date,
      time: raw.time,
      type: raw.type as CalendarEvent['type'],
      location: raw.location,
      attendeeIds: raw.agent_attendees ?? [],
      attendees: (raw.agent_attendees ?? []).map(id => agentMap.get(id) ?? id),
    }
  }

  export async function updateEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'attendees'>>): Promise<void> {
    const dbUpdates: Partial<RawEvent> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.time !== undefined) dbUpdates.time = updates.time
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.location !== undefined) dbUpdates.location = updates.location
    if (updates.attendeeIds !== undefined) dbUpdates.agent_attendees = updates.attendeeIds
    const { error } = await supabase.from('calendar_events').update(dbUpdates).eq('id', id)
    if (error) throw new Error(error.message)
  }

  export async function deleteEvent(id: string): Promise<void> {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
  ```

- [ ] **Step 4: Compile check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: zero errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/services/leads.ts src/services/tasks.ts src/services/events.ts
  git commit -m "feat: add service layer for leads, tasks, events"
  ```

---

## Task 6: AuthContext + ProtectedRoute + LoginPage

**Files:**
- Create: `src/context/AuthContext.tsx`
- Create: `src/pages/LoginPage.tsx`

- [ ] **Step 1: Create `src/context/AuthContext.tsx`**

  ```tsx
  import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
  import type { User } from '@supabase/supabase-js'
  import { supabase } from '../lib/supabase'
  import type { Agent } from '../types'

  interface AuthContextValue {
    user: User | null
    agentRecord: Agent | null
    isAdmin: boolean
    authLoading: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
  }

  const AuthContext = createContext<AuthContextValue>({
    user: null,
    agentRecord: null,
    isAdmin: false,
    authLoading: true,
    signIn: async () => ({ error: null }),
    signOut: async () => {},
  })

  async function fetchAgentRecord(userId: string): Promise<Agent | null> {
    const { data } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (!data) return null
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatarUrl: data.avatar_url,
      specialty: data.specialty,
      listings: data.listings,
      sales: data.sales,
      revenue: data.revenue,
      rating: data.rating,
      status: data.status,
      role: data.role,
    }
  }

  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [agentRecord, setAgentRecord] = useState<Agent | null>(null)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
      // onAuthStateChange fires immediately with INITIAL_SESSION on mount,
      // covering both the "restore from localStorage" case and "no session" case.
      // No separate getSession() call needed — avoids a double-fetch race condition.
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          const agent = await fetchAgentRecord(session.user.id)
          setAgentRecord(agent)
        } else {
          setUser(null)
          setAgentRecord(null)
        }
        setAuthLoading(false)
      })

      return () => subscription.unsubscribe()
    }, [])

    async function signIn(email: string, password: string): Promise<{ error: string | null }> {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return { error: null }
    }

    async function signOut() {
      await supabase.auth.signOut()
    }

    return (
      <AuthContext.Provider value={{
        user,
        agentRecord,
        isAdmin: agentRecord?.role === 'admin',
        authLoading,
        signIn,
        signOut,
      }}>
        {children}
      </AuthContext.Provider>
    )
  }

  export function useAuth() {
    return useContext(AuthContext)
  }

  export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, agentRecord, authLoading } = useAuth()

    if (authLoading) {
      return (
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )
    }

    if (!user) {
      // LoginPage imported inline to avoid circular dep with AuthContext
      return <LoginPageInner />
    }

    if (!agentRecord) {
      return (
        <div className="h-screen flex items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Account not configured. Contact your administrator.</p>
        </div>
      )
    }

    return <>{children}</>
  }

  // Defined here to avoid circular import: LoginPage needs useAuth, AuthContext renders LoginPage
  function LoginPageInner() {
    const { signIn } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      setLoading(true)
      setError(null)
      const { error } = await signIn(email, password)
      if (error) setError(error)
      setLoading(false)
    }

    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-6 p-8 border border-border rounded-lg bg-card shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">DataBrain CRM</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    )
  }
  ```

  > **Design note:** `LoginPageInner` is defined inside `AuthContext.tsx` instead of a separate file to avoid a circular import: `LoginPage` would need `useAuth`, and `AuthContext` would need to render `LoginPage`. Keeping it co-located sidesteps this entirely.

- [ ] **Step 2: Create `src/hooks/useAuth.ts`**

  ```ts
  export { useAuth } from '../context/AuthContext'
  ```

- [ ] **Step 4: Compile check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: zero errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/context/AuthContext.tsx src/hooks/useAuth.ts
  git commit -m "feat: add AuthContext, ProtectedRoute, and login UI"
  ```

---

## Task 7: Entity hooks

**Files:**
- Create: `src/hooks/useAgents.ts`
- Create: `src/hooks/useProperties.ts`
- Create: `src/hooks/useContacts.ts`
- Create: `src/hooks/useLeads.ts`
- Create: `src/hooks/useTasks.ts`
- Create: `src/hooks/useEvents.ts`

- [ ] **Step 1: Create `src/hooks/useAgents.ts`**

  ```ts
  import { useState, useEffect } from 'react'
  import { fetchAgents, updateAgent } from '../services/agents'
  import type { Agent } from '../types'

  export function useAgents() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      fetchAgents()
        .then(setAgents)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }, [])

    async function handleUpdateAgent(id: string, updates: Partial<Omit<Agent, 'id'>>) {
      await updateAgent(id, updates)
      setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
    }

    return { agents, loading, error, updateAgent: handleUpdateAgent }
  }
  ```

- [ ] **Step 2: Create `src/hooks/useProperties.ts`**

  ```ts
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
  ```

- [ ] **Step 3: Create `src/hooks/useContacts.ts`**

  ```ts
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
  ```

- [ ] **Step 4: Create `src/hooks/useLeads.ts`**

  ```ts
  import { useState, useEffect } from 'react'
  import { fetchLeads, createLead, updateLeadStatus, reassignLead } from '../services/leads'
  import type { Lead } from '../types'

  export function useLeads() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      fetchLeads()
        .then(setLeads)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }, [])

    async function handleCreateLead(data: Omit<Lead, 'id' | 'assignedAgentName'>) {
      const created = await createLead(data)
      setLeads(prev => [created, ...prev])
      return created
    }

    async function handleUpdateLeadStatus(id: string, status: Lead['status']) {
      await updateLeadStatus(id, status)
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    }

    async function handleReassignLead(id: string, agentId: string, agentName: string) {
      await reassignLead(id, agentId)
      setLeads(prev => prev.map(l => l.id === id ? { ...l, assignedAgentId: agentId, assignedAgentName: agentName } : l))
    }

    return { leads, loading, error, createLead: handleCreateLead, updateLeadStatus: handleUpdateLeadStatus, reassignLead: handleReassignLead }
  }
  ```

- [ ] **Step 5: Create `src/hooks/useTasks.ts`**

  ```ts
  import { useState, useEffect } from 'react'
  import { fetchTasks, createTask, toggleTaskComplete, updateTask } from '../services/tasks'
  import type { Task } from '../types'

  export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      fetchTasks()
        .then(setTasks)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }, [])

    async function handleToggleComplete(id: string) {
      const task = tasks.find(t => t.id === id)
      if (!task) return
      const newCompleted = !task.completed
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t))
      try {
        await toggleTaskComplete(id, newCompleted)
      } catch (e) {
        // Revert on failure
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: task.completed } : t))
        throw e
      }
    }

    async function handleCreateTask(data: Omit<Task, 'id' | 'assignedAgentName'>) {
      const created = await createTask(data)
      setTasks(prev => [...prev, created])
      return created
    }

    return { tasks, loading, error, toggleTaskComplete: handleToggleComplete, createTask: handleCreateTask }
  }
  ```

- [ ] **Step 6: Create `src/hooks/useEvents.ts`**

  ```ts
  import { useState, useEffect } from 'react'
  import { fetchEvents, createEvent, updateEvent, deleteEvent } from '../services/events'
  import type { CalendarEvent } from '../types'

  export function useEvents() {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      fetchEvents()
        .then(setEvents)
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }, [])

    async function handleCreateEvent(data: Omit<CalendarEvent, 'id' | 'attendees'>) {
      const created = await createEvent(data)
      setEvents(prev => [...prev, created])
      return created
    }

    async function handleDeleteEvent(id: string) {
      await deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    }

    return { events, loading, error, createEvent: handleCreateEvent, deleteEvent: handleDeleteEvent }
  }
  ```

- [ ] **Step 7: Compile check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: zero errors.

- [ ] **Step 8: Commit**

  ```bash
  git add src/hooks/
  git commit -m "feat: add entity hooks (useAgents, useProperties, useContacts, useLeads, useTasks, useEvents)"
  ```

---

## Task 8: Wire App.tsx with AuthProvider + ProtectedRoute

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `src/App.tsx`**

  Replace the entire file with:
  ```tsx
  import { RouterProvider } from '@/lib/router'
  import { AppLayout } from '@/components/shared/AppLayout'
  import { PageRouter } from '@/components/shared/PageRouter'
  import { ThemeProvider } from '@/lib/theme'
  import { AuthProvider, ProtectedRoute } from '@/context/AuthContext'

  export default function App() {
    return (
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider>
            <ProtectedRoute>
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

- [ ] **Step 2: Compile check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: zero errors.

- [ ] **Step 3: Smoke test auth in browser**

  ```bash
  npm run dev
  ```

  Open http://localhost:5173. Expected behavior:
  - The login form appears (spinner briefly, then login page)
  - Enter `alex.morgan@mack1.io` and the password you set in Task 3 Step 11
  - The CRM dashboard loads — all pages work with mock data (hooks not yet wired)
  - Sign out is not yet exposed in the UI — that's fine for now

- [ ] **Step 4: Commit**

  ```bash
  git add src/App.tsx
  git commit -m "feat: wire AuthProvider and ProtectedRoute into App"
  ```

---

## Task 9: Wire LeadsPage and TasksPage to hooks

**Files:**
- Modify: `src/pages/LeadsPage.tsx`
- Modify: `src/pages/TasksPage.tsx`

- [ ] **Step 1: Update `src/pages/LeadsPage.tsx`**

  Replace the import line and add loading/error handling:
  ```tsx
  import { useLeads } from '@/hooks/useLeads'
  // remove: import { leadsData } from '@/lib/mock-data'
  ```

  Replace the component body:
  ```tsx
  export function LeadsPage() {
    const { leads, loading, error } = useLeads()

    if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading leads…</div>
    if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground">{leads.length} active leads</p>
          </div>
          <Button size="sm">+ New Lead</Button>
        </div>
        {/* rest of JSX unchanged — field names already updated in Task 2 */}
        ...
      </div>
    )
  }
  ```

  The complete updated file:
  ```tsx
  import { useLeads } from '@/hooks/useLeads'
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { Pencil, Trash2 } from 'lucide-react'
  import type { Lead } from '@/types'

  const STATUS_STYLES: Record<Lead['status'], string> = {
    new: 'bg-muted text-muted-foreground',
    contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    qualified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    converted: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    lost: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  export function LeadsPage() {
    const { leads, loading, error } = useLeads()

    if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading leads…</div>
    if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground">{leads.length} active leads</p>
          </div>
          <Button size="sm">+ New Lead</Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Property Interest</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Agent</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map(lead => (
                <TableRow key={lead.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-semibold text-foreground text-sm whitespace-nowrap">{lead.name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                      <p className="text-sm text-muted-foreground">{lead.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{lead.propertyInterest}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                    <span className="line-clamp-1">{lead.message}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${STATUS_STYLES[lead.status]}`}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">{lead.assignedAgentName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(lead.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground gap-1">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Replace `src/pages/TasksPage.tsx` with the complete updated file**

  ```tsx
  import { useTasks } from '@/hooks/useTasks'
  import { Card, CardContent } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'
  import { Button } from '@/components/ui/button'
  import { Checkbox } from '@/components/ui/checkbox'
  import { Separator } from '@/components/ui/separator'
  import { Calendar, User, Flag } from 'lucide-react'
  import { cn } from '@/lib/utils'
  import type { Task } from '@/types'

  const PRIORITY_STYLES: Record<Task['priority'], string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    low: 'bg-muted text-muted-foreground',
  }

  const CATEGORY_STYLES: Record<Task['category'], string> = {
    'follow-up': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    'inspection': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    'paperwork': 'bg-muted text-muted-foreground',
    'showing': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    'other': 'bg-muted text-muted-foreground',
  }

  export function TasksPage() {
    const { tasks, loading, error, toggleTaskComplete } = useTasks()

    if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading tasks…</div>
    if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>

    const pending = tasks.filter(t => !t.completed)
    const completed = tasks.filter(t => t.completed)

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground">{pending.length} pending · {completed.length} completed</p>
          </div>
          <Button size="sm">+ New Task</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {pending.length > 0 && (
              <div className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pending</p>
                <div className="flex flex-col gap-1">
                  {pending.map((task, i) => (
                    <div key={task.id}>
                      {i > 0 && <Separator />}
                      <div className="flex items-start gap-3 py-3 hover:bg-muted/20 rounded-md px-2 -mx-2 transition-colors">
                        <Checkbox checked={task.completed} onCheckedChange={() => toggleTaskComplete(task.id)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-medium text-foreground">{task.title}</p>
                            <Badge className={`text-xs ${PRIORITY_STYLES[task.priority]}`}><Flag className="h-2.5 w-2.5 mr-1" />{task.priority}</Badge>
                            <Badge className={`text-xs capitalize ${CATEGORY_STYLES[task.category]}`}>{task.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignedAgentName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div className="p-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Completed</p>
                <div className="flex flex-col gap-1">
                  {completed.map((task, i) => (
                    <div key={task.id}>
                      {i > 0 && <Separator />}
                      <div className="flex items-start gap-3 py-3 hover:bg-muted/20 rounded-md px-2 -mx-2 transition-colors opacity-50">
                        <Checkbox checked={task.completed} onCheckedChange={() => toggleTaskComplete(task.id)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', task.completed && 'line-through text-muted-foreground')}>{task.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
  ```

- [ ] **Step 3: Compile check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: zero errors.

- [ ] **Step 4: Smoke test**

  Open the app, navigate to Leads — verify real data from Supabase loads. Navigate to Tasks — verify tasks load and checkboxes toggle (and persist on refresh). Open Supabase Table Editor and confirm `completed` column updates when you check a task.

- [ ] **Step 5: Commit**

  ```bash
  git add src/pages/LeadsPage.tsx src/pages/TasksPage.tsx
  git commit -m "feat: wire LeadsPage and TasksPage to Supabase hooks"
  ```

---

## Task 10: Wire remaining pages to hooks

**Files:**
- Modify: `src/pages/ContactsPage.tsx`
- Modify: `src/pages/AgentsPage.tsx`
- Modify: `src/pages/ListingsPage.tsx`
- Modify: `src/pages/CalendarPage.tsx`

For each page, the pattern is the same:
1. Remove mock-data import
2. Add hook import and call
3. Add loading/error guard at top of component
4. Remove any local `useState` that initialized from mock-data

- [ ] **Step 1: Update `src/pages/ContactsPage.tsx`**

  Make these three changes:

  1. Replace `import { contactsData } from '@/lib/mock-data'` with `import { useContacts } from '@/hooks/useContacts'`

  2. At the top of the component body, replace `const [search, setSearch] = useState('')` and the `filtered` line with:
  ```tsx
  const { contacts, loading, error } = useContacts()
  const [search, setSearch] = useState('')
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading contacts…</div>
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )
  ```

  3. Find any reference to `contactsData.length` in the JSX and replace it with `contacts.length`.

- [ ] **Step 2: Update `src/pages/AgentsPage.tsx`**

  Read the file first, then apply the same pattern:
  ```tsx
  // Remove mock-data import, add:
  import { useAgents } from '@/hooks/useAgents'

  // In component:
  const { agents, loading, error } = useAgents()
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading agents…</div>
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>
  ```

- [ ] **Step 3: Update `src/pages/ListingsPage.tsx`**

  ```tsx
  import { useProperties } from '@/hooks/useProperties'

  const { properties, loading, error } = useProperties()
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading listings…</div>
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>
  ```

- [ ] **Step 4: Update `src/pages/CalendarPage.tsx`**

  ```tsx
  import { useEvents } from '@/hooks/useEvents'

  const { events, loading, error } = useEvents()
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading calendar…</div>
  if (error) return <div className="p-6 text-sm text-destructive">Error: {error}</div>
  ```

  The `event.attendees.join(', ')` call at line 60 remains unchanged — `attendees: string[]` is still on the type.

- [ ] **Step 5: Compile check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: zero errors.

- [ ] **Step 6: Full smoke test**

  Navigate every page and verify:
  - [ ] Dashboard: loads (static data, unchanged)
  - [ ] Listings: shows 6 properties from Supabase
  - [ ] Agents: shows 7 agents from Supabase
  - [ ] Contacts: shows 8 contacts, search filters work
  - [ ] Leads: shows 8 leads with agent names
  - [ ] Tasks: shows 7 tasks, checkboxes persist
  - [ ] Calendar: shows 7 events with attendee names
  - [ ] Refresh browser — login spinner appears, then app restores without asking to log in again

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/ContactsPage.tsx src/pages/AgentsPage.tsx src/pages/ListingsPage.tsx src/pages/CalendarPage.tsx
  git commit -m "feat: wire all remaining pages to Supabase hooks"
  ```

---

## Done

At this point:
- All CRM data comes from Supabase PostgreSQL
- Auth protects the entire app
- Admin (Alex Morgan) can see all records
- Agents can only see their assigned leads, tasks, and events
- Dashboard stats remain static (as designed)
- ESign page is unchanged (out of scope)

**Next steps (future phases):**
- Create auth accounts for individual agents and link their `user_id`
- Add sign-out button to the UI (in `AppLayout` or sidebar)
- Password reset / invite email flows
- Real-time subscriptions for live updates across tabs
