-- Link tasks to a client (contact). RLS unchanged: tasks remain per-agent.
alter table public.tasks
  add column if not exists client_id uuid references public.contacts(id) on delete set null;
create index if not exists tasks_client_id_idx on public.tasks(client_id);
