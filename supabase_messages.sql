-- Create messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  content text not null,
  is_read boolean default false
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies
-- 1. Users can see messages they sent or received
create policy "Users can see their own messages"
on public.messages for select
using ( auth.uid() = sender_id or auth.uid() = receiver_id );

-- 2. Users can send messages (sender_id must be themselves)
create policy "Users can insert messages"
on public.messages for insert
with check ( auth.uid() = sender_id );

-- Create a function to handle new messages (optional, for notifications later)
-- For now, just the table and policies are enough for basic chat.
