-- Create events table for MajorLeads Tracker
create table public.events (
  id uuid default gen_random_uuid() primary key,
  session_id uuid not null,
  visitor_id uuid not null,
  site_id uuid references public.sites(id) on delete cascade not null,
  event text not null,
  url text,
  path text,
  properties jsonb default '{}'::jsonb,
  timestamp bigint not null,
  created_at timestamptz default now() not null
);

-- Indexes for fast querying
create index events_site_id_idx on public.events(site_id);
create index events_visitor_id_idx on public.events(visitor_id);
create index events_session_id_idx on public.events(session_id);
create index events_event_idx on public.events(event);
create index events_timestamp_idx on public.events(timestamp);

-- Enable RLS (Assume it's insert-through-edge-function only, so read access is restricted to the platform/users)
alter table public.events enable row level security;

-- Policy: Users can view events for their own sites
create policy "Users can view events for their sites"
  on public.events
  for select
  using (
    exists (
      select 1 from public.sites
      where sites.id = events.site_id
      and sites.user_id = auth.uid()
    )
  );

-- Note: Inserts will be handled by Edge Functions using the Service Role key, bypassing RLS.
