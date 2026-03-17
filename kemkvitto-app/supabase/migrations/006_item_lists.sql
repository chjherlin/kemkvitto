ALTER TABLE washers ADD COLUMN IF NOT EXISTS garment_list jsonb;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS service_list jsonb;
