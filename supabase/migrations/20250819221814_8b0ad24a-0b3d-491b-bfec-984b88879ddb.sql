
-- 1) Table
create table if not exists public.global_leaderboard (
  id text primary key,                         -- matches your local user id (e.g., "user_...")
  username text not null default 'Explorer',
  daily_rounds integer not null default 0,
  daily_net_credits double precision not null default 0,
  total_rounds integer not null default 0,
  total_net_credits double precision not null default 0,
  date date not null default current_date,     -- used for "Daily" view (today’s players)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful index for daily view
create index if not exists global_leaderboard_date_idx
  on public.global_leaderboard (date);

-- 2) Trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_timestamp on public.global_leaderboard;
create trigger set_timestamp
before update on public.global_leaderboard
for each row execute procedure public.set_updated_at();

-- 3) Row Level Security
alter table public.global_leaderboard enable row level security;

-- Public read (leaderboard is public)
drop policy if exists "Anyone can view leaderboard" on public.global_leaderboard;
create policy "Anyone can view leaderboard"
  on public.global_leaderboard
  for select
  using (true);

-- Allow public inserts but constrain to today's rows (simple guard for a casual game)
drop policy if exists "Public can insert today's rows" on public.global_leaderboard;
create policy "Public can insert today's rows"
  on public.global_leaderboard
  for insert
  with check (date = current_date);

-- Allow public updates but only for today's rows (prevents editing historical rows)
drop policy if exists "Public can update today's rows" on public.global_leaderboard;
create policy "Public can update today's rows"
  on public.global_leaderboard
  for update
  using (date = current_date)
  with check (date = current_date);
