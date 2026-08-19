begin;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null default '',
  phone text not null default '',
  company text not null default '',
  service text not null default '',
  subject text not null default '',
  message text not null,
  email_sent boolean not null default false,
  whatsapp_sent boolean not null default false,
  status text not null default 'جديد',
  created_at timestamptz not null default now()
);

alter table public.contact_messages add column if not exists phone text not null default '';
alter table public.contact_messages add column if not exists company text not null default '';
alter table public.contact_messages add column if not exists service text not null default '';
alter table public.contact_messages add column if not exists subject text not null default '';
alter table public.contact_messages add column if not exists email_sent boolean not null default false;
alter table public.contact_messages add column if not exists whatsapp_sent boolean not null default false;
alter table public.contact_messages add column if not exists status text not null default 'جديد';
alter table public.contact_messages enable row level security;

commit;
