-- Steady: offline-first habit tracker
-- Run this in the Supabase SQL editor, then enable Anonymous Sign-Ins.

create extension if not exists "pgcrypto";

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 42),
  icon text not null,
  color text not null,
  frequency jsonb not null default '{"type":"daily"}'::jsonb,
  reminder_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_frequency check (
    frequency->>'type' in ('daily', 'weekdays')
  )
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  completed_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index if not exists habits_user_id_idx
  on public.habits(user_id);

create index if not exists check_ins_habit_date_idx
  on public.check_ins(habit_id, date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists habits_set_updated_at on public.habits;
create trigger habits_set_updated_at
before update on public.habits
for each row execute function public.set_updated_at();

alter table public.habits enable row level security;
alter table public.check_ins enable row level security;

drop policy if exists "Users read own habits" on public.habits;
create policy "Users read own habits"
on public.habits for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own habits" on public.habits;
create policy "Users insert own habits"
on public.habits for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own habits" on public.habits;
create policy "Users update own habits"
on public.habits for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own habits" on public.habits;
create policy "Users delete own habits"
on public.habits for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users read own check-ins" on public.check_ins;
create policy "Users read own check-ins"
on public.check_ins for select
to authenticated
using (
  exists (
    select 1
    from public.habits
    where habits.id = check_ins.habit_id
      and habits.user_id = (select auth.uid())
  )
);

drop policy if exists "Users insert own check-ins" on public.check_ins;
create policy "Users insert own check-ins"
on public.check_ins for insert
to authenticated
with check (
  exists (
    select 1
    from public.habits
    where habits.id = check_ins.habit_id
      and habits.user_id = (select auth.uid())
  )
);

drop policy if exists "Users update own check-ins" on public.check_ins;
create policy "Users update own check-ins"
on public.check_ins for update
to authenticated
using (
  exists (
    select 1
    from public.habits
    where habits.id = check_ins.habit_id
      and habits.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.habits
    where habits.id = check_ins.habit_id
      and habits.user_id = (select auth.uid())
  )
);

drop policy if exists "Users delete own check-ins" on public.check_ins;
create policy "Users delete own check-ins"
on public.check_ins for delete
to authenticated
using (
  exists (
    select 1
    from public.habits
    where habits.id = check_ins.habit_id
      and habits.user_id = (select auth.uid())
  )
);
