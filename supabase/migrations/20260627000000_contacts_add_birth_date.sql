-- Add an optional birthdate to contacts (clients). Date-only, no timezone.
alter table public.contacts
  add column if not exists birth_date date;
