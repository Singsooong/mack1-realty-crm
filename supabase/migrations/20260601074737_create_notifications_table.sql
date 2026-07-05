-- In-app notifications shown in the header bell.
-- v1: e-sign status changes (a document moved to 'signed'). `type` is kept open
-- so other domains can reuse this table later.

create table if not exists notifications (
  id             uuid primary key default gen_random_uuid(),
  -- The auth user who should see this (resolved from documents.agent_id ->
  -- agents.user_id by the webhook). Null = unattributed; visible to admins only.
  recipient_id   uuid references auth.users(id) on delete cascade,
  type           text not null default 'esign_status'
                   check (type in ('esign_status')),
  document_id    uuid references documents(id) on delete cascade,
  status         text,
  -- Denormalized snapshot so a Realtime INSERT payload is self-contained and
  -- the frontend can render copy without an extra join.
  document_title text,
  client_name    text,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;

-- Recipient sees their own; admins see everything (including unattributed rows).
create policy "recipients and admins can read notifications"
  on notifications for select
  using (
    recipient_id = auth.uid()
    or exists (
      select 1 from agents a
      where a.user_id = auth.uid() and a.role = 'admin'
    )
  );

-- Recipient may mark their own notifications read. (Admins reading shared rows
-- don't toggle read state — read_at tracks the recipient's view.)
create policy "recipients can update own notifications"
  on notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- No INSERT policy: rows are created by the webhook using the service-role key,
-- which bypasses RLS. Clients can never forge notifications.

-- Emit Postgres Changes so the useNotifications hook receives live INSERT/UPDATE.
-- RLS above gates which rows each subscribed client actually receives.
alter publication supabase_realtime add table notifications;
