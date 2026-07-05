-- Metadata for files uploaded to a client (stored in the private
-- 'client-documents' storage bucket; file_path points into that bucket).
create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.contacts(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists client_documents_client_id_idx
  on public.client_documents(client_id, created_at desc);

alter table public.client_documents enable row level security;

create policy client_documents_select on public.client_documents
  for select to authenticated using (auth.uid() is not null);
create policy client_documents_write on public.client_documents
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
