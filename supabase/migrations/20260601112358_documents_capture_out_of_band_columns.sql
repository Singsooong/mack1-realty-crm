-- Reconcile schema drift: these columns, function, and trigger exist on the live
-- documents table but were never captured in a tracked migration. Defined with
-- IF NOT EXISTS / OR REPLACE so this is a no-op against live yet reproduces the
-- real schema on a fresh `supabase db reset`.

-- Shared util: stamp updated_at on every row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.documents
  add column if not exists error_message        text,
  add column if not exists original_file_paths  text[] not null default '{}',
  add column if not exists signature_image_path text,
  add column if not exists completed_at         timestamptz,
  add column if not exists updated_at           timestamptz not null default now();

drop trigger if exists documents_updated_at on public.documents;
create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();
