// ==========================================================================
// ملف بيانات المشاريع المشترك بين الصفحة الرئيسية (main.html) ولوحة التحكم (admin.html)
// البيانات مخزّنة في localStorage الخاص بالمتصفح تحت المفتاح: reverseTechProjects
// ==========================================================================

const PROJECTS_STORAGE_KEY = 'reverseTechProjects';

// المشاريع الافتراضية (تُستخدم أول مرة قبل ما يتم حفظ أي تعديل من لوحة التحكم)
const DEFAULT_PROJECTS = [
    {
        id: 'p1',
        image: 'project1.jpg',
        tag_ar: 'هندسة عكسية',
        tag_en: 'Reverse Engineering',
        title_ar: 'إعادة تصنيع قطعة غيار لجهاز أشعة',
        title_en: 'Reverse-Engineered X-Ray Machine Spare Part',
        desc_ar: 'مسح ثلاثي الأبعاد وإعادة تصميم قطعة غيار أصلية لجهاز أشعة طبي غير متوفرة في السوق.',
        desc_en: '3D scanning and redesign of an original spare part for a medical X-ray machine that was no longer available on the market.'
    },
    {
        id: 'p2',
        image: 'project2.jpg',
        tag_ar: 'طباعة ثلاثية الأبعاد',
        tag_en: '3D Printing',
        title_ar: 'نمذجة ثلاثية الأبعاد لمكونات جهاز تنفس',
        title_en: '3D Modeling of Ventilator Components',
        desc_ar: 'تصميم وطباعة مكونات بلاستيكية دقيقة لجهاز تنفس صناعي بمواصفات مطابقة للأصل.',
        desc_en: 'Design and printing of precise plastic components for an industrial ventilator, matching the original specifications.'
    },
    {
        id: 'p3',
        image: 'project3.jpg',
        tag_ar: 'تصنيع إلكتروني',
        tag_en: 'Electronic Manufacturing',
        title_ar: 'تصنيع لوحة إلكترونية لجهاز مراقبة القلب',
        title_en: 'PCB Manufacturing for a Cardiac Monitor',
        desc_ar: 'تصميم وتصنيع لوحة PCB بديلة لجهاز مراقبة القلب مع فحص كامل للأداء.',
        desc_en: 'Design and manufacturing of a replacement PCB for a cardiac monitor, with full performance testing.'
    },
    {
        id: 'p4',
        image: 'project4.jpg',
        tag_ar: 'صيانة ومعايرة',
        tag_en: 'Maintenance & Calibration',
        title_ar: 'معايرة جهاز تحليل الدم',
        title_en: 'Blood Analysis Device Calibration',
        desc_ar: 'صيانة ومعايرة دورية لجهاز تحليل دم بمستشفى شريك وفق المعايير الدولية.',
        desc_en: 'Routine maintenance and calibration of a blood analysis device at a partner hospital, in line with international standards.'
    },
    {
        id: 'p5',
        image: 'project5.jpg',
        tag_ar: 'طباعة ثلاثية الأبعاد',
        tag_en: '3D Printing',
        title_ar: 'طباعة هيكل خارجي لجهاز طبي محمول',
        title_en: 'Housing Printed for a Portable Medical Device',
        desc_ar: 'إعادة تصميم وطباعة هيكل خارجي متين لجهاز طبي محمول بعد تلف الهيكل الأصلي.',
        desc_en: 'Redesign and printing of a durable outer housing for a portable medical device after the original housing was damaged.'
    },
    {
        id: 'p6',
        image: 'project6.jpg',
        tag_ar: 'هندسة عكسية',
        tag_en: 'Reverse Engineering',
        title_ar: 'إصلاح وحدة تحكم لجهاز ليزر طبي',
        title_en: 'Control Unit Repair for a Medical Laser Device',
        desc_ar: 'تحليل الدائرة الأصلية وإصلاح وحدة التحكم الإلكترونية لجهاز ليزر طبي معطل.',
        desc_en: 'Analysis of the original circuit and repair of the electronic control unit for a faulty medical laser device.'
    }
];

// جلب قائمة المشاريع الحالية (من localStorage، أو الافتراضية لو مفيش حاجة محفوظة بعد)
function getProjects() {
    try {
        const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.error('تعذر قراءة بيانات المشاريع المحفوظة:', e);
    }
    return DEFAULT_PROJECTS;
}

// حفظ قائمة المشاريع في localStorage
function saveProjects(projects) {
    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
        return true;
    } catch (e) {
        console.error('تعذر حفظ بيانات المشاريع:', e);
        return false;
    }
}

// توليد معرّف فريد لمشروع جديد
function generateProjectId() {
    return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}
