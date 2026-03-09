-- Customers table — one per washer, deduplicated by name
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  washer_id uuid REFERENCES washers(id) NOT NULL,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(washer_id, name)
);

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Link receipts to customers (optional, for future use)
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);
