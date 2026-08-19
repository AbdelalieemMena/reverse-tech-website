# ربط المشروع بـ Supabase وإعدادات الإنتاج

1. افتح **`supabase.com`** وسجّل الدخول، ثم أنشئ مشروعاً جديداً **New project**.
2. بعد إنشاء المشروع، افتح **SQL Editor** ثم اضغط على **New query**.
3. افتح وتشغيل ملفات الهجرة وقاعدة البيانات بالترتيب التالي:
   * **أولاً**: ملف [SUPABASE-SETUP.sql](file:///d:/reverse%20tech/01%20projects/website/reverse-tech-final-social-newsletter-email%20%282%29/reverse-tech-final-social-newsletter-email/database/SUPABASE-SETUP.sql) (يُنشئ الجداول الأساسية للمشاريع والطلبات والأسعار الافتراضية).
   * **ثانياً**: ملف [SUPABASE-V2-MIGRATION.sql](file:///d:/reverse%20tech/01%20projects/website/reverse-tech-final-social-newsletter-email%20%282%29/reverse-tech-final-social-newsletter-email/database/SUPABASE-V2-MIGRATION.sql) (يُنشئ جداول طلبات التصنيع الأخرى، وجداول أجزاء الميكانيكا، وجدول تسعير الخدمات الموحد).
   * **ثالثاً**: تشغيل التحديثات الإضافية المتبقية:
     * [SUPABASE-SHIPPING-MIGRATION.sql](file:///d:/reverse%20tech/01%20projects/website/reverse-tech-final-social-newsletter-email%20%282%29/reverse-tech-final-social-newsletter-email/database/SUPABASE-SHIPPING-MIGRATION.sql)
     * [SUPABASE-CONTACT-MIGRATION.sql](file:///d:/reverse%20tech/01%20projects/website/reverse-tech-final-social-newsletter-email%20%282%29/reverse-tech-final-social-newsletter-email/database/SUPABASE-CONTACT-MIGRATION.sql)
     * [SUPABASE-SERVICE-MEDIA-MIGRATION.sql](file:///d:/reverse%20tech/01%20projects/website/reverse-tech-final-social-newsletter-email%20%282%29/reverse-tech-final-social-newsletter-email/database/SUPABASE-SERVICE-MEDIA-MIGRATION.sql)
4. من **Project Settings > API** في Supabase، انسخ:
   - Project URL
   - `service_role` key (السر المالي للعمليات الخلفية) — **تحذير**: لا تضعه أبداً داخل ملفات HTML أو Javascript الأمامية للعملاء.
5. في لوحة إعدادات الاستضافة، أضف Environment Variables التالية:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_SECRET_KEY` = service_role key
   - `JWT_SECRET` = نص عشوائي طويل لحماية جلسات المشرفين.
   - `ADMIN_USERNAME` = اسم دخول لوحة الأدمن.
   - `ADMIN_PASSWORD` = كلمة مرور قوية.

---

## 📦 مساحات التخزين المطلوبة (Storage Buckets)
تأكد من تهيئة الـ Buckets الأربعة التالية من لوحة تحكم Supabase > Storage:

1. **`project-images`** (الحالة: **Public**): لتخزين صور مشاريع الشركة.
2. **`mechanical-images`** (الحالة: **Public**): لتخزين صور القطع الميكانيكية للبيع.
3. **`gerber-files`** (الحالة: **Private**): لتخزين ملفات تصميمات الـ Gerber الحساسة للعملاء بأمان.
4. **`order-files`** (الحالة: **Private**): لتخزين ملفات تصاميم الطباعة وSMT Stencil الخاصة بطلبات العملاء.

---

## 🔒 حماية الجداول (RLS)
جميع الجداول مفعّل عليها الـ **Row Level Security (RLS)** لضمان خصوصية البيانات. الباك اند فقط (الخادم) هو من يملك صلاحية القراءة والكتابة باستخدام مفتاح الـ `service_role` بشكل آمن تماماً، مما يمنع محاولات التلاعب بالبيانات أو تصفح طلبات العملاء الآخرين من المتصفح مباشرة.

