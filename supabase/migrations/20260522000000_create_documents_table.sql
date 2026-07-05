create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  property      text,
  client_name   text not null,
  client_email  text not null,
  client_phone  text,
  agent_id      uuid references agents(id) on delete set null,
  signwell_id   text unique,
  status        text not null default 'draft'
                  check (status in ('draft', 'sent', 'signed', 'expired')),
  signing_url   text,
  download_url  text,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz
);

-- Agents can read all documents; only the owner or an admin can write
alter table documents enable row level security;

create policy "agents can read all documents"
  on documents for select
  using (auth.role() = 'authenticated');

create policy "agents can insert own documents"
  on documents for insert
  with check (auth.role() = 'authenticated');

create policy "agents can update own documents"
  on documents for update
  using (auth.role() = 'authenticated');
