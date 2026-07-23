-- Existing regional aggregate dataset, made reproducible for a fresh Supabase project.
-- These public-schema tables are read-only to browser roles and writable only by service_role.

create table if not exists public.sources (
  id text primary key,
  provider text not null,
  title text not null,
  url text not null,
  collected_at timestamptz not null,
  base_date date,
  row_count bigint not null check (row_count > 0),
  update_cycle text,
  license_note text,
  access_method text not null
);

create table if not exists public.region_profiles (
  region_code text primary key,
  region_name text not null
);

create table if not exists public.region_metrics (
  id bigint generated always as identity primary key,
  region_code text not null references public.region_profiles(region_code) on delete cascade,
  metric_key text not null,
  value numeric,
  unit text not null,
  source_id text not null references public.sources(id) on delete restrict,
  base_date date,
  quality text not null,
  evidence text,
  created_at timestamptz not null default now(),
  constraint region_metrics_quality_check check (quality in ('ok', 'partial', 'missing')),
  unique (region_code, metric_key)
);

create index if not exists region_metrics_region_idx
  on public.region_metrics(region_code);
create index if not exists region_metrics_metric_idx
  on public.region_metrics(metric_key);

create table if not exists public.ingestion_runs (
  id bigint generated always as identity primary key,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  source_count integer,
  region_count integer,
  error_summary text,
  constraint public_ingestion_runs_status_check
    check (status in ('running', 'success', 'failed'))
);

alter table public.sources enable row level security;
alter table public.region_profiles enable row level security;
alter table public.region_metrics enable row level security;
alter table public.ingestion_runs enable row level security;

drop policy if exists "public read sources" on public.sources;
create policy "public read sources"
  on public.sources for select
  to anon, authenticated
  using (true);

drop policy if exists "public read region profiles" on public.region_profiles;
create policy "public read region profiles"
  on public.region_profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "public read region metrics" on public.region_metrics;
create policy "public read region metrics"
  on public.region_metrics for select
  to anon, authenticated
  using (true);

revoke all on public.sources from anon, authenticated;
revoke all on public.region_profiles from anon, authenticated;
revoke all on public.region_metrics from anon, authenticated;
revoke all on public.ingestion_runs from anon, authenticated;

grant select on public.sources to anon, authenticated;
grant select on public.region_profiles to anon, authenticated;
grant select on public.region_metrics to anon, authenticated;

grant all on public.sources to service_role;
grant all on public.region_profiles to service_role;
grant all on public.region_metrics to service_role;
grant all on public.ingestion_runs to service_role;
grant usage, select on all sequences in schema public to service_role;

comment on table public.region_metrics is
  'Published regional aggregates used by the first GridOS release. Facility records live in atlas.';
comment on table public.ingestion_runs is
  'Private operational log. No anon/authenticated read policy is defined.';
