-- Reverse Tech Supabase setup
-- شغّل الملف كامل من Supabase > SQL Editor > New query

create table if not exists public.projects (
  id text primary key,
  image text not null,
  tag_ar text not null,
  tag_en text not null,
  title_ar text not null,
  title_en text not null,
  desc_ar text not null,
  desc_en text not null,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pcb_pricing (
  id integer primary key default 1 check (id = 1),
  config jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.pcb_orders (
  id text primary key,
  customer_name text not null,
  customer_phone text not null,
  customer_email text default '',
  layers integer not null,
  quantity integer not null,
  width_mm numeric not null,
  length_mm numeric not null,
  thickness_mm numeric not null,
  color text not null,
  rush boolean not null default false,
  discount_code text default '',
  gerber_filename text,
  gerber_original_name text,
  quote jsonb not null,
  status text not null default 'جديد',
  created_at timestamptz not null default now()
);

-- منع الوصول المباشر للجداول. السيرفر فقط يستخدم Service Role Key.
alter table public.projects enable row level security;
alter table public.pcb_pricing enable row level security;
alter table public.pcb_orders enable row level security;

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit)
values ('project-images', 'project-images', true, 10485760)
on conflict (id) do update set public = true, file_size_limit = 10485760;

insert into storage.buckets (id, name, public, file_size_limit)
values ('gerber-files', 'gerber-files', false, 104857600)
on conflict (id) do update set public = false, file_size_limit = 104857600;

-- المشاريع الافتراضية
insert into public.projects (id,image,tag_ar,tag_en,title_ar,title_en,desc_ar,desc_en,sort_order) values
('p1','project1.png','هندسة عكسية','Reverse Engineering','إعادة تصنيع قطعة غيار لجهاز أشعة','Reverse-Engineered X-Ray Machine Spare Part','مسح ثلاثي الأبعاد وإعادة تصميم قطعة غيار أصلية لجهاز أشعة طبي غير متوفرة في السوق.','3D scanning and redesign of an original spare part for a medical X-ray machine that was no longer available on the market.',1),
('p2','project2.png','طباعة ثلاثية الأبعاد','3D Printing','نمذجة ثلاثية الأبعاد لمكونات جهاز تنفس','3D Modeling of Ventilator Components','تصميم وطباعة مكونات بلاستيكية دقيقة لجهاز تنفس صناعي بمواصفات مطابقة للأصل.','Design and printing of precise plastic components for an industrial ventilator, matching the original specifications.',2),
('p3','project3.jpg','تصنيع إلكتروني','Electronic Manufacturing','تصنيع لوحة إلكترونية لجهاز مراقبة القلب','PCB Manufacturing for a Cardiac Monitor','تصميم وتصنيع لوحة PCB بديلة لجهاز مراقبة القلب مع فحص كامل للأداء.','Design and manufacturing of a replacement PCB for a cardiac monitor, with full performance testing.',3),
('p4','project4.jpg','صيانة ومعايرة','Maintenance & Calibration','معايرة جهاز تحليل الدم','Blood Analysis Device Calibration','صيانة ومعايرة دورية لجهاز تحليل دم بمستشفى شريك وفق المعايير الدولية.','Routine maintenance and calibration of a blood analysis device at a partner hospital, in line with international standards.',4),
('p5','project5.jpg','طباعة ثلاثية الأبعاد','3D Printing','طباعة هيكل خارجي لجهاز طبي محمول','Housing Printed for a Portable Medical Device','إعادة تصميم وطباعة هيكل خارجي متين لجهاز طبي محمول بعد تلف الهيكل الأصلي.','Redesign and printing of a durable outer housing for a portable medical device after the original housing was damaged.',5),
('p6','project6.jpg','هندسة عكسية','Reverse Engineering','إصلاح وحدة تحكم لجهاز ليزر طبي','Control Unit Repair for a Medical Laser Device','تحليل الدائرة الأصلية وإصلاح وحدة التحكم الإلكترونية لجهاز ليزر طبي معطل.','Analysis of the original circuit and repair of the electronic control unit for a faulty medical laser device.',6)
on conflict (id) do update set image=excluded.image, tag_ar=excluded.tag_ar, tag_en=excluded.tag_en, title_ar=excluded.title_ar, title_en=excluded.title_en, desc_ar=excluded.desc_ar, desc_en=excluded.desc_en, sort_order=excluded.sort_order;

insert into public.pcb_pricing (id, config) values (1, '{"pricePerCm2ByLayers": {"1": 1.2, "2": 2.2, "4": 6.5, "6": 11}, "standardThicknessMm": 1.6, "colorSurchargePercent": 15, "thicknessSurchargeEGP": 60, "setupFeeEGP": 150, "minimumOrderEGP": 250, "rushSurchargePercent": 30, "quantityDiscountTiers": [{"minQty": 1, "discountPercent": 0}, {"minQty": 10, "discountPercent": 5}, {"minQty": 50, "discountPercent": 10}, {"minQty": 100, "discountPercent": 15}, {"minQty": 500, "discountPercent": 22}], "discountCode": {"code": "REVERSE10", "discountPercent": 10, "active": true}, "estimatedLeadTime": {"standard": "أسبوعين إلى ثلاثة أسابيع", "rush": "أسبوع واحد (شحن/تصنيع عاجل)"}}'::jsonb)
on conflict (id) do update set config=excluded.config, updated_at=now();

-- Contact messages
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'جديد',
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;

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
on conflict (id) do update set
  config = excluded.config,
  updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit)
values ('graduation-support-files', 'graduation-support-files', false, 104857600)
on conflict (id) do update set
  public = false,
  file_size_limit = 104857600;


-- =========================================================
-- Service slider images
-- =========================================================
begin;
create table if not exists public.service_images (
  id bigint generated by default as identity primary key,
  service_key text not null,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists service_images_key_order_idx
  on public.service_images(service_key, sort_order);
alter table public.service_images enable row level security;
commit;
