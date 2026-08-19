-- Reverse Tech Graduation Support migration
-- Run this in Supabase SQL Editor

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
on conflict (id) do update set
  config = excluded.config,
  updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit)
values ('graduation-support-files', 'graduation-support-files', false, 104857600)
on conflict (id) do update set
  public = false,
  file_size_limit = 104857600;
