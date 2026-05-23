-- 0009_bgg_autosync_cron.sql
create extension if not exists pg_cron;
create extension if not exists pg_net;     -- used to call edge functions from cron

-- Idempotent: drop any prior copy of this cron job before (re)creating it.
-- cron.schedule() throws on duplicate jobname, which would break re-runs.
do $$ begin
  perform cron.unschedule('bgg_autosync_hourly');
exception
  when others then null;  -- job didn't exist; fine.
end $$;

-- Runs hourly. Picks up users with auto_sync_bgg=true whose last sync is stale.
select cron.schedule(
  'bgg_autosync_hourly',
  '0 * * * *',
  $$
  with stale_users as (
    select user_id from public.user_prefs
    where auto_sync_bgg = true
      and bgg_username is not null
      and (last_bgg_sync_at is null or last_bgg_sync_at < now() - interval '55 minutes')
    limit 50    -- fairness ceiling: max 50 users per tick
  )
  select net.http_post(
    url := current_setting('app.supabase_functions_url') || '/bgg-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('user_id', user_id, 'triggered_by', 'cron')
  )
  from stale_users;
  $$
);

-- One-off (run from Supabase SQL editor): set the two settings used above.
-- alter database postgres set app.supabase_functions_url = '<your project>.functions.supabase.co/functions/v1';
-- alter database postgres set app.service_role_key = '<service-role-key>';
