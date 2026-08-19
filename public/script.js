// كود الجافاسكريبت للتحكم في القائمة المتحركة وتأثيرات الظهور
document.addEventListener('DOMContentLoaded', function () {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const closeMenuBtn = document.querySelector('.close-menu');
  const navLinks = document.querySelector('.nav-links');

  // فتح وإغلاق القائمة على الأجهزة المحمولة
  if (mobileMenuBtn && navLinks) mobileMenuBtn.addEventListener('click', function () {
    navLinks.classList.add('active');
  });

  if (closeMenuBtn) closeMenuBtn.addEventListener('click', function () {
    navLinks.classList.remove('active');
  });

  // إغلاق القائمة عند النقر على رابط
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', function () {
      navLinks.classList.remove('active');
    });
  });

  // تأثير الظهور للعناصر عند التمرير
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
  };

  const observer = new IntersectionObserver(function (entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // مراقبة عناصر الخدمات
  document.querySelectorAll('.service-card').forEach((card) => {
    observer.observe(card);
  });

  // نظام التبديل بين اللغتين
  const languageToggle = document.getElementById('languageToggle') || document.getElementById('pageLanguageToggle');
  let isEnglish = localStorage.getItem('reverseTechLanguage') === 'en';

  // نصوص اللغة العربية
  const arabicTexts = {
    home: 'الرئيسية',
    about: 'من نحن',
    services: 'خدماتنا',
    clients: 'عملائنا',
    reverse: 'الهندسة العكسية',
    projects: 'مشاريعنا',
    contact: 'اتصل بنا',
    heroTitle: 'حلول تقنية متكاملة لمستقبل أفضل',
    heroDesc:
      'نقدم في Reverse Tech خدمات متكاملة في مجال الصيانة، المعايرة، التصنيع والطباعة ثلاثية الأبعاد بأعلى معايير الجودة',
    ctaButton: 'اطلب خدمة',
    aboutTitle: 'من نحن',
    aboutDesc:
      'شركة Reverse Tech متخصصة في تقديم خدمات الهندسة العكسية للأجهزة الطبية. نعمل على تحليل وفحص مكونات وأداء الأجهزة بدقة عالية باستخدام أحدث أدوات القياس والمسح ثلاثي الأبعاد. نقدم خدماتنا إلى المستشفيات والمؤسسات الطبية، ونساعد المصنعين على الالتزام بالمعايير الدولية، ونساهم في تحسين الأداء، ونوفر دعمًا فنيًا متكاملاً عند صعوبة الحصول على قطع الغيار الأصيلة مع مراعاة حقوق الملكية الفكرية.',
    feature1Title: 'دعم الصناعة الوطنية',
    feature1Desc: 'نساهم في تنمية الصناعة المحلية',
    feature2Title: 'تطوير الأداء',
    feature2Desc: 'نعمل على تحسين أداء الأجهزة',
    feature3Title: 'إصلاح المكونات',
    feature3Desc: 'نقوم بإصلاح المكونات المعطلة',
    feature4Title: 'شراكات مستدامة',
    feature4Desc: 'نبني علاقات طويلة الأمد مع عملائنا',
    servicesTitle: 'خدماتنا',
    servicesDesc: 'نقدم مجموعة متكاملة من الخدمات التقنية لتلبية احتياجاتك',
    pcbNavLink: 'اطلب الآن',
    pcbOrderTitle: 'أرسل طلب تصنيع لوحات إلكترونية مطبوعة (PCB)',
    pcbOrderDesc:
      'احسب السعر فورًا وابعتلنا ملفات الجربر، وهنتواصل معاك لتأكيد الطلب',
    pcbNoticeBulk:
      'سعر خاص للكميات الكبيرة، وخدمة الشحن متاحة لجميع محافظات مصر.',
    pcbNoticeLeadTime:
      'مدة التصنيع من أسبوعين إلى ثلاثة أسابيع، ويوجد خدمة شحن عاجل.',
    pcbNoticeFiles:
      'يرجى التأكد من أن ملفات الجربر تحتوي على Drill Files - Board Outline - Solder Mask.',
    pcbPriceBeforeLabel: 'السعر قبل الخصم',
    pcbDiscountLabel: 'قيمة الخصم',
    pcbFinalPriceLabel: 'السعر النهائي',
    pcbCurrency: 'جنيه',
    pcbPerPiece: 'قطعة',
    pcbTimeLabel: 'الوقت:',
    pcbUploadText: 'اسحب وأفلت ملف الجربر هنا أو',
    pcbBrowseText: 'تصفح',
    pcbUploadHint: 'ملفات ZIP أو RAR فقط، حتى 100 ميجا',
    pcbLayersLabel: 'عدد الطبقات *',
    pcbQtyLabel: 'الكمية *',
    pcbDimensionsLabel: 'الأبعاد (مم) *',
    pcbThicknessLabel: 'السُمك (مم) *',
    pcbColorLabel: 'لون البوردة *',
    pcbRushLabel: 'تصنيع/شحن عاجل (رسوم إضافية)',
    pcbDiscountCodeLabel: 'كود الخصم',
    pcbDiscountCodePlaceholder: 'كود الخصم',
    pcbCalcButton: 'حساب السعر',
    pcbNameLabel: 'الاسم *',
    pcbPhoneLabel: 'رقم الهاتف *',
    pcbEmailLabel: 'البريد الإلكتروني (اختياري)',
    pcbSubmitButton: 'إرسال الطلب',
    servicePcbTitle: 'تصميم وتصنيع وتجميع اللوحات الإلكترونية (PCB)',
    servicePcbDesc:
      'نقدم خدمة متكاملة تشمل تصميم اللوحات الإلكترونية PCB وتصنيعها وتجميع مكوناتها Assembly بأعلى معايير الجودة والدقة، بداية من الفكرة الأولى وحتى المنتج النهائي الجاهز للتشغيل.',
    servicePcbMaintenanceTitle: 'صيانة اللوحات الإلكترونية (PCB Maintenance)',
    servicePcbMaintenanceDesc:
      'نقدم خدمة فحص وصيانة اللوحات الإلكترونية المعطلة وتشخيص الأعطال وإصلاح نقاط الضعف فيها، لإطالة عمر الجهاز وتقليل تكلفة استبدال القطع الأصلية.',
    serviceCncTitle: 'خدمات التشغيل بالـ CNC',
    serviceCncDesc:
      'نقدم خدمات التصنيع الدقيق باستخدام ماكينات CNC لإنتاج القطع المعدنية والبلاستيكية بمقاسات وتفاصيل دقيقة، تناسب قطع غيار الأجهزة الطبية والنماذج الصناعية.',
    service3dTitle: 'المسح والتصميم والطباعة ثلاثية الأبعاد',
    service3dDesc:
      'نقدم خدمة متكاملة تبدأ بالمسح الضوئي ثلاثي الأبعاد للقطعة الأصلية، مرورًا بإعادة تصميمها هندسيًا بدقة، وصولًا لطباعتها باستخدام أحدث تقنيات الطباعة ثلاثية الأبعاد.',
    readMore: 'اعرف أكثر',
    reverseTitle: 'الهندسة العكسية للأجهزة الطبية',
    reverseDesc:
      'نحن نقدم خدمات الهندسة العكسية للأجهزة الطبية لفهم وتصميم وتطوير الأجهزة بدقة عالية، من خلال فريق متخصص يمتلك خبرة قوية في تحليل الأنظمة الطبية المعقدة. نعمل على تحليل وفحص مكونات وأداء الأجهزة بدقة عالية باستخدام أحدث أدوات القياس والمسح ثلاثي الأبعاد.',
    readMore2: 'اقرأ المزيد',
    projectsTitle: 'مشاريعنا',
    projectsDesc:
      'نماذج من أعمالنا ومشاريعنا المنجزة في مجال الهندسة العكسية والتصنيع والطباعة ثلاثية الأبعاد',
    project1Tag: 'هندسة عكسية',
    project1Title: 'إعادة تصنيع قطعة غيار لجهاز أشعة',
    project1Desc:
      'مسح ثلاثي الأبعاد وإعادة تصميم قطعة غيار أصلية لجهاز أشعة طبي غير متوفرة في السوق.',
    project2Tag: 'طباعة ثلاثية الأبعاد',
    project2Title: 'نمذجة ثلاثية الأبعاد لمكونات جهاز تنفس',
    project2Desc:
      'تصميم وطباعة مكونات بلاستيكية دقيقة لجهاز تنفس صناعي بمواصفات مطابقة للأصل.',
    project3Tag: 'تصنيع إلكتروني',
    project3Title: 'تصنيع لوحة إلكترونية لجهاز مراقبة القلب',
    project3Desc:
      'تصميم وتصنيع لوحة PCB بديلة لجهاز مراقبة القلب مع فحص كامل للأداء.',
    project4Tag: 'صيانة ومعايرة',
    project4Title: 'معايرة جهاز تحليل الدم',
    project4Desc:
      'صيانة ومعايرة دورية لجهاز تحليل دم بمستشفى شريك وفق المعايير الدولية.',
    project5Tag: 'طباعة ثلاثية الأبعاد',
    project5Title: 'طباعة هيكل خارجي لجهاز طبي محمول',
    project5Desc:
      'إعادة تصميم وطباعة هيكل خارجي متين لجهاز طبي محمول بعد تلف الهيكل الأصلي.',
    project6Tag: 'هندسة عكسية',
    project6Title: 'إصلاح وحدة تحكم لجهاز ليزر طبي',
    project6Desc:
      'تحليل الدائرة الأصلية وإصلاح وحدة التحكم الإلكترونية لجهاز ليزر طبي معطل.',
    clientsTitle: 'عملائنا',
    clientsDesc: 'نفخر بشراكتنا مع أبرز المؤسسات الطبية والصناعية',
    info1Title: 'أدوات متطورة',
    info1Desc: 'نستخدم أحدث الأدوات والتقنيات لضمان جودة الخدمة',
    info2Title: 'فريق خبير',
    info2Desc: 'فريق من المهندسين والفنيين ذوي الخبرة الواسعة',
    info3Title: 'جودة مضمونة',
    info3Desc: 'نلتزم بأعلى معايير الجودة في جميع خدماتنا',
    info4Title: 'دعم فني',
    info4Desc: 'خدمة عملاء على أعلى مستوى متاحة على مدار الساعة',
    contactTitle: 'اتصل بنا',
    contactDesc: 'يسعدنا تواصلكم معنا لأي استفسار أو طلب خدمة',
    addressTitle: 'عنواننا',
    address: 'قطعة 9367 شارع هدى شعراوى – المقطم – القاهرة – مصر',
    phoneTitle: 'هاتفنا',
    emailTitle: 'البريد الإلكتروني',
    hoursTitle: 'ساعات العمل',
    hours: 'السبت - الخميس: 9 ص - 5 م',
    sendMessage: 'أرسل رسالة',
    nameLabel: 'الاسم',
    emailLabel: 'البريد الإلكتروني',
    messageLabel: 'الرسالة',
    sendButton: 'إرسال',
    footerDesc:
      'تُعدّ شركة ريفيرس تك مصدرًا شاملًا لجميع إحتياجات شركات الاجهزة الطبية والمستشفيات وجميع العاملين في مجال الاجهزة الطبية واجهزة الليزر . نتخصص في تصميم وصناعة كل قطع غيار الاجهزة الطبية بما فيها الدوائر و اللوحات الالكترونية والحساسات والشاشات وجميع القطع البلاستكية والمعدنية',
    quickLinks: 'روابط سريعة',
    ourServices: 'خدماتنا',
    subscribeTitle: 'اشترك في النشرة البريدية',
    subscribeDesc: 'اشترك لتصلك آخر أخبارنا وعروضنا',
    emailPlaceholder: 'بريدك الإلكتروني',
    orderNowTitle: 'اطلب الآن',
    orderNowDesc: 'اختر الخدمة المطلوبة وابدأ طلبك بسهولة',
  };

  // نصوص اللغة الإنجليزية
  const englishTexts = {
    home: 'Home',
    about: 'About Us',
    services: 'Services',
    clients: 'Clients',
    reverse: 'Reverse Engineering',
    projects: 'Our Projects',
    contact: 'Contact Us',
    heroTitle: 'Integrated Technical Solutions for a Better Future',
    heroDesc:
      'At Reverse Tech, we provide integrated services in maintenance, calibration, manufacturing, and 3D printing with the highest quality standards',
    ctaButton: 'Request Service',
    aboutTitle: 'About Us',
    aboutDesc:
      "Reverse Tech specializes in providing reverse engineering services for medical devices. We analyze and examine device components and performance with high precision using the latest measurement tools and 3D scanning. We provide our services to hospitals and medical institutions, help manufacturers comply with international standards, contribute to performance improvement, and provide integrated technical support when it's difficult to obtain original spare parts while respecting intellectual property rights.",
    feature1Title: 'Support National Industry',
    feature1Desc: 'We contribute to the development of local industry',
    feature2Title: 'Performance Development',
    feature2Desc: 'We work to improve device performance',
    feature3Title: 'Component Repair',
    feature3Desc: 'We repair faulty components',
    feature4Title: 'Sustainable Partnerships',
    feature4Desc: 'We build long-term relationships with our clients',
    servicesTitle: 'Our Services',
    servicesDesc:
      'We provide a comprehensive set of technical services to meet your needs',
    pcbNavLink: 'Order Now',
    pcbOrderTitle: 'Send a PCB Manufacturing Request',
    pcbOrderDesc:
      "Get an instant price and send us your gerber files — we'll contact you to confirm the order",
    pcbNoticeBulk:
      'Special pricing for bulk quantities. Shipping is available to all governorates in Egypt.',
    pcbNoticeLeadTime:
      'Manufacturing takes 2 to 3 weeks, with a rush shipping option available.',
    pcbNoticeFiles:
      'Please make sure your gerber files include Drill Files, Board Outline, and Solder Mask.',
    pcbPriceBeforeLabel: 'Price Before Discount',
    pcbDiscountLabel: 'Discount Value',
    pcbFinalPriceLabel: 'Final Price',
    pcbCurrency: 'EGP',
    pcbPerPiece: 'piece',
    pcbTimeLabel: 'Time:',
    pcbUploadText: 'Drag & drop your gerber file here or',
    pcbBrowseText: 'Browse',
    pcbUploadHint: 'ZIP or RAR files only, up to 100MB',
    pcbLayersLabel: 'Layers *',
    pcbQtyLabel: 'Quantity *',
    pcbDimensionsLabel: 'Dimensions (mm) *',
    pcbThicknessLabel: 'Thickness (mm) *',
    pcbColorLabel: 'Board Color *',
    pcbRushLabel: 'Rush manufacturing/shipping (extra fees)',
    pcbDiscountCodeLabel: 'Discount Code',
    pcbDiscountCodePlaceholder: 'Discount code',
    pcbCalcButton: 'Calculate Price',
    pcbNameLabel: 'Name *',
    pcbPhoneLabel: 'Phone Number *',
    pcbEmailLabel: 'Email (optional)',
    pcbSubmitButton: 'Send Request',
    servicePcbTitle: 'PCB Design, Manufacturing & Assembly',
    servicePcbDesc:
      'A complete PCB service covering design, manufacturing, and component assembly — from initial concept to a fully functional finished product, built to the highest standards of quality and precision.',
    servicePcbMaintenanceTitle: 'PCB Maintenance',
    servicePcbMaintenanceDesc:
      "We inspect and repair faulty electronic boards, diagnosing failures and fixing weak points — extending the device's lifespan and reducing the cost of original replacement parts.",
    serviceCncTitle: 'CNC Machining',
    serviceCncDesc:
      'We provide precision CNC machining services to produce metal and plastic parts with exact dimensions and fine detail, suited to medical device spare parts and industrial prototypes.',
    service3dTitle: '3D Scanning, Designing & Printing',
    service3dDesc:
      'A complete service that starts with 3D scanning the original part, followed by precise engineering redesign, and ends with high-precision printing using the latest 3D printing technologies.',
    readMore: 'Read More',
    reverseTitle: 'Reverse Engineering for Medical Devices',
    reverseDesc:
      'We provide reverse engineering services for medical devices to understand, design, and develop devices with high accuracy, through a specialized team with strong experience in analyzing complex medical systems. We work on analyzing and examining device components and performance with high precision using the latest measurement tools and 3D scanning.',
    readMore2: 'Read More',
    projectsTitle: 'Our Projects',
    projectsDesc:
      'Examples of our completed work in reverse engineering, manufacturing, and 3D printing',
    project1Tag: 'Reverse Engineering',
    project1Title: 'Reverse-Engineered X-Ray Machine Spare Part',
    project1Desc:
      '3D scanning and redesign of an original spare part for a medical X-ray machine that was no longer available on the market.',
    project2Tag: '3D Printing',
    project2Title: '3D Modeling of Ventilator Components',
    project2Desc:
      'Design and printing of precise plastic components for an industrial ventilator, matching the original specifications.',
    project3Tag: 'Electronic Manufacturing',
    project3Title: 'PCB Manufacturing for a Cardiac Monitor',
    project3Desc:
      'Design and manufacturing of a replacement PCB for a cardiac monitor, with full performance testing.',
    project4Tag: 'Maintenance & Calibration',
    project4Title: 'Blood Analysis Device Calibration',
    project4Desc:
      'Routine maintenance and calibration of a blood analysis device at a partner hospital, in line with international standards.',
    project5Tag: '3D Printing',
    project5Title: 'Housing Printed for a Portable Medical Device',
    project5Desc:
      'Redesign and printing of a durable outer housing for a portable medical device after the original housing was damaged.',
    project6Tag: 'Reverse Engineering',
    project6Title: 'Control Unit Repair for a Medical Laser Device',
    project6Desc:
      'Analysis of the original circuit and repair of the electronic control unit for a faulty medical laser device.',
    clientsTitle: 'Our Clients',
    clientsDesc:
      'We are proud of our partnership with leading medical and industrial institutions',
    info1Title: 'Advanced Tools',
    info1Desc:
      'We use the latest tools and technologies to ensure service quality',
    info2Title: 'Expert Team',
    info2Desc: 'A team of engineers and technicians with extensive experience',
    info3Title: 'Guaranteed Quality',
    info3Desc: 'We adhere to the highest quality standards in all our services',
    info4Title: 'Technical Support',
    info4Desc: 'Premium customer service available 24/7',
    contactTitle: 'Contact Us',
    contactDesc:
      'We are happy to communicate with you for any inquiry or service request',
    addressTitle: 'Our Address',
    address: 'Piece 9367, Hoda Shaarawi Street - Al-Mokatam - Cairo - Egypt',
    phoneTitle: 'Our Phone',
    emailTitle: 'Email',
    hoursTitle: 'Working Hours',
    hours: 'Saturday - Thursday: 9 AM - 5 PM',
    sendMessage: 'Send Message',
    nameLabel: 'Name',
    emailLabel: 'Email',
    messageLabel: 'Message',
    sendButton: 'Send',
    footerDesc:
      'Reverse Tech is a comprehensive source for all the needs of medical device companies, hospitals, and all workers in the field of medical devices and laser devices. We specialize in designing and manufacturing all medical device spare parts, including circuits, electronic boards, sensors, screens, and all plastic and metal parts.',
    quickLinks: 'Quick Links',
    ourServices: 'Our Services',
    subscribeTitle: 'Subscribe to Newsletter',
    subscribeDesc: 'Subscribe to receive our latest news and offers',
    emailPlaceholder: 'Your Email',
    orderNowTitle: 'Order Now',
    orderNowDesc: 'Choose the service you need and start your order easily',
  };

  // وظيفة تغيير اللغة
  function toggleLanguage() {
    isEnglish = !isEnglish;

    // تغيير اتجاه الصفحة
    document.body.classList.toggle('english', isEnglish);
    document.documentElement.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');
    document.documentElement.setAttribute('lang', isEnglish ? 'en' : 'ar');
    localStorage.setItem('reverseTechLanguage', isEnglish ? 'en' : 'ar');

    // تغيير نص زر التبديل
    if (languageToggle) languageToggle.querySelector('span').textContent = isEnglish
      ? 'العربية'
      : 'English';

    // تطبيق النصوص المناسبة
    const texts = isEnglish ? englishTexts : arabicTexts;

    // تحديث جميع العناصر التي تحتوي على بيانات النص
    document.querySelectorAll('[data-key]').forEach((element) => {
      const key = element.getAttribute('data-key');
      if (texts[key]) {
        if (
          element.tagName === 'INPUT' &&
          element.hasAttribute('placeholder')
        ) {
          element.setAttribute('placeholder', texts[key]);
        } else {
          element.textContent = texts[key];
        }
      }
    });

    // تحديث العناصر العامة التي تستخدم data-ar / data-en
    document.querySelectorAll('[data-ar][data-en]').forEach((element) => {
      const value = isEnglish ? element.dataset.en : element.dataset.ar;
      if (element.matches('input, textarea') && element.hasAttribute('placeholder')) {
        element.placeholder = value;
      } else {
        element.textContent = value;
      }
    });
    document.querySelectorAll('[data-ar-placeholder][data-en-placeholder]').forEach((element) => {
      element.placeholder = isEnglish ? element.dataset.enPlaceholder : element.dataset.arPlaceholder;
    });
    document.dispatchEvent(new CustomEvent('reverseTechLanguageChanged', { detail: { english: isEnglish } }));

    // إعادة رسم كروت المشاريع باللغة الجديدة
    renderProjects();
  }

  // تطبيق اللغة المحفوظة عند فتح الصفحة بدون قلب القيمة
  if (isEnglish) {
    isEnglish = false;
    toggleLanguage();
  }

  // إضافة حدث النقر على زر التبديل
  if (languageToggle) languageToggle.addEventListener('click', toggleLanguage);

  // عرض كروت المشاريع (من الباك اند عبر /api/projects) وربطها بتأثير الظهور عند التمرير
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // تخزين مؤقت في الذاكرة عشان تبديل اللغة ميعملش طلب جديد للسيرفر في كل مرة
  let cachedProjects = null;

  async function fetchProjectsFromServer() {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('server error');
      cachedProjects = await res.json();
      localStorage.setItem('reverseTechProjectsCached', JSON.stringify(cachedProjects));
    } catch (e) {
      console.error('تعذر تحميل المشاريع من الخادم:', e);
      cachedProjects = cachedProjects || [];
    }
    return cachedProjects;
  }

  function renderProjectsList(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    const lang = isEnglish ? 'en' : 'ar';
    const delays = ['delay-1', 'delay-2', 'delay-3'];

    if (projects.length === 0) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = projects
      .map((project, index) => {
        const tag = escapeHtml(project['tag_' + lang]);
        const title = escapeHtml(project['title_' + lang]);
        const desc = escapeHtml(project['desc_' + lang]);
        const image = escapeHtml(project.image);
        const delayClass = delays[index % delays.length];

        return `
                <div class="project-card animate ${delayClass}">
                    <div class="project-image">
                        <img src="${image}" alt="${title}">
                        <div class="project-overlay">
                            <a href="${image}" target="_blank" class="project-zoom"><i class="fas fa-search-plus"></i></a>
                        </div>
                    </div>
                    <div class="project-content">
                        <span class="project-tag">${tag}</span>
                        <h3>${title}</h3>
                        <p>${desc}</p>
                    </div>
                </div>
            `;
      })
      .join('');

    // مراقبة كروت المشاريع الجديدة لتأثير الظهور عند التمرير
    grid.querySelectorAll('.project-card').forEach((card) => {
      observer.observe(card);
    });
  }

  async function renderProjects() {
    if (!cachedProjects) {
      const cached = localStorage.getItem('reverseTechProjectsCached');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length) {
            cachedProjects = parsed;
            renderProjectsList(cachedProjects);
          }
        } catch (e) {}
      }
    }
    const fresh = await fetchProjectsFromServer();
    renderProjectsList(fresh);
  }

  // العرض الأول للمشاريع عند تحميل الصفحة (بيجيبهم من السيرفر)
  renderProjects();

  // سلايدر فيديو الخدمات - يعرض كل فيديو 4 ثواني ثم ينتقل للتالي بالترتيب ويعيد الكرّة
  const videoSlides = document.querySelectorAll('.video-slide');
  const videoDots = document.querySelectorAll('.video-dot');
  let currentVideoSlide = 0;
  let videoSliderInterval;

  function showVideoSlide(index) {
    videoSlides.forEach((slide, i) => {
      const video = slide.querySelector('video');
      if (i === index) {
        slide.classList.add('active');
        if (video) {
          video.currentTime = 0;
          video.play().catch(() => {});
        }
      } else {
        slide.classList.remove('active');
        if (video) {
          video.pause();
        }
      }
    });

    videoDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    currentVideoSlide = index;
  }

  function nextVideoSlide() {
    const next = (currentVideoSlide + 1) % videoSlides.length;
    showVideoSlide(next);
  }

  function startVideoSlider() {
    clearInterval(videoSliderInterval);
    videoSliderInterval = setInterval(nextVideoSlide, 4000);
  }

  if (videoSlides.length > 0) {
    showVideoSlide(0);
    startVideoSlider();

    videoDots.forEach((dot, i) => {
      dot.addEventListener('click', function () {
        showVideoSlide(i);
        startVideoSlider();
      });
    });
  }

  // زرار "اطلب خدمة" - ينقل المستخدم إلى قسم "اطلب الآن" نفسه
  const requestServiceBtn = document.querySelector('.request-service-btn');
  if (requestServiceBtn) {
    requestServiceBtn.addEventListener('click', function () {
      const orderSection = document.getElementById('orderNow');
      if (orderSection) {
        orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.href = 'order.html';
      }
    });
  }

  // ==================== حاسبة طلب تصنيع PCB ====================
  const pcbUploadZone = document.getElementById('pcbUploadZone');
  const pcbGerberFile = document.getElementById('pcbGerberFile');
  const pcbUploadFilename = document.getElementById('pcbUploadFilename');
  const pcbColorSwatches = document.querySelectorAll('.pcb-color-swatch');
  const pcbCalcBtn = document.getElementById('pcbCalcBtn');
  const pcbContactFields = document.getElementById('pcbContactFields');
  const pcbOrderForm = document.getElementById('pcbOrderForm');
  const pcbSubmitBtn = document.getElementById('pcbSubmitBtn');
  const pcbFormMessage = document.getElementById('pcbFormMessage');

  if (pcbOrderForm) {
    let selectedPcbColor = 'green';
    let lastQuote = null;

    // -------- منطقة رفع الملف (سحب وإفلات + تصفح) --------
    pcbUploadZone.addEventListener('click', () => pcbGerberFile.click());

    pcbUploadZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      pcbUploadZone.classList.add('drag-active');
    });

    pcbUploadZone.addEventListener('dragleave', function () {
      pcbUploadZone.classList.remove('drag-active');
    });

    pcbUploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      pcbUploadZone.classList.remove('drag-active');
      if (e.dataTransfer.files.length > 0) {
        pcbGerberFile.files = e.dataTransfer.files;
        updatePcbFilename();
      }
    });

    pcbGerberFile.addEventListener('change', updatePcbFilename);

    function updatePcbFilename() {
      if (pcbGerberFile.files.length > 0) {
        pcbUploadFilename.textContent = '📎 ' + pcbGerberFile.files[0].name;
      } else {
        pcbUploadFilename.textContent = '';
      }
    }

    // -------- اختيار لون البوردة --------
    pcbColorSwatches.forEach((swatch) => {
      swatch.addEventListener('click', function () {
        pcbColorSwatches.forEach((s) => s.classList.remove('active'));
        swatch.classList.add('active');
        selectedPcbColor = swatch.getAttribute('data-color');
      });
    });

    // -------- تجميع بيانات المواصفات الحالية --------
    function getPcbSpecs() {
      return {
        layers: document.getElementById('pcbLayers').value,
        quantity: document.getElementById('pcbQty').value,
        width_mm: document.getElementById('pcbWidth').value,
        length_mm: document.getElementById('pcbLength').value,
        thickness_mm: document.getElementById('pcbThickness').value,
        color: selectedPcbColor,
        rush: document.getElementById('pcbRush').checked,
        discount_code: document.getElementById('pcbDiscountCode').value.trim(),
        shipping_method: document.querySelector('#pcbOrderForm [name="shipping_method"]:checked')?.value || 'pickup',
        shipping_country: document.querySelector('#pcbOrderForm [name="shipping_country"]')?.value || '',
        shipping_address: document.querySelector('#pcbOrderForm [name="shipping_address"]')?.value || '',
        shipping_recipient_name: document.querySelector('#pcbOrderForm [name="shipping_recipient_name"]')?.value || '',
        shipping_phone: document.querySelector('#pcbOrderForm [name="shipping_phone"]')?.value || '',
        shipping_weight_kg: document.querySelector('#pcbOrderForm [name="shipping_weight_kg"]')?.value || 1,
      };
    }

    // -------- حساب السعر عبر الباك اند --------
    pcbCalcBtn.addEventListener('click', async function () {
      const specs = getPcbSpecs();

      if (
        !specs.width_mm ||
        !specs.length_mm ||
        Number(specs.width_mm) <= 0 ||
        Number(specs.length_mm) <= 0
      ) {
        showPcbMessage(
          'error',
          isEnglish
            ? 'Please enter valid board dimensions'
            : 'من فضلك أدخل أبعاد صحيحة للبوردة',
        );
        return;
      }

      pcbCalcBtn.disabled = true;
      pcbCalcBtn.textContent = isEnglish ? 'Calculating...' : 'جاري الحساب...';

      try {
        const res = await fetch('/api/pcb-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(specs),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'حصل خطأ أثناء حساب السعر');

        lastQuote = data;
        document.getElementById('pcbPriceBefore').innerHTML =
          data.price_before_discount +
          ' <span>' +
          (isEnglish ? 'EGP' : 'جنيه') +
          '</span>';
        document.getElementById('pcbDiscountValue').innerHTML =
          data.discount_value +
          ' <span>' +
          (isEnglish ? 'EGP' : 'جنيه') +
          '</span>';
        document.getElementById('pcbFinalPrice').innerHTML =
          data.final_price +
          ' <span>' +
          (isEnglish ? 'EGP' : 'جنيه') +
          '</span>';
        document.getElementById('pcbPerUnitNote').innerHTML =
          '(' +
          data.price_per_unit +
          ' ' +
          (isEnglish ? 'EGP' : 'جنيه') +
          ' / ' +
          (isEnglish ? 'piece' : 'قطعة') +
          ')';
        document.getElementById('pcbQuoteLeadTimeText').textContent =
          data.lead_time;

        pcbContactFields.classList.add('visible');
        pcbContactFields.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
        showPcbMessage(null, '');
      } catch (err) {
        showPcbMessage('error', err.message);
      } finally {
        pcbCalcBtn.disabled = false;
        pcbCalcBtn.innerHTML =
          '<i class="fas fa-calculator"></i> ' +
          (isEnglish ? 'Calculate Price' : 'حساب السعر');
      }
    });

    // -------- إرسال الطلب النهائي --------
    pcbOrderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!lastQuote) {
        showPcbMessage('error', isEnglish ? 'Please calculate the price first' : 'من فضلك احسب السعر الأول');
        return;
      }
      const name = document.getElementById('pcbCustomerName').value.trim();
      const phone = document.getElementById('pcbCustomerPhone').value.trim();
      if (!name || !phone) {
        showPcbMessage('error', isEnglish ? 'Please enter your name and phone number' : 'من فضلك أدخل الاسم ورقم الهاتف');
        return;
      }
      const specs = getPcbSpecs();
      const formData = new FormData();
      formData.append('customer_name', name);
      formData.append('customer_phone', phone);
      formData.append('customer_email', document.getElementById('pcbCustomerEmail').value.trim());
      formData.append('layers', specs.layers);
      formData.append('quantity', specs.quantity);
      formData.append('width_mm', specs.width_mm);
      formData.append('length_mm', specs.length_mm);
      formData.append('thickness_mm', specs.thickness_mm);
      formData.append('color', specs.color);
      formData.append('rush', specs.rush);
      formData.append('discount_code', specs.discount_code);
      formData.append('shipping_method', specs.shipping_method);
      formData.append('shipping_country', specs.shipping_country);
      formData.append('shipping_address', specs.shipping_address);
      formData.append('shipping_recipient_name', specs.shipping_recipient_name);
      formData.append('shipping_phone', specs.shipping_phone);
      formData.append('shipping_weight_kg', specs.shipping_weight_kg);
      if (pcbGerberFile.files.length > 0) formData.append('gerber_file', pcbGerberFile.files[0]);

      const pcbWhatsappText = [
        'طلب PCB جديد من موقع Reverse Tech',
        `الاسم: ${name}`,
        `الهاتف: ${phone}`,
        `البريد: ${document.getElementById('pcbCustomerEmail').value.trim() || '-'}`,
        `عدد الطبقات: ${specs.layers}`,
        `الكمية: ${specs.quantity}`,
        `المقاس: ${specs.width_mm} × ${specs.length_mm} مم`,
        `السُمك: ${specs.thickness_mm} مم`,
        `اللون: ${specs.color}`,
        `السعر التقديري: ${lastQuote?.total ?? '-'} جنيه`
      ].join('\n');
      const pcbWhatsappUrl = `https://wa.me/201114578817?text=${encodeURIComponent(pcbWhatsappText)}`;
      const whatsappWindow = window.open(pcbWhatsappUrl, '_blank', 'noopener');
      pcbSubmitBtn.disabled = true;
      pcbSubmitBtn.textContent = isEnglish ? 'Sending...' : 'جاري الإرسال...';
      try {
        const res = await fetch('/api/pcb-orders', { method: 'POST', body: formData });
        const text = await res.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch (_) { throw new Error('استجابة غير صحيحة من الخادم'); }
        if (!res.ok) throw new Error(data.error || 'حصل خطأ أثناء إرسال الطلب');
        showPcbMessage('success', isEnglish ? 'Your request was sent successfully!' : 'تم إرسال طلبك بنجاح! وتم تسجيله وإرسال الإشعارات.');
        // WhatsApp was opened immediately with the prepared request text.
        if (!whatsappWindow) window.open(pcbWhatsappUrl, '_blank', 'noopener');
        pcbOrderForm.reset();
        pcbUploadFilename.textContent = '';
        pcbContactFields.classList.remove('visible');
        lastQuote = null;
      } catch (err) {
        if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();
        showPcbMessage('error', err.message);
      } finally {
        pcbSubmitBtn.disabled = false;
        pcbSubmitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> ' + (isEnglish ? 'Send Request' : 'إرسال الطلب');
      }
    });

    function showPcbMessage(type, text) {
      if (!type) {
        pcbFormMessage.className = 'pcb-form-message';
        pcbFormMessage.textContent = '';
        return;
      }
      pcbFormMessage.className = 'pcb-form-message ' + type;
      pcbFormMessage.textContent = text;
    }
  }
});
