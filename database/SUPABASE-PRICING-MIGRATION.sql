-- Reverse Tech pricing extension
-- شغّل هذا الملف مرة واحدة بعد SUPABASE-SETUP.sql و SUPABASE-V2-MIGRATION.sql

create table if not exists public.service_pricing (
  service text primary key,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.service_pricing enable row level security;

alter table public.printing_orders add column if not exists quote jsonb;
alter table public.stencil_orders add column if not exists quote jsonb;
alter table public.mechanical_orders add column if not exists quote jsonb;

insert into public.service_pricing(service,config) values
('printing','{"setupFeeEGP":50,"minimumOrderEGP":100,"materialPricePerUnit":{"PLA":80,"ABS":95,"PETG":100,"Resin":140,"Nylon":160},"finishingMultiplier":{"Standard":1,"Sanding":1.15,"Painting":1.35},"thicknessMultiplier":{"1":1,"2":1.15,"3":1.3,"5":1.5},"quantityDiscountTiers":[{"minQty":1,"discountPercent":0},{"minQty":5,"discountPercent":5},{"minQty":10,"discountPercent":10},{"minQty":25,"discountPercent":15}]}'::jsonb),
('stencil','{"setupFeeEGP":120,"minimumOrderEGP":250,"pricePerCm2":0.35,"standardBasePriceEGP":180,"thicknessMultiplier":{"0.1":1,"0.12":1.05,"0.15":1.12,"0.2":1.2},"quantityDiscountTiers":[{"minQty":1,"discountPercent":0},{"minQty":5,"discountPercent":5},{"minQty":10,"discountPercent":10},{"minQty":25,"discountPercent":15}]}'::jsonb),
('mechanical','{"setupFeeEGP":0,"minimumOrderEGP":0,"rushSurchargePercent":25,"quantityDiscountTiers":[{"minQty":1,"discountPercent":0},{"minQty":10,"discountPercent":5},{"minQty":50,"discountPercent":10}]}'::jsonb)
on conflict(service) do update set config = public.service_pricing.config || excluded.config, updated_at = now();
