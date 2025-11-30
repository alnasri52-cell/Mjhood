-- Create reviews table
create table reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewer_id uuid references profiles(id) not null,
  talent_id uuid references profiles(id) not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  
  -- Ensure a user can only review a talent once
  constraint unique_review unique(reviewer_id, talent_id)
);

-- Enable RLS
alter table reviews enable row level security;

-- Policies
create policy "Reviews are public" 
  on reviews for select 
  using (true);

create policy "Users can create reviews" 
  on reviews for insert 
  with check (auth.uid() = reviewer_id);

-- Function to update the average rating on the profile
create or replace function update_profile_rating()
returns trigger as $$
begin
  update profiles
  set rating = (
    select avg(rating) 
    from reviews 
    where talent_id = new.talent_id
  )
  where id = new.talent_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run after a review is added
create trigger on_review_created
  after insert on reviews
  for each row execute procedure update_profile_rating();
