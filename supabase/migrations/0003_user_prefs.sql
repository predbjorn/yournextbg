create table if not exists public.user_prefs (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  theme            text not null default 'auto' check (theme in ('light','dark','auto')),
  default_lens     text not null default 'standard'
                     check (default_lens in ('standard','weight','feel','luck','equal')),
  hide_owned       boolean not null default true,
  hide_dismissed   boolean not null default true,
  min_similarity   numeric(3,2) not null default 0.70 check (min_similarity between 0 and 1),
  tier             text not null default 'free' check (tier in ('free','pro')),  -- reserved for future
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists user_prefs_updated_at on public.user_prefs;
create trigger user_prefs_updated_at
  before update on public.user_prefs
  for each row execute function public.set_updated_at();

alter table public.user_prefs enable row level security;

drop policy if exists user_prefs_self_read on public.user_prefs;
create policy user_prefs_self_read on public.user_prefs
  for select using (auth.uid() = user_id);

drop policy if exists user_prefs_self_write on public.user_prefs;
create policy user_prefs_self_write on public.user_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a row on signup.
create or replace function public.handle_new_user_prefs()
returns trigger as $$
begin
  insert into public.user_prefs (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_prefs();
