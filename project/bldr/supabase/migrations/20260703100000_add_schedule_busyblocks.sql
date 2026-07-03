-- Busy blocks: user-defined "Busy" time ranges attached to a schedule.
-- One row per day; a block recurring on multiple days is stored as one row
-- per day. Day abbreviations follow the allclasses.days convention
-- (M, Tu, W, Th, F). Times are 24-hour "HH:MM" strings snapped to
-- 15-minute increments (enforced by the API layer).

create table if not exists public.schedule_busyblocks (
  uuid uuid primary key default gen_random_uuid(),
  scheduleid uuid not null references public.allschedules (scheduleid) on delete cascade,
  day text not null check (day in ('M', 'Tu', 'W', 'Th', 'F')),
  starttime text not null,
  endtime text not null,
  label text not null default 'Busy',
  created_at timestamp default current_timestamp
);

create index if not exists idx_schedule_busyblocks_scheduleid
  on public.schedule_busyblocks (scheduleid);

alter table public.schedule_busyblocks enable row level security;

-- Access mirrors schedule_classes: all reads and writes go through the
-- server API routes (addBusyBlock, removeBusyBlock, getUserSchedules,
-- saveSchedule), which scope every query by scheduleid and verify
-- ownership where an authenticated user is required. Busy blocks are
-- intentionally never selected by the public schedule route, so they are
-- not exposed on public share pages.
create policy "schedule_busyblocks_select" on public.schedule_busyblocks
  for select using (true);

create policy "schedule_busyblocks_insert" on public.schedule_busyblocks
  for insert with check (true);

create policy "schedule_busyblocks_delete" on public.schedule_busyblocks
  for delete using (true);
