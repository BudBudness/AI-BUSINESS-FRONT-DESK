-- Image Coffee Roastery accommodation core.
-- Apply through Supabase migrations after the owner selects the project.
create extension if not exists pgcrypto;
create type public.booking_status as enum ('enquiry','reserved','checked_in','checked_out','cancelled');
create table public.rooms (id smallint primary key check (id between 1 and 13), room_label text not null unique, nightly_rate integer not null default 100000 check (nightly_rate = 100000), active boolean not null default true, created_at timestamptz not null default now());
insert into public.rooms (id, room_label) select n, 'Room ' || lpad(n::text, 2, '0') from generate_series(1,13) as n on conflict (id) do nothing;
create table public.bookings (id uuid primary key default gen_random_uuid(), room_id smallint not null references public.rooms(id), guest_name text not null check (length(trim(guest_name)) between 2 and 160), guest_phone text, check_in date not null, check_out date not null, status public.booking_status not null default 'enquiry', amount_paid integer not null default 0 check (amount_paid >= 0), notes text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (check_out > check_in));
create extension if not exists btree_gist;
alter table public.bookings add constraint bookings_no_active_overlap exclude using gist (room_id with =, daterange(check_in, check_out, '[)') with &&) where (status in ('reserved','checked_in'));
create index bookings_dates_idx on public.bookings (check_in, check_out);
create index bookings_status_idx on public.bookings (status);
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;
create policy "authenticated staff can read rooms" on public.rooms for select to authenticated using (true);
create policy "authenticated staff can manage rooms" on public.rooms for all to authenticated using (true) with check (true);
create policy "authenticated staff can read bookings" on public.bookings for select to authenticated using (true);
create policy "authenticated staff can create bookings" on public.bookings for insert to authenticated with check (true);
create policy "authenticated staff can update bookings" on public.bookings for update to authenticated using (true) with check (true);
grant usage on schema public to authenticated;
grant select, insert, update on public.rooms to authenticated;
grant select, insert, update on public.bookings to authenticated;