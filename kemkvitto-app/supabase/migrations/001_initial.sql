-- washers table
create table washers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  business_name text not null,
  next_receipt_number integer not null default 1,
  created_at timestamptz default now()
);

-- receipts table
create table receipts (
  id uuid primary key default gen_random_uuid(),
  washer_id uuid references washers(id) not null,
  receipt_number integer not null,
  garments jsonb not null,
  delivery_date date not null,
  customer_email text not null,
  comment text,
  reminder_sent boolean default false,
  created_at timestamptz default now()
);

-- index for reminder cron query
create index idx_receipts_reminder on receipts (delivery_date, reminder_sent)
  where reminder_sent = false;

-- Disable RLS for MVP (using anon key for all operations)
alter table washers disable row level security;
alter table receipts disable row level security;
