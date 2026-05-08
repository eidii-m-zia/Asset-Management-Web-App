create table if not exists public.inventories (
  id text primary key,
  name text not null,
  event text,
  description text,
  date date,
  color text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assets (
  id text primary key,
  name text not null,
  photo text,
  category text not null,
  serial_number text,
  assigned_to text,
  condition text not null check (condition in ('excellent', 'good', 'fair', 'poor')),
  purchase_date date,
  purchase_price numeric(12, 2) not null default 0,
  location text,
  notes text,
  inventory_id text not null references public.inventories(id) on delete cascade,
  status text not null check (status in ('available', 'in-use', 'maintenance', 'retired')),
  created_at timestamptz not null default timezone('utc', now()),
  tags text[] not null default '{}'
);

create table if not exists public.stock_items (
  id text primary key,
  name text not null,
  category text,
  sku text,
  description text,
  total_quantity integer not null default 0 check (total_quantity >= 0),
  unit text not null default 'pcs',
  notes text,
  photo text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by text
);

create table if not exists public.stock_item_history (
  id text primary key,
  stock_item_id text not null references public.stock_items(id) on delete cascade,
  action text not null check (action in ('created', 'updated')),
  changed_at timestamptz not null default timezone('utc', now()),
  changed_by text not null,
  summary text not null
);

create table if not exists public.inventory_stock_entries (
  id text primary key,
  inventory_id text not null references public.inventories(id) on delete cascade,
  stock_item_id text not null references public.stock_items(id) on delete cascade,
  quantity_brought integer not null check (quantity_brought > 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists assets_inventory_id_idx on public.assets (inventory_id);
create index if not exists assets_status_idx on public.assets (status);
create index if not exists stock_item_history_stock_item_id_idx on public.stock_item_history (stock_item_id);
create index if not exists inventory_stock_entries_inventory_id_idx on public.inventory_stock_entries (inventory_id);
create index if not exists inventory_stock_entries_stock_item_id_idx on public.inventory_stock_entries (stock_item_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

alter table public.inventories enable row level security;
alter table public.assets enable row level security;
alter table public.stock_items enable row level security;
alter table public.stock_item_history enable row level security;
alter table public.inventory_stock_entries enable row level security;

drop policy if exists "inventories_public_access" on public.inventories;
create policy "inventories_public_access"
on public.inventories
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "assets_public_access" on public.assets;
create policy "assets_public_access"
on public.assets
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "stock_items_public_access" on public.stock_items;
create policy "stock_items_public_access"
on public.stock_items
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "stock_item_history_public_access" on public.stock_item_history;
create policy "stock_item_history_public_access"
on public.stock_item_history
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "inventory_stock_entries_public_access" on public.inventory_stock_entries;
create policy "inventory_stock_entries_public_access"
on public.inventory_stock_entries
for all
to anon, authenticated
using (true)
with check (true);

insert into public.inventories (id, name, event, description, date, color, created_at)
values
  ('inv-1', 'Summer Conference 2026', 'Annual Tech Summit', 'AV equipment and stage materials for the summer conference', '2026-07-15', '#6366f1', '2026-01-10T09:00:00Z'),
  ('inv-2', 'Product Launch Q2', 'Product Launch Event', 'Displays, lighting, and booth materials for the Q2 launch', '2026-05-20', '#ec4899', '2026-02-01T10:00:00Z'),
  ('inv-3', 'Office General', 'Permanent Assets', 'All permanent office equipment and furniture', null, '#22c55e', '2025-12-01T08:00:00Z')
on conflict (id) do nothing;

insert into public.assets (
  id, name, photo, category, serial_number, assigned_to, condition,
  purchase_date, purchase_price, location, notes, inventory_id, status, created_at, tags
)
values
  ('a-1', 'Sony 4K Projector', null, 'AV Equipment', 'SNY-4K-00123', 'Marcus Johnson', 'excellent', '2025-11-01', 2400, 'Storage Room A', 'Includes carrying case and 2 spare bulbs', 'inv-1', 'available', '2025-11-05T10:00:00Z', array['AV', 'projection']),
  ('a-2', 'Yamaha PA System', null, 'Audio', 'YMH-PA-00456', 'Sarah Chen', 'good', '2025-09-15', 1800, 'Storage Room A', '2x speaker cabinets, 1 mixer, all cables included', 'inv-1', 'in-use', '2025-09-20T10:00:00Z', array['audio', 'speakers']),
  ('a-3', 'LED Panel 200W', null, 'Lighting', 'LED-200W-0078', 'Marcus Johnson', 'excellent', '2026-01-20', 560, 'Warehouse B', 'Set of 4 panels', 'inv-2', 'available', '2026-01-25T10:00:00Z', array['lighting']),
  ('a-4', 'Display Monitor 27"', null, 'Display', 'DEL-27-00891', 'Lisa Park', 'good', '2025-08-10', 450, 'Office', 'Dell UltraSharp', 'inv-3', 'in-use', '2025-08-15T10:00:00Z', array['display', 'office']),
  ('a-5', 'MacBook Pro 14"', null, 'Computer', 'APL-MBP-01234', 'David Kim', 'excellent', '2025-12-01', 2499, 'Office', 'M3 Pro chip, 18GB RAM', 'inv-3', 'in-use', '2025-12-05T10:00:00Z', array['computer', 'laptop']),
  ('a-6', 'Canon EOS R5 Camera', null, 'Camera', 'CAN-R5-00567', 'Emily Torres', 'excellent', '2026-02-10', 3899, 'Media Closet', 'With 24-70mm lens and 2 batteries', 'inv-2', 'available', '2026-02-15T10:00:00Z', array['camera', 'photography']),
  ('a-7', 'Portable Stage Platform', null, 'Stage', 'STG-PLT-00234', 'Marcus Johnson', 'fair', '2024-06-15', 1200, 'Warehouse B', '8 modular sections, needs minor repair on section 3', 'inv-1', 'maintenance', '2024-06-20T10:00:00Z', array['stage', 'furniture']),
  ('a-8', 'Wireless Microphone Set', null, 'Audio', 'SHR-WL-00345', 'Sarah Chen', 'good', '2025-10-05', 890, 'Storage Room A', 'Shure BLX288/PG58 dual set', 'inv-1', 'available', '2025-10-10T10:00:00Z', array['audio', 'wireless'])
on conflict (id) do nothing;

insert into public.stock_items (
  id, name, category, sku, description, total_quantity, unit, notes, photo, created_at, updated_at, updated_by
)
values
  ('s-1', 'Folding Tables', 'Furniture', 'TBL-FOLD-6FT', '6ft rectangular folding tables', 50, 'pcs', 'Stored in Warehouse B', null, '2025-01-01T08:00:00Z', '2025-01-01T08:00:00Z', 'System'),
  ('s-2', 'Folding Chairs', 'Furniture', 'CHR-FOLD-STD', 'Standard padded folding chairs', 200, 'pcs', 'Stack of 10 per bundle', null, '2025-01-01T08:00:00Z', '2025-01-01T08:00:00Z', 'System'),
  ('s-3', 'Extension Cords (10m)', 'Electrical', 'EXT-10M-3PIN', '10-meter 3-pin extension cords', 30, 'pcs', 'Heavy duty, outdoor safe', null, '2025-01-01T08:00:00Z', '2025-01-01T08:00:00Z', 'System'),
  ('s-4', 'Tablecloths', 'Linens', 'TCL-6FT-WHT', 'White tablecloths for 6ft tables', 100, 'pcs', 'Machine washable polyester', null, '2025-01-01T08:00:00Z', '2025-01-01T08:00:00Z', 'System'),
  ('s-5', 'Name Badge Holders', 'Stationery', 'NBH-LNY-CLR', 'Clear name badge holders with lanyards', 500, 'pcs', 'Box of 100', null, '2025-01-01T08:00:00Z', '2025-01-01T08:00:00Z', 'System'),
  ('s-6', 'Power Strips (6 outlet)', 'Electrical', 'PWR-6OTL-SRG', '6-outlet surge-protected power strips', 20, 'pcs', 'Surge protection, 2m cord', null, '2025-01-01T08:00:00Z', '2025-01-01T08:00:00Z', 'System'),
  ('s-7', 'Projector Screens', 'AV', 'SCR-100IN-TRP', '100-inch tripod projector screens', 8, 'pcs', 'Portable, with carry bag', null, '2025-01-01T08:00:00Z', '2025-01-01T08:00:00Z', 'System'),
  ('s-8', 'Microphone Stands', 'Audio', 'MIC-STD-BLK', 'Adjustable boom microphone stands', 15, 'pcs', 'Heavy base, adjustable boom', null, '2025-01-01T08:00:00Z', '2025-01-01T08:00:00Z', 'System')
on conflict (id) do nothing;

insert into public.stock_item_history (id, stock_item_id, action, changed_at, changed_by, summary)
values
  ('hist-s-1-created', 's-1', 'created', '2025-01-01T08:00:00Z', 'System', 'Created with 50 pcs'),
  ('hist-s-2-created', 's-2', 'created', '2025-01-01T08:00:00Z', 'System', 'Created with 200 pcs'),
  ('hist-s-3-created', 's-3', 'created', '2025-01-01T08:00:00Z', 'System', 'Created with 30 pcs'),
  ('hist-s-4-created', 's-4', 'created', '2025-01-01T08:00:00Z', 'System', 'Created with 100 pcs'),
  ('hist-s-5-created', 's-5', 'created', '2025-01-01T08:00:00Z', 'System', 'Created with 500 pcs'),
  ('hist-s-6-created', 's-6', 'created', '2025-01-01T08:00:00Z', 'System', 'Created with 20 pcs'),
  ('hist-s-7-created', 's-7', 'created', '2025-01-01T08:00:00Z', 'System', 'Created with 8 pcs'),
  ('hist-s-8-created', 's-8', 'created', '2025-01-01T08:00:00Z', 'System', 'Created with 15 pcs')
on conflict (id) do nothing;

insert into public.inventory_stock_entries (
  id, inventory_id, stock_item_id, quantity_brought, notes, created_at
)
values
  ('ise-1', 'inv-1', 's-1', 10, 'For speaker tables and registration', '2026-01-10T09:00:00Z'),
  ('ise-2', 'inv-1', 's-2', 80, 'Audience seating', '2026-01-10T09:00:00Z'),
  ('ise-3', 'inv-1', 's-3', 5, 'Stage and AV area power', '2026-01-10T09:00:00Z'),
  ('ise-4', 'inv-1', 's-7', 2, 'Main stage and breakout room', '2026-01-10T09:00:00Z'),
  ('ise-5', 'inv-1', 's-8', 6, 'Speakers and Q&A', '2026-01-10T09:00:00Z'),
  ('ise-6', 'inv-2', 's-1', 5, 'Demo and display tables', '2026-02-01T10:00:00Z'),
  ('ise-7', 'inv-2', 's-2', 40, 'Guest seating', '2026-02-01T10:00:00Z'),
  ('ise-8', 'inv-2', 's-5', 100, 'Guest name badges', '2026-02-01T10:00:00Z'),
  ('ise-9', 'inv-2', 's-4', 20, 'Display table coverings', '2026-02-01T10:00:00Z')
on conflict (id) do nothing;
