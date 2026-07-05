# SignWell E-Sign Integration

## Goal
Wire the ESign page to SignWell's REST API so agents can send real documents for client signing, track status, and download completed docs.

## Flow
1. Agent fills form (title, property, client name/email/phone, uploads PDF + agent signature image) → hits "Send"
2. `signwell-send-document` edge function uploads file to SignWell and creates a document with the client as the only signer → SignWell emails the client
3. Client clicks link in email → signs on SignWell's hosted page
4. SignWell calls our `signwell-webhook` edge function with `document.completed` event
5. Webhook updates the DB row status to `signed` + stores download URL
6. Agent sees card flip to "Signed" and can download the finalized PDF

## Architecture

### Database — `documents` table
```sql
id             uuid primary key default gen_random_uuid()
title          text not null
property       text
client_name    text not null
client_email   text not null
client_phone   text
agent_id       uuid references agents(id)
signwell_id    text                         -- SignWell document ID
status         text default 'draft'         -- draft | sent | signed | expired
signing_url    text                         -- SignWell hosted signing URL (for reference)
download_url   text                         -- populated on completion
created_at     timestamptz default now()
expires_at     timestamptz
```

### Edge Functions
| Function | Purpose |
|---|---|
| `signwell-send-document` | Creates & sends document via SignWell API (keeps API key server-side) |
| `signwell-webhook` | Receives `document.completed` event, updates DB status + download_url |

### Frontend
| File | Role |
|---|---|
| `src/services/esign.ts` | Supabase queries + edge function calls |
| `src/hooks/useDocuments.ts` | React state + CRUD wrapper |
| `src/components/esign/SendDocumentDrawer.tsx` | Step 1 form (slide-in sheet) |
| `src/pages/ESignPage.tsx` | Updated to use real data + open drawer |

## SignWell API Reference
- **Create document:** `POST https://www.signwell.com/api/v1/documents`
- **Auth header:** `X-Api-Key: {SIGNWELL_API_KEY}`
- **Webhook event:** `document.completed` → body contains `document.id`, `download_url`

## Env vars needed
- `SIGNWELL_API_KEY` — Supabase secret (set via `supabase secrets set`)
- `SIGNWELL_WEBHOOK_SECRET` — optional HMAC secret for webhook verification

## Tasks

### T1 — DB migration
Create `supabase/migrations/<timestamp>_create_documents_table.sql`

### T2 — Extend Document type
Update `src/types/index.ts` `Document` interface to match the real DB columns.

### T3 — signwell-send-document edge function
`supabase/functions/signwell-send-document/index.ts`
- Auth check (any logged-in agent)
- Accept: `{ title, property, client_name, client_email, client_phone, file_base64, file_name, agent_id }`
- Call `POST /api/v1/documents` on SignWell
- Insert row into `documents` table with status `sent`
- Return the new document row

### T4 — signwell-webhook edge function
`supabase/functions/signwell-webhook/index.ts`
- No auth (public endpoint, SignWell calls it)
- On `document.completed`: update `documents` row → `status = 'signed'`, `download_url`
- Return 200

### T5 — src/services/esign.ts
- `fetchDocuments()` — select from `documents`
- `sendDocument(payload)` — invoke `signwell-send-document`
- `downloadDocument(downloadUrl)` — fetch blob and trigger browser download

### T6 — src/hooks/useDocuments.ts
- Mirrors pattern of `useAgents.ts` — load on mount, expose `send()`, `refresh()`

### T7 — SendDocumentDrawer
- Sheet component matching existing drawer style (see `AgentDrawer.tsx`)
- Fields: Title, Property, Client Name, Client Email, Client Phone
- File upload: PDF attachment
- Agent signature image upload
- Submit → calls `useDocuments.send()` → closes drawer

### T8 — ESignPage wired to real data
- Replace `documentsData` mock with `useDocuments` hook
- Wire "New Document" button → open `SendDocumentDrawer`
- Wire "Download" button → `downloadDocument(doc.download_url)`
