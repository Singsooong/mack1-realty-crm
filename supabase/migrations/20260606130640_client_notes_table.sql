-- Append-only notes/remarks timeline for a client.
create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.contacts(id) on delete cascade,
  body text not null,
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  created_at timestamptz not null default now()
);
create index if not exists client_notes_client_id_idx
  on public.client_notes(client_id, created_at desc);

alter table public.client_notes enable row level security;

-- Mirror the shared-access model used by contacts: any authenticated user
-- can read and write; admins covered by the same predicate.
create policy client_notes_select on public.client_notes
  for select to authenticated using (auth.uid() is not null);
create policy client_notes_write on public.client_notes
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
