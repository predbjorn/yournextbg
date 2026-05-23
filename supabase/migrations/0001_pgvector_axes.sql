-- Enable pgvector for 12-dimensional similarity queries.
create extension if not exists vector;

-- Add a generated vector column derived from the existing scores jsonb.
-- This stays in lockstep with scores; no application code writes axes_vec directly.
alter table public.games
  add column if not exists axes_vec vector(12)
    generated always as (
      array[
        (scores ->> 0)::float8,
        (scores ->> 1)::float8,
        (scores ->> 2)::float8,
        (scores ->> 3)::float8,
        (scores ->> 4)::float8,
        (scores ->> 5)::float8,
        (scores ->> 6)::float8,
        (scores ->> 7)::float8,
        (scores ->> 8)::float8,
        (scores ->> 9)::float8,
        (scores ->> 10)::float8,
        (scores ->> 11)::float8
      ]::vector(12)
    ) stored;

-- IVFFlat index using L2 distance — fine for 12-D and a few thousand rows.
-- Lists count: rule of thumb sqrt(rows). Start at 16; rebuild later if catalog grows.
create index if not exists games_axes_vec_l2_idx
  on public.games using ivfflat (axes_vec vector_l2_ops)
  with (lists = 16);
