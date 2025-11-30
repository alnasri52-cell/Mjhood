-- Enable the storage extension if not already enabled (usually enabled by default)
-- create extension if not exists "storage";

-- Create 'avatars' bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Create 'gallery' bucket
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Policy: Public Access (Read) for avatars
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy: Authenticated Upload for avatars
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Policy: Owner Update/Delete for avatars
create policy "Owner Update/Delete"
  on storage.objects for all
  using ( bucket_id = 'avatars' and auth.uid() = owner );


-- Policy: Public Access (Read) for gallery
create policy "Public Access Gallery"
  on storage.objects for select
  using ( bucket_id = 'gallery' );

-- Policy: Authenticated Upload for gallery
create policy "Authenticated Upload Gallery"
  on storage.objects for insert
  with check ( bucket_id = 'gallery' and auth.role() = 'authenticated' );

-- Policy: Owner Update/Delete for gallery
create policy "Owner Update/Delete Gallery"
  on storage.objects for all
  using ( bucket_id = 'gallery' and auth.uid() = owner );
