-- Reverse Tech V2 migration - شغليه بعد الملف القديم بدون حذف أي جدول
create extension if not exists pgcrypto;
create table if not exists public.mechanical_parts (id uuid primary key default gen_random_uuid(),title_ar text not null,title_en text not null,description_ar text default '',description_en text default '',image text default '',price numeric not null default 0,manufacturing_time text default '',active boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.mechanical_orders (id uuid primary key default gen_random_uuid(),part_id uuid references public.mechanical_parts(id) on delete set null,part_title text default '',customer_name text not null,phone text not null,email text default '',quantity integer default 1,notes text default '',status text default 'جديد',created_at timestamptz not null default now());
create table if not exists public.printing_orders (id uuid primary key default gen_random_uuid(),customer_name text not null,phone text not null,email text default '',file_url text,material text,color text,quantity integer default 1,finishing text,price numeric default 0,status text default 'جديد',created_at timestamptz not null default now());
create table if not exists public.stencil_orders (id uuid primary key default gen_random_uuid(),customer_name text not null,phone text not null,email text default '',gerber_file text,dimensions text,thickness text,quantity integer default 1,price numeric default 0,status text default 'جديد',created_at timestamptz not null default now());
alter table public.mechanical_parts enable row level security; alter table public.mechanical_orders enable row level security; alter table public.printing_orders enable row level security; alter table public.stencil_orders enable row level security;
insert into storage.buckets(id,name,public,file_size_limit) values ('mechanical-images','mechanical-images',true,10485760) on conflict(id) do update set public=true,file_size_limit=10485760;
insert into storage.buckets(id,name,public,file_size_limit) values ('order-files','order-files',false,104857600) on conflict(id) do update set public=false,file_size_limit=104857600;
insert into storage.buckets(id,name,public,file_size_limit) values ('graduation-support-files','graduation-support-files',false,104857600) on conflict(id) do update set public=false,file_size_limit=104857600;

-- Graduation support requests
create table if not exists public.graduation_support_config (
  id integer primary key default 1 check (id = 1),
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.graduation_project_requests (
  id text primary key,
  project_name text not null default '',
  university_name text not null default '',
  team_leader_name text not null default '',
  team_leader_email text not null default '',
  team_leader_phone text not null default '',
  supervisor_name text not null default '',
  supervisor_phone text not null default '',
  team_members jsonb not null default '[]'::jsonb,
  engineering_projects text default '',
  engineering_project_names text default '',
  engineering_project_description text default '',
  sponsorship text default '',
  sponsorship_source text default '',
  language text default 'ar',
  status text not null default 'جديد',
  university_letter_original_name text default '',
  project_proposal_original_name text default '',
  university_letter_filename text default '',
  project_proposal_filename text default '',
  engineering_project_images jsonb default '[]'::jsonb,
  engineering_project_images_original_names jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.graduation_support_config enable row level security;
alter table public.graduation_project_requests enable row level security;

insert into public.graduation_support_config (id, config)
values (
  1,
  '{"start_date":"2026-08-01","end_date":null,"closed_message_ar":"انتهت فترة التسجيل لدعم مشاريع التخرج لهذا الموسم، تابعونا لمعرفة موعد الفتح القادم 🚀","closed_message_en":"Registration for this season\'s graduation project support has closed. Stay tuned for the next opening 🚀"}'::jsonb
)
on conflict (id) do update set config = excluded.config, updated_at = now();

-- Pricing configurations for 3D Printing, SMT Stencil and Mechanical Parts
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
('printing','{"setupFeeEGP":50,"minimumOrderEGP":100,"materialPricePerUnit":{"PLA":80,"ABS":95,"PETG":100,"Resin":140,"Nylon":160},"finishingMultiplier":{"Standard":1,"Sanding":1.15,"Painting":1.35},"quantityDiscountTiers":[{"minQty":1,"discountPercent":0},{"minQty":5,"discountPercent":5},{"minQty":10,"discountPercent":10},{"minQty":25,"discountPercent":15}]}'::jsonb),
('stencil','{"setupFeeEGP":120,"minimumOrderEGP":250,"pricePerCm2":0.35,"standardBasePriceEGP":180,"thicknessMultiplier":{"0.1":1,"0.12":1.05,"0.15":1.12,"0.2":1.2},"quantityDiscountTiers":[{"minQty":1,"discountPercent":0},{"minQty":5,"discountPercent":5},{"minQty":10,"discountPercent":10},{"minQty":25,"discountPercent":15}]}'::jsonb),
('mechanical','{"setupFeeEGP":0,"minimumOrderEGP":0,"rushSurchargePercent":25,"quantityDiscountTiers":[{"minQty":1,"discountPercent":0},{"minQty":10,"discountPercent":5},{"minQty":50,"discountPercent":10}]}'::jsonb)
on conflict(service) do nothing;
