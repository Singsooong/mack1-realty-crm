-- Private bucket for sensitive client documents (financial / PII). Served via
-- short-lived signed URLs, never public. 25 MB limit.
insert into storage.buckets (id, name, public, file_size_limit)
values ('client-documents', 'client-documents', false, 26214400)
on conflict (id) do nothing;

-- Mirror the existing avatar/image bucket policy style (authenticated role check).
create policy "Authenticated users can read client documents" on storage.objects
  for select using (bucket_id = 'client-documents' and auth.role() = 'authenticated');
create policy "Authenticated users can upload client documents" on storage.objects
  for insert with check (bucket_id = 'client-documents' and auth.role() = 'authenticated');
create policy "Authenticated users can delete client documents" on storage.objects
  for delete using (bucket_id = 'client-documents' and auth.role() = 'authenticated');
