-- ============================================================
-- ESTIMIO — Schema Supabase PostgreSQL
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── ENUM TYPES ───────────────────────────────────────────────────────────────

create type user_role as enum ('admin', 'agent', 'collaborator', 'viewer');
create type client_status as enum ('prospect', 'active', 'closed', 'inactive');
create type client_interest as enum ('acquisto', 'vendita', 'locazione', 'investimento', 'altro');
create type property_type as enum (
  'appartamento', 'villa', 'villetta', 'attico', 'loft',
  'monolocale', 'bilocale', 'trilocale', 'quadrilocale',
  'ufficio', 'negozio', 'capannone', 'terreno', 'box', 'altro'
);
create type contract_type as enum ('vendita', 'locazione', 'asta');
create type property_condition as enum ('nuovo', 'ottimo', 'buono', 'discreto', 'da_ristrutturare', 'ristrutturato');
create type energy_class as enum ('A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G');
create type heating_type as enum ('autonomo', 'centralizzato', 'teleriscaldamento', 'assente');
create type valuation_status as enum ('draft', 'in_progress', 'completed', 'archived');
create type comparable_source as enum ('idealista', 'immobiliare.it', 'casa.it', 'wikicasa', 'agenzia', 'omi', 'altro');
create type visit_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type report_type as enum ('valuation', 'zone', 'comparable', 'summary');

-- ─── PROFILES ─────────────────────────────────────────────────────────────────

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  email        text not null,
  role         user_role not null default 'agent',
  agency_name  text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── CLIENTS ──────────────────────────────────────────────────────────────────

create table clients (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  email       text,
  phone       text,
  status      client_status not null default 'prospect',
  interest    client_interest,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── PROPERTIES ───────────────────────────────────────────────────────────────

create table properties (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles(id) on delete cascade,
  client_id         uuid references clients(id) on delete set null,
  type              property_type not null default 'appartamento',
  contract_type     contract_type not null default 'vendita',
  address           text not null,
  city              text not null,
  postal_code       text,
  province          text,
  zone              text,
  microzone         text,
  latitude          numeric(10, 7),
  longitude         numeric(10, 7),
  commercial_area   numeric(8, 2) not null,
  usable_area       numeric(8, 2),
  rooms             integer,
  bathrooms         integer,
  floor             integer,
  total_floors      integer,
  elevator          boolean not null default false,
  condition         property_condition not null default 'buono',
  build_year        integer,
  renovated_year    integer,
  exposure          text,
  balcony           boolean not null default false,
  terrace           boolean not null default false,
  garden            boolean not null default false,
  garage            boolean not null default false,
  parking_space     boolean not null default false,
  cellar            boolean not null default false,
  energy_class      energy_class,
  heating_type      heating_type,
  condo_fees        numeric(8, 2),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── VALUATIONS ───────────────────────────────────────────────────────────────

create table valuations (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null references profiles(id) on delete cascade,
  property_id            uuid not null references properties(id) on delete cascade,
  client_id              uuid references clients(id) on delete set null,
  status                 valuation_status not null default 'draft',
  estimated_min          numeric(12, 2),
  estimated_avg          numeric(12, 2),
  estimated_max          numeric(12, 2),
  suggested_listing_price numeric(12, 2),
  confidence_score       numeric(4, 3),
  valuation_notes        text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ─── COMPARABLES ──────────────────────────────────────────────────────────────

create table comparables (
  id               uuid primary key default uuid_generate_v4(),
  valuation_id     uuid references valuations(id) on delete set null,
  source           comparable_source not null default 'altro',
  source_url       text,
  title            text not null,
  address          text not null,
  city             text not null,
  zone             text,
  latitude         numeric(10, 7),
  longitude        numeric(10, 7),
  property_type    property_type not null default 'appartamento',
  price            numeric(12, 2) not null,
  area_sqm         numeric(8, 2) not null,
  price_per_sqm    numeric(8, 2) not null,
  condition        property_condition,
  floor            integer,
  rooms            integer,
  bathrooms        integer,
  energy_class     energy_class,
  image_url        text,
  similarity_score numeric(4, 3),
  distance_km      numeric(6, 3),
  listing_date     date,
  metadata         jsonb,
  created_at       timestamptz not null default now()
);

-- ─── VISITS ───────────────────────────────────────────────────────────────────

create table visits (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  property_id  uuid not null references properties(id) on delete cascade,
  client_id    uuid references clients(id) on delete set null,
  scheduled_at timestamptz not null,
  status       visit_status not null default 'scheduled',
  feedback     text,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ─── REPORTS ──────────────────────────────────────────────────────────────────

create table reports (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  valuation_id  uuid references valuations(id) on delete set null,
  property_id   uuid references properties(id) on delete set null,
  client_id     uuid references clients(id) on delete set null,
  file_path     text,
  report_type   report_type not null default 'valuation',
  created_at    timestamptz not null default now()
);

-- ─── FAVORITES ────────────────────────────────────────────────────────────────

create table favorites (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references profiles(id) on delete cascade,
  comparable_id  uuid not null references comparables(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique(user_id, comparable_id)
);

-- ─── SAVED SEARCHES ───────────────────────────────────────────────────────────

create table saved_searches (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null,
  filters    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ─── ZONE INSIGHTS ────────────────────────────────────────────────────────────

create table zone_insights (
  id              uuid primary key default uuid_generate_v4(),
  city            text not null,
  zone            text not null,
  microzone       text,
  avg_price_sqm   numeric(8, 2) not null,
  min_price_sqm   numeric(8, 2) not null,
  max_price_sqm   numeric(8, 2) not null,
  listings_count  integer not null default 0,
  sold_count      integer not null default 0,
  rent_count      integer not null default 0,
  trend_delta     numeric(6, 2) not null default 0,
  period_label    text not null,
  metadata        jsonb,
  updated_at      timestamptz not null default now()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

create index idx_clients_user_id on clients(user_id);
create index idx_properties_user_id on properties(user_id);
create index idx_properties_city on properties(city);
create index idx_valuations_user_id on valuations(user_id);
create index idx_valuations_property_id on valuations(property_id);
create index idx_valuations_status on valuations(status);
create index idx_comparables_valuation_id on comparables(valuation_id);
create index idx_comparables_city on comparables(city);
create index idx_comparables_zone on comparables(zone);
create index idx_visits_user_id on visits(user_id);
create index idx_reports_user_id on reports(user_id);
create index idx_favorites_user_id on favorites(user_id);
create index idx_zone_insights_city_zone on zone_insights(city, zone);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_clients_updated_at before update on clients
  for each row execute procedure update_updated_at();

create trigger set_properties_updated_at before update on properties
  for each row execute procedure update_updated_at();

create trigger set_valuations_updated_at before update on valuations
  for each row execute procedure update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table clients enable row level security;
alter table properties enable row level security;
alter table valuations enable row level security;
alter table comparables enable row level security;
alter table visits enable row level security;
alter table reports enable row level security;
alter table favorites enable row level security;
alter table saved_searches enable row level security;
alter table zone_insights enable row level security;

-- ─── Profiles ─────────────────────────────────────────────────────────────────

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ─── Clients ──────────────────────────────────────────────────────────────────

create policy "Users manage own clients"
  on clients for all using (auth.uid() = user_id);

-- ─── Properties ───────────────────────────────────────────────────────────────

create policy "Users manage own properties"
  on properties for all using (auth.uid() = user_id);

-- ─── Valuations ───────────────────────────────────────────────────────────────

create policy "Users manage own valuations"
  on valuations for all using (auth.uid() = user_id);

-- ─── Comparables ──────────────────────────────────────────────────────────────

-- Comparables linked to user's valuations, or standalone (valuation_id null)
create policy "Users view comparables from own valuations"
  on comparables for select
  using (
    valuation_id is null
    or valuation_id in (select id from valuations where user_id = auth.uid())
  );

create policy "Users insert comparables to own valuations"
  on comparables for insert
  with check (
    valuation_id is null
    or valuation_id in (select id from valuations where user_id = auth.uid())
  );

create policy "Users update own comparables"
  on comparables for update
  using (valuation_id in (select id from valuations where user_id = auth.uid()));

create policy "Users delete own comparables"
  on comparables for delete
  using (valuation_id in (select id from valuations where user_id = auth.uid()));

-- ─── Visits ───────────────────────────────────────────────────────────────────

create policy "Users manage own visits"
  on visits for all using (auth.uid() = user_id);

-- ─── Reports ──────────────────────────────────────────────────────────────────

create policy "Users manage own reports"
  on reports for all using (auth.uid() = user_id);

-- ─── Favorites ────────────────────────────────────────────────────────────────

create policy "Users manage own favorites"
  on favorites for all using (auth.uid() = user_id);

-- ─── Saved searches ───────────────────────────────────────────────────────────

create policy "Users manage own saved searches"
  on saved_searches for all using (auth.uid() = user_id);

-- ─── Zone insights (public read) ─────────────────────────────────────────────

create policy "Anyone can read zone insights"
  on zone_insights for select using (true);

create policy "Admins can manage zone insights"
  on zone_insights for all
  using (auth.uid() in (select id from profiles where role = 'admin'));
