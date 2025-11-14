-- Run this file inside the Supabase SQL editor after creating your project.

-- Profiles are tied to authenticated users.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  timezone text,
  learn_tags text[] default '{}',
  teach_tags text[] default '{}',
  availability text[] default '{}',
  bio text,
  avatar_url text,
  inserted_at timestamp with time zone default timezone('utc', now())
);

-- Creator spotlight data (can be a superset of profiles or curated entries).
create table if not exists public.creators (
  id uuid primary key,
  name text not null,
  avatar text not null,
  bio text default '',
  languages text[] default '{}',
  specialty text[] default '{}',
  followers integer default 0,
  upcoming_sessions integer default 0,
  clip_count integer default 0
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tag text not null,
  host text not null,
  host_avatar text not null,
  demo_video_url text,
  language text default 'English',
  start_time timestamp with time zone not null,
  duration integer default 45,
  level text default 'Beginner',
  rating numeric default 5,
  status text default 'soon',
  blurb text default ''
);

create table if not exists public.clips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  creator_id uuid not null,
  preview_url text not null,
  video_url text,
  duration integer default 60,
  likes integer default 0,
  comments integer default 0,
  saves integer default 0,
  views integer default 0,
  tags text[] default '{}',
  cta_session_id uuid references public.sessions(id),
  created_at timestamp with time zone default timezone('utc', now())
);

create table if not exists public.clip_comments (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid references public.clips(id) on delete cascade,
  viewer_id text,
  author text,
  avatar text,
  role text default 'Tip',
  body text not null,
  timestamp timestamp with time zone default timezone('utc', now())
);

create table if not exists public.clip_saves (
  clip_id uuid references public.clips(id) on delete cascade,
  viewer_id text not null,
  inserted_at timestamp with time zone default timezone('utc', now()),
  primary key (clip_id, viewer_id)
);

create table if not exists public.clip_reactions (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid references public.clips(id) on delete cascade,
  viewer_id text not null,
  reaction text not null,
  inserted_at timestamp with time zone default timezone('utc', now())
);

create table if not exists public.creator_follows (
  creator_id uuid references public.creators(id) on delete cascade,
  viewer_id text not null,
  inserted_at timestamp with time zone default timezone('utc', now()),
  primary key (creator_id, viewer_id)
);

-- Basic row-level security policies (adjust once auth is wired).
alter table public.clips enable row level security;
alter table public.clip_comments enable row level security;
alter table public.clip_saves enable row level security;
alter table public.clip_reactions enable row level security;
alter table public.creator_follows enable row level security;

create policy "Allow read access to clips" on public.clips for select using (true);
create policy "Allow insert/update clips for authenticated users" on public.clips
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Allow read/write to clip relations" on public.clip_comments for all using (true) with check (true);
create policy "Allow read/write to clip saves" on public.clip_saves for all using (true) with check (true);
create policy "Allow read/write to reactions" on public.clip_reactions for all using (true) with check (true);
create policy "Allow read/write to creator follows" on public.creator_follows for all using (true) with check (true);
