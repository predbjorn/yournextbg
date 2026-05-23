create table if not exists public.dismissals (
  user_id     uuid not null references auth.users(id) on delete cascade,
  game_id     text not null references public.games(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index if not exists dismissals_user_idx on public.dismissals (user_id);

alter table public.dismissals enable row level security;

drop policy if exists dismissals_self_all on public.dismissals;
create policy dismissals_self_all on public.dismissals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
