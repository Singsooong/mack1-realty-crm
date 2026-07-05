-- Replace the contacts (clients) status model: active/inactive -> 10-stage pipeline.
-- Backfill existing rows (legacy 'active'/'inactive') to the pipeline entry stage.
alter table public.contacts drop constraint if exists contacts_status_check;
update public.contacts
  set status = 'new-inquiry'
  where status is null or status not in (
    'new-inquiry','pre-qualified','in-credit-repair','pre-approved','actively-searching',
    'offer-submitted','in-contract','pending','clear-to-close','closed'
  );
alter table public.contacts alter column status set default 'new-inquiry';
alter table public.contacts
  add constraint contacts_status_check check (status in (
    'new-inquiry',
    'pre-qualified',
    'in-credit-repair',
    'pre-approved',
    'actively-searching',
    'offer-submitted',
    'in-contract',
    'pending',
    'clear-to-close',
    'closed'
  ));
