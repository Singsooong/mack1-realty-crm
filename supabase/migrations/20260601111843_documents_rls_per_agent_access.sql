-- Restrict documents to the owning agent; admins retain full access.
-- documents.agent_id -> agents.id, and agents.user_id -> auth.uid().
-- Replaces the original wide-open "authenticated" policies, which let every
-- logged-in agent read (and write) every other agent's documents.

-- Helper: the agents.id of the currently authenticated user (NULL if none).
-- Twin of get_my_role(); SECURITY DEFINER so RLS on agents doesn't recurse.
create or replace function public.get_my_agent_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from agents where user_id = auth.uid() limit 1;
$$;

drop policy if exists "agents can read all documents"   on public.documents;
drop policy if exists "agents can insert own documents" on public.documents;
drop policy if exists "agents can update own documents" on public.documents;

-- Admins: full CRUD on every document.
create policy "documents_admin_all" on public.documents
  for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- Agents: only documents they own (NULL agent_id => admin-only).
create policy "documents_agent_select" on public.documents
  for select
  using (agent_id = get_my_agent_id());

create policy "documents_agent_insert" on public.documents
  for insert
  with check (agent_id = get_my_agent_id());

create policy "documents_agent_update" on public.documents
  for update
  using (agent_id = get_my_agent_id())
  with check (agent_id = get_my_agent_id());
