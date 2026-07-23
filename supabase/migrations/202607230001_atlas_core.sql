-- GridOS public infrastructure atlas
-- Canonical records, provenance, disclosure controls, and a legally separate OSM store.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create schema if not exists atlas;
create schema if not exists osm;
create schema if not exists api;

revoke all on schema atlas from public, anon, authenticated;
revoke all on schema osm from public, anon, authenticated;
revoke all on schema api from public;

create table if not exists atlas.datasets (
  id text primary key,
  country_code text,
  provider text not null,
  title text not null,
  landing_page text not null,
  license_name text,
  license_url text,
  access_method text not null,
  update_frequency text,
  redistribution_allowed boolean not null default false,
  attribution_text text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint datasets_country_code_check
    check (country_code is null or country_code in ('KR', 'JP', 'TW', 'US'))
);

create table if not exists atlas.dataset_versions (
  id uuid primary key default gen_random_uuid(),
  dataset_id text not null references atlas.datasets(id) on delete restrict,
  version_label text not null,
  period_start date,
  period_end date,
  source_updated_at timestamptz,
  retrieved_at timestamptz not null,
  checksum_sha256 text,
  record_count bigint,
  raw_object_path text,
  status text not null default 'staged',
  created_at timestamptz not null default now(),
  constraint dataset_versions_status_check
    check (status in ('staged', 'validated', 'published', 'superseded', 'rejected')),
  constraint dataset_versions_period_check
    check (period_end is null or period_start is null or period_end >= period_start),
  unique (dataset_id, version_label)
);

create table if not exists atlas.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  dataset_id text not null references atlas.datasets(id) on delete restrict,
  dataset_version_id uuid references atlas.dataset_versions(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  records_read bigint not null default 0,
  records_written bigint not null default 0,
  error_summary text,
  workflow_run_url text,
  constraint ingestion_runs_status_check
    check (status in ('running', 'succeeded', 'failed', 'cancelled'))
);

create table if not exists atlas.raw_records (
  id bigint generated always as identity primary key,
  dataset_version_id uuid not null references atlas.dataset_versions(id) on delete cascade,
  source_record_key text not null,
  payload jsonb not null,
  payload_checksum_sha256 text,
  ingested_at timestamptz not null default now(),
  unique (dataset_version_id, source_record_key)
);

create table if not exists atlas.entities (
  id uuid primary key default gen_random_uuid(),
  entity_kind text not null,
  country_code text not null,
  canonical_name text not null,
  description text,
  website text,
  lifecycle_status text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entities_country_code_check
    check (country_code in ('KR', 'JP', 'TW', 'US')),
  constraint entities_kind_check
    check (entity_kind in (
      'facility', 'company', 'operator', 'owner', 'region',
      'network_hub', 'ixp', 'market', 'listed_security'
    )),
  constraint entities_lifecycle_status_check
    check (lifecycle_status in (
      'proposed', 'planned', 'construction', 'operational',
      'retired', 'cancelled', 'unknown'
    ))
);

create table if not exists atlas.entity_names (
  entity_id uuid not null references atlas.entities(id) on delete cascade,
  language_code text not null,
  name text not null,
  is_preferred boolean not null default true,
  source_dataset_version_id uuid references atlas.dataset_versions(id) on delete set null,
  primary key (entity_id, language_code, name),
  constraint entity_names_language_code_check
    check (language_code in ('ko', 'en', 'zh-CN', 'ja'))
);

create table if not exists atlas.listed_securities (
  entity_id uuid primary key references atlas.entities(id) on delete cascade,
  exchange_mic text not null,
  ticker text not null,
  currency_code text,
  isin text,
  security_type text not null default 'common_stock',
  source_dataset_version_id uuid not null references atlas.dataset_versions(id) on delete restrict,
  updated_at timestamptz not null default now(),
  constraint listed_securities_currency_check
    check (currency_code is null or char_length(currency_code) = 3),
  unique (exchange_mic, ticker)
);

create table if not exists atlas.assets (
  entity_id uuid primary key references atlas.entities(id) on delete cascade,
  asset_kind text not null,
  admin_area_1 text,
  admin_area_2 text,
  location_label text,
  disclosure_level text not null default 'admin_area_only',
  capacity_value numeric,
  capacity_unit text,
  commissioning_date date,
  retirement_date date,
  source_dataset_version_id uuid not null references atlas.dataset_versions(id) on delete restrict,
  source_record_key text,
  updated_at timestamptz not null default now(),
  constraint assets_kind_check
    check (asset_kind in (
      'data_center', 'pipeline', 'transmission_line', 'substation',
      'power_plant', 'industrial_complex', 'landing_station',
      'network_hub', 'ixp', 'generation_zone', 'demand_zone'
    )),
  constraint assets_disclosure_level_check
    check (disclosure_level in (
      'exact_public', 'generalized_public', 'admin_area_only', 'withheld'
    )),
  constraint assets_dates_check
    check (retirement_date is null or commissioning_date is null or retirement_date >= commissioning_date)
);

create table if not exists atlas.geometries (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references atlas.entities(id) on delete cascade,
  geometry_role text not null default 'display',
  geom extensions.geometry(Geometry, 4326) not null,
  disclosure_level text not null,
  precision_m integer,
  is_primary boolean not null default false,
  source_dataset_version_id uuid not null references atlas.dataset_versions(id) on delete restrict,
  method text not null default 'source_published',
  created_at timestamptz not null default now(),
  constraint geometries_disclosure_level_check
    check (disclosure_level in (
      'exact_public', 'generalized_public', 'admin_area_only', 'withheld'
    )),
  constraint geometries_method_check
    check (method in ('source_published', 'administrative_centroid', 'manual_verification')),
  constraint geometries_precision_check
    check (precision_m is null or precision_m >= 0)
);

create unique index if not exists geometries_one_primary_per_entity
  on atlas.geometries(entity_id) where is_primary;
create index if not exists geometries_geom_gix on atlas.geometries using gist (geom);

create table if not exists atlas.relations (
  id uuid primary key default gen_random_uuid(),
  subject_entity_id uuid not null references atlas.entities(id) on delete cascade,
  relation_type text not null,
  object_entity_id uuid not null references atlas.entities(id) on delete cascade,
  valid_from date,
  valid_to date,
  verification_method text not null default 'source_stated',
  confidence numeric(4, 3),
  disclosure_level text not null default 'exact_public',
  source_dataset_version_id uuid not null references atlas.dataset_versions(id) on delete restrict,
  source_record_key text,
  created_at timestamptz not null default now(),
  constraint relations_type_check
    check (relation_type in (
      'OPERATED_BY', 'OWNED_BY', 'CONNECTED_TO', 'SERVED_BY',
      'LOCATED_IN', 'SUBSIDIARY_OF', 'LISTED_AS'
    )),
  constraint relations_verification_method_check
    check (verification_method in (
      'source_stated', 'regulatory_filing', 'operator_disclosure',
      'administrative_match', 'proximity_inference'
    )),
  constraint relations_confidence_check
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint relations_disclosure_level_check
    check (disclosure_level in (
      'exact_public', 'generalized_public', 'admin_area_only', 'withheld'
    )),
  constraint relations_dates_check
    check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint relations_no_self_loop_check
    check (subject_entity_id <> object_entity_id)
);

create index if not exists relations_subject_idx
  on atlas.relations(subject_entity_id, relation_type);
create index if not exists relations_object_idx
  on atlas.relations(object_entity_id, relation_type);

create table if not exists atlas.observations (
  id uuid primary key default gen_random_uuid(),
  subject_entity_id uuid not null references atlas.entities(id) on delete cascade,
  metric_key text not null,
  numeric_value numeric,
  text_value text,
  unit text,
  period_start date,
  period_end date,
  observed_at timestamptz,
  quality text not null default 'ok',
  method text not null default 'source_published',
  confidence numeric(4, 3),
  disclosure_level text not null default 'exact_public',
  source_dataset_version_id uuid not null references atlas.dataset_versions(id) on delete restrict,
  source_record_key text,
  created_at timestamptz not null default now(),
  constraint observations_value_check
    check (numeric_value is not null or text_value is not null),
  constraint observations_period_check
    check (period_end is null or period_start is null or period_end >= period_start),
  constraint observations_quality_check
    check (quality in ('ok', 'partial', 'estimated', 'missing', 'superseded')),
  constraint observations_method_check
    check (method in (
      'source_published', 'calculated', 'administrative_aggregate', 'manual_verification'
    )),
  constraint observations_confidence_check
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint observations_disclosure_level_check
    check (disclosure_level in (
      'exact_public', 'generalized_public', 'admin_area_only', 'withheld'
    ))
);

create index if not exists observations_subject_metric_idx
  on atlas.observations(subject_entity_id, metric_key, period_end desc);

create table if not exists atlas.external_ids (
  entity_id uuid not null references atlas.entities(id) on delete cascade,
  namespace text not null,
  external_id text not null,
  source_dataset_version_id uuid references atlas.dataset_versions(id) on delete set null,
  primary key (namespace, external_id),
  unique (entity_id, namespace)
);

-- OSM-derived material is stored and licensed independently. No OSM geometry is copied
-- into atlas.geometries by this schema.
create table if not exists osm.imports (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_timestamp timestamptz,
  retrieved_at timestamptz not null,
  license_name text not null default 'ODbL 1.0',
  attribution_text text not null default '© OpenStreetMap contributors',
  checksum_sha256 text,
  status text not null default 'staged',
  constraint osm_imports_status_check
    check (status in ('staged', 'validated', 'published', 'superseded', 'rejected'))
);

create table if not exists osm.features (
  import_id uuid not null references osm.imports(id) on delete cascade,
  osm_type text not null,
  osm_id bigint not null,
  version integer,
  tags jsonb not null default '{}'::jsonb,
  geom extensions.geometry(Geometry, 4326) not null,
  primary key (import_id, osm_type, osm_id),
  constraint osm_features_type_check
    check (osm_type in ('node', 'way', 'relation'))
);

create index if not exists osm_features_geom_gix on osm.features using gist (geom);

-- Public Data API views: only explicitly publishable fields and rows cross this boundary.
create or replace view api.datasets
with (security_barrier = true) as
select
  d.id,
  d.country_code,
  d.provider,
  d.title,
  d.landing_page,
  d.license_name,
  d.license_url,
  d.access_method,
  d.update_frequency,
  d.attribution_text,
  v.id as latest_version_id,
  v.version_label,
  v.period_start,
  v.period_end,
  v.source_updated_at,
  v.retrieved_at,
  v.record_count
from atlas.datasets d
left join lateral (
  select dv.*
  from atlas.dataset_versions dv
  where dv.dataset_id = d.id and dv.status = 'published'
  order by dv.retrieved_at desc
  limit 1
) v on true
where d.is_active and d.redistribution_allowed;

create or replace view api.facilities
with (security_barrier = true) as
select
  e.id,
  e.country_code,
  e.canonical_name,
  e.description,
  e.website,
  e.lifecycle_status,
  a.asset_kind,
  a.admin_area_1,
  a.admin_area_2,
  a.location_label,
  a.disclosure_level,
  a.capacity_value,
  a.capacity_unit,
  a.commissioning_date,
  a.retirement_date,
  a.source_dataset_version_id,
  case
    when g.disclosure_level <> 'withheld'
      then extensions.st_asgeojson(g.geom)::jsonb
    else null
  end as geometry,
  g.precision_m,
  g.method as geometry_method
from atlas.entities e
join atlas.assets a on a.entity_id = e.id
left join atlas.geometries g
  on g.entity_id = e.id and g.is_primary and g.disclosure_level <> 'withheld'
where a.disclosure_level <> 'withheld';

create or replace view api.entity_names
with (security_barrier = true) as
select n.entity_id, n.language_code, n.name, n.is_preferred
from atlas.entity_names n
where exists (
  select 1
  from atlas.entities e
  left join atlas.assets a on a.entity_id = e.id
  where e.id = n.entity_id
    and (a.entity_id is null or a.disclosure_level <> 'withheld')
);

create or replace view api.listed_securities
with (security_barrier = true) as
select
  e.id,
  e.country_code,
  e.canonical_name,
  e.website,
  s.exchange_mic,
  s.ticker,
  s.currency_code,
  s.isin,
  s.security_type,
  s.source_dataset_version_id
from atlas.listed_securities s
join atlas.entities e on e.id = s.entity_id
where e.entity_kind = 'listed_security';

create or replace view api.relations
with (security_barrier = true) as
select
  r.id,
  r.subject_entity_id,
  s.canonical_name as subject_name,
  r.relation_type,
  r.object_entity_id,
  o.canonical_name as object_name,
  r.valid_from,
  r.valid_to,
  r.verification_method,
  r.confidence,
  r.source_dataset_version_id
from atlas.relations r
join atlas.entities s on s.id = r.subject_entity_id
join atlas.entities o on o.id = r.object_entity_id
where r.disclosure_level <> 'withheld';

create or replace view api.observations
with (security_barrier = true) as
select
  ob.id,
  ob.subject_entity_id,
  e.country_code,
  e.canonical_name as subject_name,
  ob.metric_key,
  ob.numeric_value,
  ob.text_value,
  ob.unit,
  ob.period_start,
  ob.period_end,
  ob.observed_at,
  ob.quality,
  ob.method,
  ob.confidence,
  ob.source_dataset_version_id
from atlas.observations ob
join atlas.entities e on e.id = ob.subject_entity_id
where ob.disclosure_level <> 'withheld'
  and ob.quality <> 'superseded';

grant usage on schema api to anon, authenticated;
grant select on all tables in schema api to anon, authenticated;
alter default privileges in schema api
  grant select on tables to anon, authenticated;

comment on schema atlas is
  'Canonical infrastructure graph. Not exposed directly through the public Data API.';
comment on schema osm is
  'Legally separate ODbL store. Keep attribution and derived-database handling independent.';
comment on schema api is
  'Read-only public views. Add this schema to Supabase API settings; never expose atlas or osm.';
comment on column atlas.assets.disclosure_level is
  'exact_public, generalized_public, admin_area_only, or withheld. Source publication governs this value.';
comment on column atlas.relations.verification_method is
  'A proximity inference is never represented as a source-stated physical connection.';
comment on table atlas.listed_securities is
  'Investable instruments linked from companies with a LISTED_AS relation; not investment advice.';
