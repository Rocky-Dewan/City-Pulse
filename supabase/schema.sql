-- ============================================================
-- CityPulse — Supabase Database Schema (v2 — with Gamification)
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Extensions ────────────────────────────────────────────────────────────
create extension if not exists postgis;

-- ── 2. Tables ─────────────────────────────────────────────────────────────────

-- Profiles (extends auth.users, auto-created on signup via trigger)
-- TASK 5: Added `points` and `badge` columns for gamification
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  username    text        unique not null,
  full_name   text        not null default '',
  role        text        not null default 'user' check (role in ('user', 'admin')),
  avatar_url  text,
  points      integer     not null default 0 check (points >= 0),
  badge       text        not null default 'none'
                          check (badge in ('none', 'bronze', 'silver', 'gold', 'platinum')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  public.profiles            is 'Public user profiles, linked to auth.users.';
comment on column public.profiles.role       is 'Role: user (default) or admin.';
comment on column public.profiles.points     is 'Gamification points. +100 per resolved report.';
comment on column public.profiles.badge      is 'Current badge tier based on points.';

-- Reports
-- TASK 2: Added `location_text` for manual location entry
create table if not exists public.reports (
  id            uuid             primary key default gen_random_uuid(),
  user_id       uuid             not null references public.profiles(id) on delete cascade,
  title         text             not null check (char_length(title) >= 5 and char_length(title) <= 120),
  description   text             not null check (char_length(description) >= 20),
  category      text             not null
                                 check (category in ('pothole','streetlight','flooding','garbage','vandalism','other')),
  status        text             not null default 'pending'
                                 check (status in ('pending','in_progress','resolved')),
  image_url     text,
  upvotes       integer          not null default 0 check (upvotes >= 0),
  latitude      double precision,
  longitude     double precision,
  location_text text,
  location      geography(Point, 4326),
  created_at    timestamptz      not null default now(),
  updated_at    timestamptz      not null default now()
);

comment on table  public.reports               is 'Citizen-submitted urban issue reports.';
comment on column public.reports.location_text is 'Manual text location entry (address / landmark).';
comment on column public.reports.location      is 'PostGIS geography point, auto-populated from latitude/longitude.';

-- Upvotes (prevents duplicate votes, one row per user per report)
create table if not exists public.upvotes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  report_id   uuid        not null references public.reports(id)  on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, report_id)
);

comment on table public.upvotes is 'Tracks which users upvoted which reports. Unique per (user, report).';

-- ── 3. Indexes ────────────────────────────────────────────────────────────────
create index if not exists idx_reports_location    on public.reports using gist(location);
create index if not exists idx_reports_status      on public.reports(status);
create index if not exists idx_reports_category    on public.reports(category);
create index if not exists idx_reports_user_id     on public.reports(user_id);
create index if not exists idx_reports_upvotes     on public.reports(upvotes desc);
create index if not exists idx_reports_created_at  on public.reports(created_at desc);
create index if not exists idx_upvotes_user_report on public.upvotes(user_id, report_id);

-- ── 4. Row Level Security (RLS) ───────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.reports  enable row level security;
alter table public.upvotes  enable row level security;

-- Profiles policies
create policy "profiles_select_public"
  on public.profiles for select using (true);

create policy "profiles_insert_own"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id);

-- Reports policies
create policy "reports_select_public"
  on public.reports for select using (true);

create policy "reports_insert_authed"
  on public.reports for insert with check (auth.uid() = user_id);

drop policy if exists "reports_update_own" on public.reports;

create policy "reports_update_own"
  on public.reports for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    AND status = (SELECT status FROM public.reports WHERE id = reports.id)
  );

create policy "reports_delete_own"
  on public.reports for delete using (auth.uid() = user_id);

-- Upvotes policies
create policy "upvotes_select_public"
  on public.upvotes for select using (true);

create policy "upvotes_insert_authed"
  on public.upvotes for insert with check (auth.uid() = user_id);

create policy "upvotes_delete_own"
  on public.upvotes for delete using (auth.uid() = user_id);

-- ── 5. Trigger Functions ──────────────────────────────────────────────────────

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      nullif(lower(replace(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'), '__', '_')), ''),
      'user_' || substring(new.id::text, 1, 8)
    ),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-populate PostGIS location from latitude/longitude
create or replace function public.update_report_location()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := st_makepoint(new.longitude, new.latitude)::geography;
  end if;
  return new;
end;
$$;

drop trigger if exists set_report_location on public.reports;
create trigger set_report_location
  before insert or update of latitude, longitude
  on public.reports
  for each row execute function public.update_report_location();

-- Auto-update updated_at timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ── 6. TASK 5: Gamification Triggers ─────────────────────────────────────────

-- Helper: compute badge tier from a points value
create or replace function public.compute_badge(p_points integer)
returns text
language plpgsql
immutable
as $$
begin
  if    p_points >= 100000 then return 'platinum';
  elsif p_points >= 10000  then return 'gold';
  elsif p_points >= 5000   then return 'silver';
  elsif p_points >= 1000   then return 'bronze';
  else                          return 'none';
  end if;
end;
$$;

-- Award 100 points when a report's status changes TO 'resolved'
-- Then recalculate and update the reporter's badge
create or replace function public.award_points_on_resolve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_points integer;
  v_new_badge  text;
begin
  -- Only fire when status transitions into 'resolved'
  if new.status = 'resolved' and (old.status is null or old.status <> 'resolved') then
    -- Atomically add 100 points; capture the new total
    update public.profiles
       set points = points + 100
     where id = new.user_id
    returning points into v_new_points;

    if v_new_points is not null then
      v_new_badge := public.compute_badge(v_new_points);
      update public.profiles
         set badge = v_new_badge
       where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_report_resolved on public.reports;
create trigger on_report_resolved
  after update of status on public.reports
  for each row execute function public.award_points_on_resolve();

-- ── 7. RPC Functions ──────────────────────────────────────────────────────────

-- RPC: atomic upvote increment/decrement (prevents race conditions)
create or replace function public.increment_upvotes(report_id uuid, delta integer)
returns integer language sql security definer as $$
  update public.reports
  set upvotes = greatest(0, upvotes + delta)
  where id = report_id
  returning upvotes;
$$;

-- Fetch reports within a given radius (metres) of a lat/lon point
-- TASK 5: Returns reporter profile data for the feed
-- Usage: supabase.rpc('get_nearby_reports', { lat, lon, radius_meters: 10000 })
create or replace function public.get_nearby_reports(
  lat            double precision,
  lon            double precision,
  radius_meters  integer default 10000
)
returns table (
  id               uuid,
  user_id          uuid,
  title            text,
  description      text,
  category         text,
  status           text,
  image_url        text,
  upvotes          integer,
  latitude         double precision,
  longitude        double precision,
  location_text    text,
  created_at       timestamptz,
  updated_at       timestamptz,
  reporter_name    text,
  reporter_avatar  text,
  reporter_points  integer,
  reporter_badge   text
)
language sql
stable
security invoker
as $$
  select
    r.id, r.user_id, r.title, r.description,
    r.category, r.status, r.image_url,
    r.upvotes, r.latitude, r.longitude, r.location_text,
    r.created_at, r.updated_at,
    coalesce(p.full_name, p.username, 'Anonymous') as reporter_name,
    p.avatar_url  as reporter_avatar,
    coalesce(p.points, 0) as reporter_points,
    coalesce(p.badge, 'none')  as reporter_badge
  from public.reports r
  left join public.profiles p on r.user_id = p.id
  where
    r.location is not null
    and st_dwithin(
      r.location,
      st_makepoint(lon, lat)::geography,
      radius_meters
    )
  order by r.upvotes desc, r.created_at desc;
$$;

-- ── 8. Supabase Storage ───────────────────────────────────────────────────────
-- Create these buckets in the Dashboard → Storage → New bucket:
--   • "report-images"  (public)
--   • "avatars"        (public)
--
-- Or run:
-- insert into storage.buckets (id, name, public) values ('report-images', 'report-images', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
--
-- create policy "storage_public_read_reports" on storage.objects for select using (bucket_id = 'report-images');
-- create policy "storage_authed_upload_reports" on storage.objects for insert with check (bucket_id = 'report-images' and auth.role() = 'authenticated');
-- create policy "storage_public_read_avatars" on storage.objects for select using (bucket_id = 'avatars');
-- create policy "storage_authed_upload_avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
-- create policy "storage_authed_delete_avatars" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── 9. Promote first admin ────────────────────────────────────────────────────
-- After signing up, promote yourself:
-- UPDATE public.profiles SET role = 'admin' WHERE username = 'your_username';

-- ── Done ──────────────────────────────────────────────────────────────────────
-- ✅ postgis enabled
-- ✅ Tables: profiles (with points/badge), reports (with location_text), upvotes
-- ✅ RLS policies active on all tables
-- ✅ Triggers: auto-profile, PostGIS location, updated_at, gamification points+badge
-- ✅ RPC: get_nearby_reports (with reporter profile data)
