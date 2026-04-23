-- ============================================================================
-- SkillSprint database schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- Profiles (mirrors auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  full_name   text,
  avatar_url  text,
  bio         text,
  is_creator  boolean default false,
  created_at  timestamptz default now()
);

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Bootcamps ----------
create table if not exists public.bootcamps (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,
  title        text not null,
  tagline      text,
  description  text,
  cover_url    text,
  category     text,               -- e.g. 'AI', 'Web Dev', 'Data'
  difficulty   text check (difficulty in ('beginner','intermediate','advanced')),
  creator_id   uuid references public.profiles(id) on delete set null,
  is_published boolean default false,
  created_at   timestamptz default now()
);

create index if not exists bootcamps_category_idx on public.bootcamps (category);
create index if not exists bootcamps_creator_idx  on public.bootcamps (creator_id);

-- ---------- Daily lessons (1 per day, max 7) ----------
create table if not exists public.lessons (
  id           uuid primary key default uuid_generate_v4(),
  bootcamp_id  uuid not null references public.bootcamps(id) on delete cascade,
  day_number   int  not null check (day_number between 1 and 7),
  title        text not null,
  content_md   text,       -- markdown body
  video_url    text,
  estimated_minutes int default 20,
  unique (bootcamp_id, day_number)
);

-- ---------- Quiz questions per lesson ----------
create table if not exists public.quiz_questions (
  id           uuid primary key default uuid_generate_v4(),
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  prompt       text not null,
  options      jsonb not null,  -- e.g. [{ "id":"a","text":"..." }, ...]
  correct_id   text not null,
  explanation  text,
  position     int default 0
);

-- ---------- Enrollments ----------
create table if not exists public.enrollments (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  bootcamp_id  uuid not null references public.bootcamps(id) on delete cascade,
  started_at   timestamptz default now(),
  completed_at timestamptz,
  unique (user_id, bootcamp_id)
);

-- ---------- Per-day progress ----------
create table if not exists public.lesson_progress (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  completed     boolean default false,
  quiz_score    int,
  completed_at  timestamptz,
  unique (user_id, lesson_id)
);

-- ---------- Certificates ----------
create table if not exists public.certificates (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  bootcamp_id   uuid not null references public.bootcamps(id) on delete cascade,
  issued_at     timestamptz default now(),
  serial        text unique default ('SS-' || upper(substr(md5(random()::text),1,8))),
  unique (user_id, bootcamp_id)
);

-- ---------- Forum posts (per bootcamp) ----------
create table if not exists public.forum_posts (
  id           uuid primary key default uuid_generate_v4(),
  bootcamp_id  uuid not null references public.bootcamps(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  parent_id    uuid references public.forum_posts(id) on delete cascade,
  body         text not null,
  created_at   timestamptz default now()
);

create index if not exists forum_posts_bootcamp_idx on public.forum_posts (bootcamp_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles        enable row level security;
alter table public.bootcamps       enable row level security;
alter table public.lessons         enable row level security;
alter table public.quiz_questions  enable row level security;
alter table public.enrollments     enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.certificates    enable row level security;
alter table public.forum_posts     enable row level security;

-- Profiles: public read, self-update
create policy "profiles_public_read"  on public.profiles for select using (true);
create policy "profiles_self_update"  on public.profiles for update using (auth.uid() = id);

-- Bootcamps: published = everyone, creator can do anything on own
create policy "bootcamps_public_read" on public.bootcamps for select using (is_published = true or creator_id = auth.uid());
create policy "bootcamps_creator_all" on public.bootcamps for all    using (creator_id = auth.uid()) with check (creator_id = auth.uid());

-- Lessons & quizzes: readable if parent bootcamp is readable, writable by creator
create policy "lessons_read"          on public.lessons        for select using (
  exists (select 1 from public.bootcamps b where b.id = bootcamp_id and (b.is_published or b.creator_id = auth.uid()))
);
create policy "lessons_creator_write" on public.lessons        for all using (
  exists (select 1 from public.bootcamps b where b.id = bootcamp_id and b.creator_id = auth.uid())
) with check (
  exists (select 1 from public.bootcamps b where b.id = bootcamp_id and b.creator_id = auth.uid())
);

create policy "quiz_read"             on public.quiz_questions for select using (
  exists (select 1 from public.lessons l join public.bootcamps b on b.id = l.bootcamp_id
          where l.id = lesson_id and (b.is_published or b.creator_id = auth.uid()))
);
create policy "quiz_creator_write"    on public.quiz_questions for all using (
  exists (select 1 from public.lessons l join public.bootcamps b on b.id = l.bootcamp_id
          where l.id = lesson_id and b.creator_id = auth.uid())
) with check (
  exists (select 1 from public.lessons l join public.bootcamps b on b.id = l.bootcamp_id
          where l.id = lesson_id and b.creator_id = auth.uid())
);

-- Enrollments & progress: self-only
create policy "enroll_self_read"   on public.enrollments     for select using (user_id = auth.uid());
create policy "enroll_self_write"  on public.enrollments     for all    using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "progress_self_read"  on public.lesson_progress for select using (user_id = auth.uid());
create policy "progress_self_write" on public.lesson_progress for all    using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Certificates: owner reads, nobody writes directly (use a function later)
create policy "cert_self_read" on public.certificates for select using (user_id = auth.uid());

-- Forum: readable if bootcamp is readable; authenticated users can post; authors can edit own
create policy "forum_read" on public.forum_posts for select using (
  exists (select 1 from public.bootcamps b where b.id = bootcamp_id and (b.is_published or b.creator_id = auth.uid()))
);
create policy "forum_write" on public.forum_posts for insert with check (author_id = auth.uid());
create policy "forum_edit"  on public.forum_posts for update using (author_id = auth.uid());
create policy "forum_del"   on public.forum_posts for delete using (author_id = auth.uid());

-- ============================================================================
-- Seed data (optional — remove in production)
-- ============================================================================
insert into public.bootcamps (slug, title, tagline, description, category, difficulty, is_published)
values
  ('prompt-engineering-7d', 'Prompt Engineering in 7 Days', 'Ship production-ready LLM prompts by Sunday.', 'A hands-on sprint covering system prompts, few-shot examples, chain-of-thought, evaluation, and deployment.', 'AI', 'beginner', true),
  ('vector-db-crash',       'Vector Databases Crash Course', 'From embeddings to RAG, in a week.',             'Learn embeddings, pgvector, hybrid search, and build a tiny RAG app by day 7.',                              'AI', 'intermediate', true),
  ('nextjs-app-router-7d',  'Next.js App Router Sprint',     'Master the App Router paradigm — fast.',         'Server components, streaming, server actions, parallel routes, and caching — daily reps.',                   'Web Dev', 'intermediate', true)
on conflict (slug) do nothing;
