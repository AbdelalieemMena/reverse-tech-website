

// كود الجافاسكريبت للتحكم في القائمة المتحركة وتأثيرات الظهور
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const closeMenuBtn = document.querySelector('.close-menu');
    const navLinks = document.querySelector('.nav-links');
    
    // فتح وإغلاق القائمة على الأجهزة المحمولة
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.add('active');
    });
    
    closeMenuBtn.addEventListener('click', function() {
        navLinks.classList.remove('active');
    });
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
        });
    });
    
    // تأثير الظهور للعناصر عند التمرير
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // مراقبة عناصر الخدمات
    document.querySelectorAll('.service-card').forEach(card => {
        observer.observe(card);
    });

    // مراقبة عناصر المشاريع
    document.querySelectorAll('.project-card').forEach(card => {
        observer.observe(card);
    });
    
    // نظام التبديل بين اللغتين
    const languageToggle = document.getElementById('languageToggle');
    let isEnglish = false;
    
    // نصوص اللغة العربية
    const arabicTexts = {
        home: "الرئيسية",
        about: "من نحن",
        services: "خدماتنا",
        clients: "عملائنا",
        reverse: "الهندسة العكسية",
        projects: "مشاريعنا",
        contact: "اتصل بنا",
        heroTitle: "حلول تقنية متكاملة لمستقبل أفضل",
        heroDesc: "نقدم في Reverse Tech خدمات متكاملة في مجال الصيانة، المعايرة، التصنيع والطباعة ثلاثية الأبعاد بأعلى معايير الجودة",
        ctaButton: "اطلب خدمة",
        aboutTitle: "من نحن",
        aboutDesc: "شركة Reverse Tech متخصصة في تقديم خدمات الهندسة العكسية للأجهزة الطبية. نعمل على تحليل وفحص مكونات وأداء الأجهزة بدقة عالية باستخدام أحدث أدوات القياس والمسح ثلاثي الأبعاد. نقدم خدماتنا إلى المستشفيات والمؤسسات الطبية، ونساعد المصنعين على الالتزام بالمعايير الدولية، ونساهم في تحسين الأداء، ونوفر دعمًا فنيًا متكاملاً عند صعوبة الحصول على قطع الغيار الأصيلة مع مراعاة حقوق الملكية الفكرية.",
        feature1Title: "دعم الصناعة الوطنية",
        feature1Desc: "نساهم في تنمية الصناعة المحلية",
        feature2Title: "تطوير الأداء",
        feature2Desc: "نعمل على تحسين أداء الأجهزة",
        feature3Title: "إصلاح المكونات",
        feature3Desc: "نقوم بإصلاح المكونات المعطلة",
        feature4Title: "شراكات مستدامة",
        feature4Desc: "نبني علاقات طويلة الأمد مع عملائنا",
        servicesTitle: "خدماتنا",
        servicesDesc: "نقدم مجموعة متكاملة من الخدمات التقنية لتلبية احتياجاتك",
        servicePcbTitle: "تصميم وتصنيع وتجميع اللوحات الإلكترونية (PCB)",
        servicePcbDesc: "نقدم خدمة متكاملة تشمل تصميم اللوحات الإلكترونية PCB وتصنيعها وتجميع مكوناتها Assembly بأعلى معايير الجودة والدقة، بداية من الفكرة الأولى وحتى المنتج النهائي الجاهز للتشغيل.",
        servicePcbMaintenanceTitle: "صيانة اللوحات الإلكترونية (PCB Maintenance)",
        servicePcbMaintenanceDesc: "نقدم خدمة فحص وصيانة اللوحات الإلكترونية المعطلة وتشخيص الأعطال وإصلاح نقاط الضعف فيها، لإطالة عمر الجهاز وتقليل تكلفة استبدال القطع الأصلية.",
        serviceCncTitle: "خدمات التشغيل بالـ CNC",
        serviceCncDesc: "نقدم خدمات التصنيع الدقيق باستخدام ماكينات CNC لإنتاج القطع المعدنية والبلاستيكية بمقاسات وتفاصيل دقيقة، تناسب قطع غيار الأجهزة الطبية والنماذج الصناعية.",
        service3dTitle: "المسح والتصميم والطباعة ثلاثية الأبعاد",
        service3dDesc: "نقدم خدمة متكاملة تبدأ بالمسح الضوئي ثلاثي الأبعاد للقطعة الأصلية، مرورًا بإعادة تصميمها هندسيًا بدقة، وصولًا لطباعتها باستخدام أحدث تقنيات الطباعة ثلاثية الأبعاد.",
        readMore: "اعرف أكثر",
        reverseTitle: "الهندسة العكسية للأجهزة الطبية",
        reverseDesc: "نحن نقدم خدمات الهندسة العكسية للأجهزة الطبية لفهم وتصميم وتطوير الأجهزة بدقة عالية، من خلال فريق متخصص يمتلك خبرة قوية في تحليل الأنظمة الطبية المعقدة. نعمل على تحليل وفحص مكونات وأداء الأجهزة بدقة عالية باستخدام أحدث أدوات القياس والمسح ثلاثي الأبعاد.",
        readMore2: "اقرأ المزيد",
        projectsTitle: "مشاريعنا",
        projectsDesc: "نماذج من أعمالنا ومشاريعنا المنجزة في مجال الهندسة العكسية والتصنيع والطباعة ثلاثية الأبعاد",
        project1Tag: "هندسة عكسية",
        project1Title: "إعادة تصنيع قطعة غيار لجهاز أشعة",
        project1Desc: "مسح ثلاثي الأبعاد وإعادة تصميم قطعة غيار أصلية لجهاز أشعة طبي غير متوفرة في السوق.",
        project2Tag: "طباعة ثلاثية الأبعاد",
        project2Title: "نمذجة ثلاثية الأبعاد لمكونات جهاز تنفس",
        project2Desc: "تصميم وطباعة مكونات بلاستيكية دقيقة لجهاز تنفس صناعي بمواصفات مطابقة للأصل.",
        project3Tag: "تصنيع إلكتروني",
        project3Title: "تصنيع لوحة إلكترونية لجهاز مراقبة القلب",
        project3Desc: "تصميم وتصنيع لوحة PCB بديلة لجهاز مراقبة القلب مع فحص كامل للأداء.",
        project4Tag: "صيانة ومعايرة",
        project4Title: "معايرة جهاز تحليل الدم",
        project4Desc: "صيانة ومعايرة دورية لجهاز تحليل دم بمستشفى شريك وفق المعايير الدولية.",
        project5Tag: "طباعة ثلاثية الأبعاد",
        project5Title: "طباعة هيكل خارجي لجهاز طبي محمول",
        project5Desc: "إعادة تصميم وطباعة هيكل خارجي متين لجهاز طبي محمول بعد تلف الهيكل الأصلي.",
        project6Tag: "هندسة عكسية",
        project6Title: "إصلاح وحدة تحكم لجهاز ليزر طبي",
        project6Desc: "تحليل الدائرة الأصلية وإصلاح وحدة التحكم الإلكترونية لجهاز ليزر طبي معطل.",
        clientsTitle: "عملائنا",
        clientsDesc: "نفخر بشراكتنا مع أبرز المؤسسات الطبية والصناعية",
        info1Title: "أدوات متطورة",
        info1Desc: "نستخدم أحدث الأدوات والتقنيات لضمان جودة الخدمة",
        info2Title: "فريق خبير",
        info2Desc: "فريق من المهندسين والفنيين ذوي الخبرة الواسعة",
        info3Title: "جودة مضمونة",
        info3Desc: "نلتزم بأعلى معايير الجودة في جميع خدماتنا",
        info4Title: "دعم فني",
        info4Desc: "خدمة عملاء على أعلى مستوى متاحة على مدار الساعة",
        contactTitle: "اتصل بنا",
        contactDesc: "يسعدنا تواصلكم معنا لأي استفسار أو طلب خدمة",
        addressTitle: "عنواننا",
        address: "قطعة 9367 شارع هدى شعراوى – المقطم – القاهرة – مصر",
        phoneTitle: "هاتفنا",
        emailTitle: "البريد الإلكتروني",
        hoursTitle: "ساعات العمل",
        hours: "السبت - الخميس: 9 ص - 5 م",
        sendMessage: "أرسل رسالة",
        nameLabel: "الاسم",
        emailLabel: "البريد الإلكتروني",
        messageLabel: "الرسالة",
        sendButton: "إرسال",
        footerDesc: "تُعدّ شركة ريفيرس تك مصدرًا شاملًا لجميع إحتياجات شركات الاجهزة الطبية والمستشفيات وجميع العاملين في مجال الاجهزة الطبية واجهزة الليزر . نتخصص في تصميم وصناعة كل قطع غيار الاجهزة الطبية بما فيها الدوائر و اللوحات الالكترونية والحساسات والشاشات وجميع القطع البلاستكية والمعدنية",
        quickLinks: "روابط سريعة",
        ourServices: "خدماتنا",
        subscribeTitle: "اشترك في النشرة البريدية",
        subscribeDesc: "اشترك لتصلك آخر أخبارنا وعروضنا",
        emailPlaceholder: "بريدك الإلكتروني"
    };
    
    // نصوص اللغة الإنجليزية
    const englishTexts = {
        home: "Home",
        about: "About Us",
        services: "Services",
        clients: "Clients",
        reverse: "Reverse Engineering",
        projects: "Our Projects",
        contact: "Contact Us",
        heroTitle: "Integrated Technical Solutions for a Better Future",
        heroDesc: "At Reverse Tech, we provide integrated services in maintenance, calibration, manufacturing, and 3D printing with the highest quality standards",
        ctaButton: "Request Service",
        aboutTitle: "About Us",
        aboutDesc: "Reverse Tech specializes in providing reverse engineering services for medical devices. We analyze and examine device components and performance with high precision using the latest measurement tools and 3D scanning. We provide our services to hospitals and medical institutions, help manufacturers comply with international standards, contribute to performance improvement, and provide integrated technical support when it's difficult to obtain original spare parts while respecting intellectual property rights.",
        feature1Title: "Support National Industry",
        feature1Desc: "We contribute to the development of local industry",
        feature2Title: "Performance Development",
        feature2Desc: "We work to improve device performance",
        feature3Title: "Component Repair",
        feature3Desc: "We repair faulty components",
        feature4Title: "Sustainable Partnerships",
        feature4Desc: "We build long-term relationships with our clients",
        servicesTitle: "Our Services",
        servicesDesc: "We provide a comprehensive set of technical services to meet your needs",
        servicePcbTitle: "PCB Design, Manufacturing & Assembly",
        servicePcbDesc: "A complete PCB service covering design, manufacturing, and component assembly — from initial concept to a fully functional finished product, built to the highest standards of quality and precision.",
        servicePcbMaintenanceTitle: "PCB Maintenance",
        servicePcbMaintenanceDesc: "We inspect and repair faulty electronic boards, diagnosing failures and fixing weak points — extending the device's lifespan and reducing the cost of original replacement parts.",
        serviceCncTitle: "CNC Machining",
        serviceCncDesc: "We provide precision CNC machining services to produce metal and plastic parts with exact dimensions and fine detail, suited to medical device spare parts and industrial prototypes.",
        service3dTitle: "3D Scanning, Designing & Printing",
        service3dDesc: "A complete service that starts with 3D scanning the original part, followed by precise engineering redesign, and ends with high-precision printing using the latest 3D printing technologies.",
        readMore: "Read More",
        reverseTitle: "Reverse Engineering for Medical Devices",
        reverseDesc: "We provide reverse engineering services for medical devices to understand, design, and develop devices with high accuracy, through a specialized team with strong experience in analyzing complex medical systems. We work on analyzing and examining device components and performance with high precision using the latest measurement tools and 3D scanning.",
        readMore2: "Read More",
        projectsTitle: "Our Projects",
        projectsDesc: "Examples of our completed work in reverse engineering, manufacturing, and 3D printing",
        project1Tag: "Reverse Engineering",
        project1Title: "Reverse-Engineered X-Ray Machine Spare Part",
        project1Desc: "3D scanning and redesign of an original spare part for a medical X-ray machine that was no longer available on the market.",
        project2Tag: "3D Printing",
        project2Title: "3D Modeling of Ventilator Components",
        project2Desc: "Design and printing of precise plastic components for an industrial ventilator, matching the original specifications.",
        project3Tag: "Electronic Manufacturing",
        project3Title: "PCB Manufacturing for a Cardiac Monitor",
        project3Desc: "Design and manufacturing of a replacement PCB for a cardiac monitor, with full performance testing.",
        project4Tag: "Maintenance & Calibration",
        project4Title: "Blood Analysis Device Calibration",
        project4Desc: "Routine maintenance and calibration of a blood analysis device at a partner hospital, in line with international standards.",
        project5Tag: "3D Printing",
        project5Title: "Housing Printed for a Portable Medical Device",
        project5Desc: "Redesign and printing of a durable outer housing for a portable medical device after the original housing was damaged.",
        project6Tag: "Reverse Engineering",
        project6Title: "Control Unit Repair for a Medical Laser Device",
        project6Desc: "Analysis of the original circuit and repair of the electronic control unit for a faulty medical laser device.",
        clientsTitle: "Our Clients",
        clientsDesc: "We are proud of our partnership with leading medical and industrial institutions",
        info1Title: "Advanced Tools",
        info1Desc: "We use the latest tools and technologies to ensure service quality",
        info2Title: "Expert Team",
        info2Desc: "A team of engineers and technicians with extensive experience",
        info3Title: "Guaranteed Quality",
        info3Desc: "We adhere to the highest quality standards in all our services",
        info4Title: "Technical Support",
        info4Desc: "Premium customer service available 24/7",
        contactTitle: "Contact Us",
        contactDesc: "We are happy to communicate with you for any inquiry or service request",
        addressTitle: "Our Address",
        address: "Piece 9367, Hoda Shaarawi Street - Al-Mokatam - Cairo - Egypt",
        phoneTitle: "Our Phone",
        emailTitle: "Email",
        hoursTitle: "Working Hours",
        hours: "Saturday - Thursday: 9 AM - 5 PM",
        sendMessage: "Send Message",
        nameLabel: "Name",
        emailLabel: "Email",
        messageLabel: "Message",
        sendButton: "Send",
        footerDesc: "Reverse Tech is a comprehensive source for all the needs of medical device companies, hospitals, and all workers in the field of medical devices and laser devices. We specialize in designing and manufacturing all medical device spare parts, including circuits, electronic boards, sensors, screens, and all plastic and metal parts.",
        quickLinks: "Quick Links",
        ourServices: "Our Services",
        subscribeTitle: "Subscribe to Newsletter",
        subscribeDesc: "Subscribe to receive our latest news and offers",
        emailPlaceholder: "Your Email"
    };
    
    // وظيفة تغيير اللغة
    function toggleLanguage() {
        isEnglish = !isEnglish;
        
        // تغيير اتجاه الصفحة
        document.body.classList.toggle('english', isEnglish);
        document.documentElement.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');
        document.documentElement.setAttribute('lang', isEnglish ? 'en' : 'ar');
        
        // تغيير نص زر التبديل
        languageToggle.querySelector('span').textContent = isEnglish ? 'العربية' : 'English';
        
        // تطبيق النصوص المناسبة
        const texts = isEnglish ? englishTexts : arabicTexts;
        
        // تحديث جميع العناصر التي تحتوي على بيانات النص
        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.getAttribute('data-key');
            if (texts[key]) {
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', texts[key]);
                } else {
                    element.textContent = texts[key];
                }
            }
        });
    }
    
    // إضافة حدث النقر على زر التبديل
    languageToggle.addEventListener('click', toggleLanguage);

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
            dot.addEventListener('click', function() {
                showVideoSlide(i);
                startVideoSlider();
            });
        });
    }

    // زرار "اطلب خدمة" - ينقل المستخدم لفورم التواصل مباشرة
    const requestServiceBtn = document.querySelector('.request-service-btn');
    if (requestServiceBtn) {
        requestServiceBtn.addEventListener('click', function() {
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
                const nameInput = document.getElementById('name');
                if (nameInput) {
                    setTimeout(() => nameInput.focus(), 600);
                }
            }
        });
    }
});
