-- v1 product decision: 5-point rating with semantic anchors, not BGG's 1-10.
-- No production users yet; this is a destructive change to the check constraint
-- that wouldn't be safe at any later point.

alter table public.collection_items
  drop constraint if exists collection_items_user_rating_check;

-- Normalize any pre-existing values (safety even though we expect none).
update public.collection_items
  set user_rating = case
    when user_rating is null then null
    when user_rating >= 9 then 5
    when user_rating = 8   then 4
    when user_rating between 6 and 7 then 3
    when user_rating between 4 and 5 then 2
    else 1
  end
  where user_rating is not null;

alter table public.collection_items
  add constraint collection_items_user_rating_check
  check (user_rating is null or user_rating between 1 and 5);

comment on column public.collection_items.user_rating is
  '5-point scale: 5=all-time favorite, 4=loved, 3=ok, 2=disappointing, 1=never again. Null=not played.';
