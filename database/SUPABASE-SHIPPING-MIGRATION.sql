-- Reverse Tech shipping migration
-- Run once in Supabase SQL Editor

alter table public.pcb_orders add column if not exists shipping_method text not null default 'pickup';
alter table public.pcb_orders add column if not exists shipping_country text not null default '';
alter table public.pcb_orders add column if not exists shipping_address text not null default '';
alter table public.pcb_orders add column if not exists shipping_recipient_name text not null default '';
alter table public.pcb_orders add column if not exists shipping_phone text not null default '';
alter table public.pcb_orders add column if not exists shipping_weight_kg numeric not null default 1;
alter table public.pcb_orders add column if not exists shipping_fee numeric not null default 0;

alter table public.printing_orders add column if not exists shipping_method text not null default 'pickup';
alter table public.printing_orders add column if not exists shipping_country text not null default '';
alter table public.printing_orders add column if not exists shipping_address text not null default '';
alter table public.printing_orders add column if not exists shipping_recipient_name text not null default '';
alter table public.printing_orders add column if not exists shipping_phone text not null default '';
alter table public.printing_orders add column if not exists shipping_weight_kg numeric not null default 1;
alter table public.printing_orders add column if not exists shipping_fee numeric not null default 0;

alter table public.stencil_orders add column if not exists shipping_method text not null default 'pickup';
alter table public.stencil_orders add column if not exists shipping_country text not null default '';
alter table public.stencil_orders add column if not exists shipping_address text not null default '';
alter table public.stencil_orders add column if not exists shipping_recipient_name text not null default '';
alter table public.stencil_orders add column if not exists shipping_phone text not null default '';
alter table public.stencil_orders add column if not exists shipping_weight_kg numeric not null default 1;
alter table public.stencil_orders add column if not exists shipping_fee numeric not null default 0;

alter table public.mechanical_orders add column if not exists shipping_method text not null default 'pickup';
alter table public.mechanical_orders add column if not exists shipping_country text not null default '';
alter table public.mechanical_orders add column if not exists shipping_address text not null default '';
alter table public.mechanical_orders add column if not exists shipping_recipient_name text not null default '';
alter table public.mechanical_orders add column if not exists shipping_phone text not null default '';
alter table public.mechanical_orders add column if not exists shipping_weight_kg numeric not null default 1;
alter table public.mechanical_orders add column if not exists shipping_fee numeric not null default 0;
