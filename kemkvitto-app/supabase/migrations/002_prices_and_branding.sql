-- Add brand color for receipt theming (hex color)
alter table washers add column brand_color text not null default '#0891b2';

-- Add price list as JSONB: {"Rock": 150, "Kostym": 350, ...}
alter table washers add column price_list jsonb not null default '{}';
