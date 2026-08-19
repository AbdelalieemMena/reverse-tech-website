let token = localStorage.getItem('rt_token') || '';
const qs = (s) => document.querySelector(s);
const auth = () => ({ Authorization: 'Bearer ' + token });
const pricingCache = {};
const PRICING_CLIENT_DEFAULTS = {
  printing: {
    setupFeeEGP: 50,
    minimumOrderEGP: 100,
    materialPricePerUnit: { PLA: 80, ABS: 95, PETG: 100, Resin: 140, Nylon: 160 },
    finishingMultiplier: { Standard: 1, Sanding: 1.15, Painting: 1.35 },
    thicknessMultiplier: { 1: 1, 2: 1.15, 3: 1.3, 5: 1.5 },
    quantityDiscountTiers: [
      { minQty: 1, discountPercent: 0 },
      { minQty: 5, discountPercent: 5 },
      { minQty: 10, discountPercent: 10 },
      { minQty: 25, discountPercent: 15 }
    ]
  },
  stencil: {
    setupFeeEGP: 120,
    minimumOrderEGP: 250,
    pricePerCm2: 0.35,
    standardBasePriceEGP: 180,
    thicknessMultiplier: { "0.1": 1, "0.12": 1.05, "0.15": 1.12, "0.2": 1.2 },
    quantityDiscountTiers: [
      { minQty: 1, discountPercent: 0 },
      { minQty: 5, discountPercent: 5 },
      { minQty: 10, discountPercent: 10 },
      { minQty: 25, discountPercent: 15 }
    ]
  },
  mechanical: {
    setupFeeEGP: 0,
    minimumOrderEGP: 0,
    rushSurchargePercent: 25,
    quantityDiscountTiers: [
      { minQty: 1, discountPercent: 0 },
      { minQty: 10, discountPercent: 5 },
      { minQty: 50, discountPercent: 10 }
    ]
  }
};


function showToast(message, type = 'info', duration = 3500) {
  const container = qs('#toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const iconClass = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info';
  toast.className = `admin-toast admin-toast-${type}`;
  toast.innerHTML = `<i class="fas ${iconClass}"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showDash() {
  qs('#login').style.display = 'none';
  qs('#dash').style.display = 'block';
  qs('#dash').classList.add('visible');
  loadParts().catch(showAdminError);
}

async function verifyAndShowDash() {
  if (!token) return;
  try {
    const r = await fetch('/api/verify-auth', { headers: auth() });
    if (r.ok) {
      showDash();
    } else {
      localStorage.removeItem('rt_token');
      token = '';
    }
  } catch (err) {
    console.warn('تعذر التحقق من التوكين أوفلاين:', err);
    showDash();
  }
}
verifyAndShowDash();

qs('#loginForm').onsubmit = async (e) => {
  e.preventDefault();
  const msgEl = qs('#loginMsg');
  const btn = e.target.querySelector('button[type="submit"]');
  const originalHtml = btn.innerHTML;
  
  msgEl.textContent = '';
  msgEl.classList.remove('visible');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';

  try {
    const r = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: qs('#username').value, password: qs('#password').value })
    });
    const d = await r.json();
    if (!r.ok) {
      msgEl.textContent = d.error || 'اسم المستخدم أو كلمة المرور غير صحيحة';
      msgEl.classList.add('visible');
      return;
    }
    token = d.token;
    localStorage.setItem('rt_token', token);
    showDash();
    showToast('تم تسجيل الدخول بنجاح! مرحبًا بك في لوحة التحكم', 'success');
  } catch (err) {
    msgEl.textContent = 'حدث خطأ في الاتصال بالخادم: ' + err.message;
    msgEl.classList.add('visible');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
};
qs('#logout').onclick = () => {
  localStorage.removeItem('rt_token');
  showToast('تم تسجيل الخروج بنجاح', 'info');
  setTimeout(() => location.reload(), 500);
};

const TAB_TITLES = {
  parts: 'القطع الميكانيكية والمنتجات',
  projects: 'معرض المشاريع والأعمال',
  serviceImages: 'وسائط وسلايدر الخدمات',
  pricing: 'إعدادات الأسعار للحاسبة',
  pcbOrders: 'طلبات تصنيع الـ PCB',
  printOrders: 'طلبات الطباعة 3D',
  mechanicalOrders: 'طلبات القطع الميكانيكية',
  stencilOrders: 'طلبات SMT Stencil',
  graduationSupport: 'طلبات دعم مشاريع التخرج',
  contactMessages: 'رسائل نموذج اتصل بنا'
};

const pageState = {
  projects: 1,
  parts: 1,
  'pcb-orders': 1,
  'printing-orders': 1,
  'mechanical-orders': 1,
  'stencil-orders': 1,
  'contact-messages': 1,
  'graduation-support/requests': 1
};
const PAGE_SIZE = 6;
const orderCache = {};

function renderPaginationHTML(totalItems, currentPage, pageSize) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return '';
  let html = '<div class="admin-pagination">';
  html += `<button class="admin-pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"><i class="fas fa-chevron-right"></i> السابق</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="admin-pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="admin-pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">التالي <i class="fas fa-chevron-left"></i></button>`;
  html += '</div>';
  return html;
}

document.querySelectorAll('.admin-tab-btn').forEach((b) => b.onclick = () => {
  document.querySelectorAll('.admin-tab-btn,.admin-tab-panel').forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  const panel = qs('#' + b.dataset.tab);
  if (panel) panel.classList.add('active');
  const titleEl = qs('#currentTabTitle');
  if (titleEl && TAB_TITLES[b.dataset.tab]) {
    titleEl.innerHTML = `<i class="fas fa-gears"></i> ${TAB_TITLES[b.dataset.tab]}`;
  }
  if (b.dataset.tab === 'serviceImages') loadServiceImages().catch(e=>showToast(e.message, 'error'));
  if (b.dataset.tab === 'projects') loadProjects().catch(showProjectError);
  if (b.dataset.tab === 'pricing') loadAllPricing().catch(e=>pricingMsg(e.message,'error'));
  if (b.dataset.tab === 'parts') loadParts().catch(showAdminError);
  if (b.dataset.tab === 'printOrders') loadOrders('printing-orders', 'printList');
  if (b.dataset.tab === 'mechanicalOrders') loadOrders('mechanical-orders', 'mechanicalOrdersList');
  if (b.dataset.tab === 'stencilOrders') loadOrders('stencil-orders', 'stencilList');
  if (b.dataset.tab === 'graduationSupport') loadGraduationSupportAdmin().catch(showAdminError);
  if (b.dataset.tab === 'pcbOrders') loadOrders('pcb-orders', 'pcbList');
  if (b.dataset.tab === 'contactMessages') loadOrders('contact-messages', 'contactMessagesList');
});

async function api(url, opt = {}) {
  opt.headers = { ...(opt.headers || {}), ...auth() };
  const r = await fetch(url, opt);
  if (r.status === 401) {
    localStorage.removeItem('rt_token');
    showToast('انتهت الجلسة، برجاء تسجيل الدخول مرة أخرى', 'error');
    setTimeout(() => location.reload(), 1200);
    throw Error('الجلسة انتهت');
  }
  const text = await r.text();
  let d;
  try { d = text ? JSON.parse(text) : {}; }
  catch (_) { throw Error(`الخادم أعاد استجابة غير صحيحة (${r.status}). تأكد من تشغيل الخادم بشكل صحيح.`); }
  if (!r.ok) throw Error(d.error || 'حدث خطأ في الخادم');
  return d;
}

function escapeHtml(value) { const d = document.createElement('div'); d.textContent = value || ''; return d.innerHTML; }

// ===== Projects =====
async function uploadProjectImage() {
  const file = qs('#projectImageFile').files[0];
  if (!file) return qs('#projectImageUrl').value.trim();
  const fd = new FormData(); fd.append('project_image', file);
  return (await api('/api/upload-project-image', { method: 'POST', body: fd })).url;
}
async function loadProjects() {
  const r = await fetch('/api/projects', { cache: 'no-store' });
  if (!r.ok) throw Error('تعذر تحميل المشاريع');
  const items = await r.json();
  window.projectCache = Array.isArray(items) ? items : [];
  renderProjectsPage(pageState.projects || 1);
}

function renderProjectsPage(page) {
  pageState.projects = page;
  const items = window.projectCache || [];
  const container = qs('#projectsList');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<div class="admin-empty-state">لا توجد مشاريع حاليًا.</div>';
    return;
  }
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);
  const cardsHtml = pageItems.map((p) => `
    <div class="admin-project-card">
      <img src="${escapeHtml(p.image || '/media/public/project1.png')}" alt="">
      <div><span class="project-tag">${escapeHtml(p.tag_ar)}</span><h3>${escapeHtml(p.title_ar)}</h3><p>${escapeHtml(p.desc_ar || '')}</p></div>
      <div><button class="admin-btn admin-btn-secondary" onclick="editProjectById('${p.id}')">تعديل</button><button class="admin-btn admin-btn-danger" onclick="deleteProject('${p.id}')">حذف</button></div>
    </div>`).join('');
  const pagHtml = renderPaginationHTML(items.length, page, PAGE_SIZE);
  container.innerHTML = cardsHtml + pagHtml;
  container.querySelectorAll('.admin-pagination-btn').forEach(btn => {
    btn.onclick = () => {
      const p = Number(btn.dataset.page);
      if (p) renderProjectsPage(p);
    };
  });
}
function showProjectError(err) { console.error(err); qs('#projectsList').innerHTML = '<div class="admin-empty-state">تعذر تحميل المشاريع. تأكد من تشغيل السيرفر وربط قاعدة البيانات.</div>'; }
window.editProjectById = (id) => { const p = (window.projectCache || []).find(x => String(x.id) === String(id)); if (!p) return;
  qs('#projectId').value = p.id; qs('#projectTitleAr').value = p.title_ar || ''; qs('#projectTitleEn').value = p.title_en || '';
  qs('#projectTagAr').value = p.tag_ar || ''; qs('#projectTagEn').value = p.tag_en || ''; qs('#projectDescAr').value = p.desc_ar || '';
  qs('#projectDescEn').value = p.desc_en || ''; qs('#projectImageUrl').value = p.image || ''; window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('تم تحميل بيانات المشروع للتعديل', 'info');
};
qs('#cancelProjectEdit').onclick = () => { qs('#projectForm').reset(); qs('#projectId').value = ''; };
qs('#projectForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ حفظ المشروع...';
  try {
    const id = qs('#projectId').value;
    const image = await uploadProjectImage();
    if (!image) { showToast('يرجى اختيار صورة للمشروع أو إدخال رابط الصورة', 'error'); return; }
    const body = {
      image,
      tag_ar: qs('#projectTagAr').value,
      tag_en: qs('#projectTagEn').value,
      title_ar: qs('#projectTitleAr').value,
      title_en: qs('#projectTitleEn').value,
      desc_ar: qs('#projectDescAr').value,
      desc_en: qs('#projectDescEn').value
    };
    await api('/api/projects' + (id ? '/' + id : ''), {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    e.target.reset();
    qs('#projectId').value = '';
    qs('#projectImageFile').value = '';
    await loadProjects();
    showToast(id ? 'تم تعديل المشروع بنجاح! ✓' : 'تم إضافة المشروع بنجاح! ✓', 'success');
  } catch (err) {
    showToast('فشل حفظ المشروع: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
};
window.deleteProject = async (id) => {
  if (confirm('هل أنت تأكد من حذف هذا المشروع؟')) {
    try {
      await api('/api/projects/' + id, { method: 'DELETE' });
      await loadProjects();
      showToast('تم حذف المشروع بنجاح', 'success');
    } catch (err) {
      showToast('تعذر حذف المشروع: ' + err.message, 'error');
    }
  }
};

// ===== Mechanical Parts =====
async function uploadPartImage() {
  const f = qs('#imageFile').files[0]; if (!f) return qs('#imageUrl').value.trim();
  const fd = new FormData(); fd.append('part_image', f);
  return (await api('/api/upload-part-image', { method: 'POST', body: fd })).url;
}
function showAdminError(err) { console.error(err); const box = qs('#partsList'); if (box) box.innerHTML = '<div class="admin-empty-state">تعذر الاتصال بقاعدة البيانات. تأكد من تشغيل السيرفر.</div>'; }
async function loadParts() {
  const r = await fetch('/api/mechanical-parts'); if (!r.ok) throw Error('تعذر تحميل القطع'); const a = await r.json();
  window.partsCache = Array.isArray(a) ? a : [];
  renderPartsPage(pageState.parts || 1);
}

function renderPartsPage(page) {
  pageState.parts = page;
  const items = window.partsCache || [];
  const container = qs('#partsList');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<div class="admin-empty-state">لا توجد قطع ميكانيكية حتى الآن.</div>';
    return;
  }
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);
  const cardsHtml = pageItems.map((p) => `<div class="admin-project-card"><img src="${escapeHtml(p.image || '/media/public/cnc-machining.png')}"><div><h3>${escapeHtml(p.title_ar)}</h3><p>${escapeHtml(p.description_ar || '')}</p><b>${Number(p.price || 0).toLocaleString()} جنيه</b></div><div><button class="admin-btn admin-btn-secondary" onclick="editPartById('${p.id}')">تعديل</button><button class="admin-btn admin-btn-danger" onclick="delPart('${p.id}')">حذف</button></div></div>`).join('');
  const pagHtml = renderPaginationHTML(items.length, page, PAGE_SIZE);
  container.innerHTML = cardsHtml + pagHtml;
  container.querySelectorAll('.admin-pagination-btn').forEach(btn => {
    btn.onclick = () => {
      const p = Number(btn.dataset.page);
      if (p) renderPartsPage(p);
    };
  });
}

window.editPartById = (id) => {
  const p = (window.partsCache || []).find(x => String(x.id) === String(id));
  if (!p) return;
  qs('#partId').value=p.id; qs('#titleAr').value=p.title_ar; qs('#titleEn').value=p.title_en;
  qs('#descAr').value=p.description_ar||''; qs('#descEn').value=p.description_en||'';
  qs('#price').value=p.price||0; qs('#time').value=p.manufacturing_time||''; qs('#imageUrl').value=p.image||'';
  scrollTo({ top: 0, behavior: 'smooth' });
  showToast('تم تحميل بيانات القطعة للتعديل', 'info');
};
qs('#cancelEdit').onclick = () => { qs('#partForm').reset(); qs('#partId').value=''; };
qs('#partForm').onsubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ حفظ القطعة...';
  try {
    const id = qs('#partId').value;
    const body = {
      title_ar: qs('#titleAr').value,
      title_en: qs('#titleEn').value,
      description_ar: qs('#descAr').value,
      description_en: qs('#descEn').value,
      price: Number(qs('#price').value),
      manufacturing_time: qs('#time').value,
      image: await uploadPartImage()
    };
    await api('/api/mechanical-parts' + (id ? '/' + id : ''), {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    e.target.reset();
    qs('#partId').value = '';
    qs('#imageFile').value = '';
    await loadParts();
    showToast(id ? 'تم تعديل القطعة بنجاح! ✓' : 'تم إضافة القطعة بنجاح! ✓', 'success');
  } catch (err) {
    showToast('فشل حفظ القطعة: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
};
window.delPart = async (id) => {
  if(confirm('حذف القطعة؟')) {
    try {
      await api('/api/mechanical-parts/'+id, { method: 'DELETE' });
      await loadParts();
      showToast('تم حذف القطعة بنجاح', 'success');
    } catch (err) {
      showToast('تعذر حذف القطعة: ' + err.message, 'error');
    }
  }
};

function orderLabel(key){
 const labels={customer_name:'اسم العميل',customer_phone:'رقم الهاتف',phone:'رقم الهاتف',customer_email:'البريد الإلكتروني',email:'البريد الإلكتروني',quantity:'الكمية',status:'الحالة',created_at:'تاريخ الطلب',material:'الخامة',color:'اللون',finishing:'التشطيب',thickness:'السُمك',dimensions:'الأبعاد',layers:'عدد الطبقات',width_mm:'العرض (مم)',length_mm:'الطول (مم)',rush:'طلب عاجل',price:'السعر',part_title:'اسم القطعة',notes:'ملاحظات',company:'الشركة',service:'الخدمة المطلوبة',message:'الرسالة',subject:'الموضوع',gerber_original_name:'ملف Gerber',shipping_method:'طريقة الاستلام',shipping_country:'الدولة',shipping_address:'عنوان الشحن',shipping_recipient_name:'اسم المستلم',shipping_phone:'رقم موبايل المستلم',shipping_weight_kg:'الوزن التقريبي (كجم)',shipping_fee:'رسوم الشحن',project_name:'اسم المشروع',university_name:'اسم الجامعة',team_leader_name:'اسم قائد الفريق',team_leader_email:'البريد الإلكتروني لقائد الفريق',team_leader_phone:'هاتف قائد الفريق',supervisor_name:'اسم المشرف',supervisor_phone:'هاتف المشرف',team_members:'أعضاء الفريق',engineering_projects:'مشاريع هندسية سابقة',engineering_project_names:'أسماء المشاريع الهندسية',engineering_project_description:'وصف المشاريع الهندسية',sponsorship:'رعاية',sponsorship_source:'مصدر الرعاية'};
 return labels[key]||key.replaceAll('_',' ');
}
function orderValue(key,value){
 if(value===null||value===undefined||value==='') return '—';
 if(key==='created_at'){try{return new Date(value).toLocaleString('ar-EG')}catch(e){return value}}
 if(typeof value==='boolean') return value?'نعم':'لا';
 if(typeof value==='object') return `<details class="order-details"><summary>عرض التفاصيل</summary><pre>${escapeHtml(JSON.stringify(value,null,2))}</pre></details>`;
 return escapeHtml(String(value));
}
function orderStatusOptions(current){
 const statuses=['جديد','قيد المراجعة','قيد التنفيذ','تم التنفيذ','تم التواصل','منتهي','ملغي'];
 return statuses.map(s=>`<option value="${s}" ${s===current?'selected':''}>${s}</option>`).join('');
}
window.downloadGerberFile = async (id, fileName) => {
  try {
    showToast('جارٍ تجهيز وتحميل ملف الـ Gerber...', 'info');
    const r = await fetch(`/api/pcb-orders/${id}/gerber`, { headers: auth() });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw Error(err.error || 'الملف غير موجود');
    }
    const contentType = r.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const d = await r.json();
      if (d.url) {
        window.open(d.url, '_blank');
        return;
      }
    }
    const blob = await r.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'gerber.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showToast('تم تحميل الملف بنجاح!', 'success');
  } catch (err) {
    showToast('فشل تنزيل الملف: ' + err.message, 'error');
  }
};

function renderOrderCard(o,type){
 const ignored=new Set(['id','gerber_filename','file_url']);
 const preferred=['name','company','service','message','customer_name','customer_phone','phone','customer_email','email','part_title','layers','quantity','width_mm','length_mm','material','color','finishing','thickness','dimensions','price','rush','shipping_method','shipping_country','shipping_address','shipping_recipient_name','shipping_phone','shipping_weight_kg','shipping_fee','created_at','notes','quote'];
 const keys=[...preferred.filter(k=>k in o),...Object.keys(o).filter(k=>!preferred.includes(k)&&!ignored.has(k)&&k!=='status')];
 const icon=type==='pcb-orders'?'fa-microchip':type==='printing-orders'?'fa-cube':type==='mechanical-orders'?'fa-gears':type==='contact-messages'?'fa-envelope':'fa-layer-group';
 const title=o.customer_name||o.name||(type==='contact-messages'?'رسالة تواصل جديدة':'طلب جديد');
 const phone=o.customer_phone||o.phone||o.email||'';
 const gerberBtnHtml = (o.gerber_filename || o.gerber_original_name) ?
   `<div class="modern-order-field" style="grid-column: 1 / -1; border-top: 1px dashed #dce6ef;">
     <span>ملف Gerber المرفق</span>
     <strong>
       <button type="button" class="admin-gerber-dl-btn" onclick="downloadGerberFile('${escapeHtml(String(o.id))}', '${escapeHtml(o.gerber_original_name || 'gerber.zip')}')">
         <i class="fas fa-file-arrow-down"></i> تنزيل ملف Gerber
       </button>
       <button type="button" class="admin-gerber-view-btn" onclick="openGerberViewerModal('${escapeHtml(String(o.id))}', '${escapeHtml(o.gerber_original_name || 'gerber.zip')}')">
         <i class="fas fa-eye"></i> معاينة طبقات Gerber 👁️
       </button>
     </strong>
   </div>` : '';
 return `<article class="modern-order-card" data-order-id="${escapeHtml(String(o.id))}" data-order-type="${escapeHtml(type)}">
   <div class="modern-order-head"><div class="modern-order-icon"><i class="fas ${icon}"></i></div><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(phone)}</p></div><span class="order-status-badge">${escapeHtml(o.status||'جديد')}</span></div>
   <div class="modern-order-grid">${keys.map(k=>`<div class="modern-order-field"><span>${escapeHtml(orderLabel(k))}</span><strong>${orderValue(k,o[k])}</strong></div>`).join('')}${gerberBtnHtml}</div>
   <div class="order-admin-actions">
     <label>${type==='contact-messages'?'حالة الرسالة':'حالة الطلب'}<select class="order-status-select">${orderStatusOptions(o.status||'جديد')}</select></label>
     <button class="admin-btn admin-btn-primary order-save-status" type="button"><i class="fas fa-floppy-disk"></i> حفظ الحالة</button>
     <button class="admin-btn admin-btn-danger order-delete" type="button"><i class="fas fa-trash"></i> حذف الطلب</button>
   </div>
 </article>`;
}
function bindOrderActions(box){
 box.querySelectorAll('.order-save-status').forEach(btn=>btn.onclick=async()=>{
   const card=btn.closest('.modern-order-card'),type=card.dataset.orderType,id=card.dataset.orderId,status=card.querySelector('.order-status-select').value;
   btn.disabled=true;
   try{
     await api(`/api/${type}/${encodeURIComponent(id)}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
     card.querySelector('.order-status-badge').textContent=status;
     btn.innerHTML='<i class="fas fa-check"></i> تم الحفظ';
     showToast(`تم تحديث حالة الطلب إلى "${status}" بنجاح`, 'success');
     setTimeout(()=>btn.innerHTML='<i class="fas fa-floppy-disk"></i> حفظ الحالة',1500);
   }catch(e){
     showToast('تعذر حفظ حالة الطلب: ' + e.message, 'error');
   }finally{btn.disabled=false}
 });
 box.querySelectorAll('.order-delete').forEach(btn=>btn.onclick=async()=>{
   if(!confirm('هل تريد حذف هذا العنصر نهائيًا؟'))return;
   const card=btn.closest('.modern-order-card'),type=card.dataset.orderType,id=card.dataset.orderId;
   btn.disabled=true;
   try{
     await api(`/api/${type}/${encodeURIComponent(id)}`,{method:'DELETE'});
     card.remove();
     showToast('تم حذف العنصر نهائيًا', 'success');
     if(!box.querySelector('.modern-order-card'))box.innerHTML='<div class="orders-empty"><i class="fas fa-inbox"></i><h3>لا توجد طلبات حتى الآن</h3></div>';
   }catch(e){
     showToast('تعذر حذف العنصر: ' + e.message, 'error');
     btn.disabled=false;
   }
 });
}
async function loadOrders(type,target) {
 const box=qs('#'+target);
 box.innerHTML='<div class="orders-loading"><i class="fas fa-spinner fa-spin"></i> جاري تحميل الطلبات...</div>';
 try{
   const a=await api('/api/'+type);
   box.innerHTML=a.length?a.map(o=>renderOrderCard(o,type)).join(''):'<div class="orders-empty"><i class="fas fa-inbox"></i><h3>لا توجد طلبات حتى الآن</h3><p>ستظهر الطلبات الجديدة هنا تلقائيًا.</p></div>'; bindOrderActions(box);
 }catch(e){box.innerHTML=`<div class="orders-empty error"><i class="fas fa-triangle-exclamation"></i><h3>تعذر تحميل الطلبات</h3><p>${escapeHtml(e.message||'حدث خطأ غير متوقع')}</p></div>`}
};
async function loadGraduationSupportAdmin(){
  await loadGraduationSupportConfig();
  await loadOrders('graduation-support/requests','graduationRequestsList');
}
async function loadGraduationSupportConfig(){
  const config = await api('/api/graduation-support/status');
  qs('#graduationStartDate').value = config.config.start_date || '';
  qs('#graduationEndDate').value = config.config.end_date || '';
  qs('#closedMessageAr').value = config.config.closed_message_ar || '';
  qs('#closedMessageEn').value = config.config.closed_message_en || '';
}
qs('#graduationSupportConfigForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  if(btn){btn.disabled=true;btn.textContent='جاري الحفظ...';}
  try{
    await api('/api/graduation-support/config',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      start_date: qs('#graduationStartDate').value,
      end_date: qs('#graduationEndDate').value,
      closed_message_ar: qs('#closedMessageAr').value,
      closed_message_en: qs('#closedMessageEn').value,
    })});
    if(btn){btn.textContent='تم الحفظ';}
    showToast('تم حفظ إعدادات دعم مشاريع التخرج بنجاح! ✓', 'success');
    setTimeout(()=>{if(btn){btn.textContent='حفظ الإعدادات';btn.disabled=false;}},1500);
  }catch(err){
    showToast('فشل حفظ الإعدادات: ' + err.message, 'error');
    if(btn){btn.disabled=false;btn.textContent='حفظ الإعدادات';}
  }
});
function num(id){return Number(qs('#'+id).value||0)}
function setv(id,v){const el=qs('#'+id);if(el)el.value=v??''}
function mapRowHtml(key='',value=0,keyPlaceholder='الاسم',valueLabel='القيمة'){
  return `<div class="map-row"><div><label>الاسم / النوع</label><input class="map-key" type="text" placeholder="${escapeHtml(keyPlaceholder)}" value="${escapeHtml(key)}"></div><div><label>${escapeHtml(valueLabel)}</label><input class="map-value" type="number" min="0" step="0.01" value="${Number(value||0)}"></div><button type="button" class="map-remove" title="حذف"><i class="fas fa-trash"></i></button></div>`;
}
function bindMapRemove(){document.querySelectorAll('.map-remove').forEach(b=>b.onclick=()=>b.closest('.map-row').remove())}
function renderMap(target,map,keyPlaceholder='الاسم',valueLabel='القيمة'){
  const box=qs('#'+target); box.innerHTML=Object.entries(map||{}).map(([k,v])=>mapRowHtml(k,v,keyPlaceholder,valueLabel)).join(''); bindMapRemove();
}
function readMap(target){
  const out={}; [...qs('#'+target).querySelectorAll('.map-row')].forEach(r=>{const k=r.querySelector('.map-key').value.trim(); if(k) out[k]=Number(r.querySelector('.map-value').value||0)}); return out;
}
document.querySelectorAll('.add-map-row').forEach(b=>b.onclick=()=>{const box=qs('#'+b.dataset.mapTarget);box.insertAdjacentHTML('beforeend',mapRowHtml('',0,b.dataset.keyPlaceholder||'الاسم',b.dataset.valueLabel||'القيمة'));bindMapRemove();const rows=box.querySelectorAll('.map-row');rows[rows.length-1]?.querySelector('.map-key')?.focus()});
function renderTiers(target,tiers=[]){qs('#'+target).innerHTML=tiers.map(t=>`<div class="tier-row"><div><label>أقل كمية</label><input class="tier-qty" type="number" min="1" value="${Number(t.minQty||1)}"></div><div><label>نسبة الخصم %</label><input class="tier-discount" type="number" min="0" max="100" step="0.1" value="${Number(t.discountPercent||0)}"></div><button type="button" class="tier-remove"><i class="fas fa-trash"></i></button></div>`).join('');bindTierRemove()}
function readTiers(target){return [...qs('#'+target).querySelectorAll('.tier-row')].map(r=>({minQty:Number(r.querySelector('.tier-qty').value||1),discountPercent:Number(r.querySelector('.tier-discount').value||0)})).sort((a,b)=>a.minQty-b.minQty)}
function bindTierRemove(){document.querySelectorAll('.tier-remove').forEach(b=>b.onclick=()=>b.closest('.tier-row').remove())}
document.querySelectorAll('.add-tier').forEach(b=>b.onclick=()=>{const box=qs('#'+b.dataset.tierTarget);box.insertAdjacentHTML('beforeend','<div class="tier-row"><div><label>أقل كمية</label><input class="tier-qty" type="number" min="1" value="1"></div><div><label>نسبة الخصم %</label><input class="tier-discount" type="number" min="0" max="100" step="0.1" value="0"></div><button type="button" class="tier-remove"><i class="fas fa-trash"></i></button></div>');bindTierRemove()});
document.querySelectorAll('.pricing-subtab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.pricing-subtab,.pricing-form-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');qs('#'+b.dataset.pricePanel).classList.add('active')});
function pricingMsg(text,type='success'){const m=qs('#pricingMessage');m.textContent=text;m.className='pricing-message show '+type;m.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>m.className='pricing-message',4500)}
async function loadAllPricing(){
  const pcb=await api('/api/pcb-pricing');pricingCache.pcb=pcb;setv('pcbLayer1',pcb.pricePerCm2ByLayers?.['1']);setv('pcbLayer2',pcb.pricePerCm2ByLayers?.['2']);setv('pcbLayer4',pcb.pricePerCm2ByLayers?.['4']);setv('pcbLayer6',pcb.pricePerCm2ByLayers?.['6']);setv('pcbSetup',pcb.setupFeeEGP);setv('pcbMinimum',pcb.minimumOrderEGP);setv('pcbThickness',pcb.standardThicknessMm);setv('pcbThicknessFee',pcb.thicknessSurchargeEGP);setv('pcbColorFee',pcb.colorSurchargePercent);setv('pcbRush',pcb.rushSurchargePercent);setv('pcbCode',pcb.discountCode?.code);setv('pcbCodePercent',pcb.discountCode?.discountPercent);qs('#pcbCodeActive').checked=!!pcb.discountCode?.active;renderTiers('pcbTiers',pcb.quantityDiscountTiers);
  for(const service of ['printing','stencil','mechanical']){try{pricingCache[service]=await api('/api/service-pricing/'+service)}catch(e){pricingCache[service]=structuredClone(PRICING_CLIENT_DEFAULTS[service]);pricingMsg('تعذر تحميل أسعار '+service+' من Supabase؛ تم عرض قيم افتراضية ويمكنك تعديلها بعد ربط قاعدة البيانات','error')}}
  const pr=pricingCache.printing;setv('printSetup',pr.setupFeeEGP);setv('printMinimum',pr.minimumOrderEGP);renderMap('materialPrices',pr.materialPricePerUnit,'اسم الخامة','سعر الوحدة (جنيه)');renderMap('finishingPrices',pr.finishingMultiplier,'نوع التشطيب','المعامل');renderMap('printingThickness',pr.thicknessMultiplier||{'1':1},'السُمك بالملليمتر','المعامل');renderTiers('printTiers',pr.quantityDiscountTiers);
  const st=pricingCache.stencil;setv('stencilBase',st.standardBasePriceEGP);setv('stencilArea',st.pricePerCm2);setv('stencilSetup',st.setupFeeEGP);setv('stencilMinimum',st.minimumOrderEGP);renderMap('stencilThickness',st.thicknessMultiplier,'السُمك بالملليمتر','المعامل');renderTiers('stencilTiers',st.quantityDiscountTiers);
  const me=pricingCache.mechanical;setv('mechSetup',me.setupFeeEGP);setv('mechMinimum',me.minimumOrderEGP);setv('mechRush',me.rushSurchargePercent);renderTiers('mechTiers',me.quantityDiscountTiers);
}
async function runPricingSubmit(formId, apiPath, getBody, successMsg, cacheKey) {
  const form = qs('#' + formId);
  if (!form) return;
  form.onsubmit = async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ حفظ التغييرات...';
    try {
      const body = getBody();
      await api(apiPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      pricingCache[cacheKey] = body;
      pricingMsg(successMsg, 'success');
      btn.innerHTML = '<i class="fas fa-check-circle"></i> تم الحفظ بنجاح! ✓';
      btn.style.backgroundColor = '#28a745';
      btn.style.borderColor = '#28a745';
    } catch (err) {
      console.error(err);
      pricingMsg('تعذر حفظ الإعدادات: ' + err.message, 'error');
      btn.innerHTML = '<i class="fas fa-times-circle"></i> فشل الحفظ';
      btn.style.backgroundColor = '#dc3545';
      btn.style.borderColor = '#dc3545';
    } finally {
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
      }, 3000);
    }
  };
}

runPricingSubmit('pcbPricing', '/api/pcb-pricing', () => {
  const old = pricingCache.pcb || {};
  return {
    ...old,
    pricePerCm2ByLayers: {
      '1': num('pcbLayer1'),
      '2': num('pcbLayer2'),
      '4': num('pcbLayer4'),
      '6': num('pcbLayer6')
    },
    setupFeeEGP: num('pcbSetup'),
    minimumOrderEGP: num('pcbMinimum'),
    standardThicknessMm: num('pcbThickness'),
    thicknessSurchargeEGP: num('pcbThicknessFee'),
    colorSurchargePercent: num('pcbColorFee'),
    rushSurchargePercent: num('pcbRush'),
    quantityDiscountTiers: readTiers('pcbTiers'),
    discountCode: {
      code: qs('#pcbCode').value.trim(),
      discountPercent: num('pcbCodePercent'),
      active: qs('#pcbCodeActive').checked
    }
  };
}, 'تم حفظ أسعار PCB وتحديث حاسبة التسعير بنجاح! ✓', 'pcb');

runPricingSubmit('printingPricing', '/api/service-pricing/printing', () => ({
  ...pricingCache.printing,
  setupFeeEGP: num('printSetup'),
  minimumOrderEGP: num('printMinimum'),
  materialPricePerUnit: readMap('materialPrices'),
  finishingMultiplier: readMap('finishingPrices'),
  thicknessMultiplier: readMap('printingThickness'),
  quantityDiscountTiers: readTiers('printTiers')
}), 'تم حفظ أسعار 3D Printing وتحديث الحاسبة بنجاح! ✓', 'printing');

runPricingSubmit('stencilPricing', '/api/service-pricing/stencil', () => ({
  ...pricingCache.stencil,
  standardBasePriceEGP: num('stencilBase'),
  pricePerCm2: num('stencilArea'),
  setupFeeEGP: num('stencilSetup'),
  minimumOrderEGP: num('stencilMinimum'),
  thicknessMultiplier: readMap('stencilThickness'),
  quantityDiscountTiers: readTiers('stencilTiers')
}), 'تم حفظ أسعار SMT Stencil وتحديث الحاسبة بنجاح! ✓', 'stencil');

runPricingSubmit('mechanicalPricing', '/api/service-pricing/mechanical', () => ({
  ...pricingCache.mechanical,
  setupFeeEGP: num('mechSetup'),
  minimumOrderEGP: num('mechMinimum'),
  rushSurchargePercent: num('mechRush'),
  quantityDiscountTiers: readTiers('mechTiers')
}), 'تم حفظ أسعار القطع الميكانيكية وتحديث الحاسبة بنجاح! ✓', 'mechanical');



// ===== Service slider media (images + videos) =====
const SERVICE_NAMES={pcb:'تصميم وتصنيع وتجميع PCB',maintenance:'صيانة اللوحات الإلكترونية',cnc:'خدمات التشغيل بالـ CNC',printing3d:'الطباعة ثلاثية الأبعاد',reverse:'الهندسة العكسية للأجهزة الطبية'};
let serviceImagesCache={};
function mediaType(item){if(typeof item==='object'&&item?.type)return item.type;const u=typeof item==='string'?item:item?.url;return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(u||'')?'video':'image'}
function mediaUrl(item){return typeof item==='string'?item:(item?.url||item?.image_url||'')}
function previewHtml(item){const url=escapeHtml(mediaUrl(item)),type=mediaType(item);return type==='video'?`<video src="${url}" muted playsinline controls preload="metadata"></video>`:`<img src="${url}" alt="">`}
async function loadServiceImages(){const r=await fetch('/api/service-images',{cache:'no-store'});serviceImagesCache=await r.json();renderServiceImages()}
function renderServiceImages(){const box=qs('#serviceImagesEditor');box.innerHTML=Object.entries(SERVICE_NAMES).map(([key,name])=>`<div class="service-image-admin-card" data-key="${key}"><h3>${name}</h3><div class="service-image-list">${(serviceImagesCache[key]||[]).map(item=>`<div class="service-image-item" data-type="${mediaType(item)}">${previewHtml(item)}<input class="service-image-url" value="${escapeHtml(mediaUrl(item))}"><select class="service-media-type"><option value="image" ${mediaType(item)==='image'?'selected':''}>صورة</option><option value="video" ${mediaType(item)==='video'?'selected':''}>فيديو</option></select><button type="button" class="admin-btn admin-btn-danger service-image-remove">حذف</button></div>`).join('')}</div><div class="service-upload-row"><input type="file" accept="image/*,video/mp4,video/webm,video/ogg" class="service-image-file"><input type="url" class="service-new-url" placeholder="أو رابط صورة / فيديو"><select class="service-new-type"><option value="image">صورة</option><option value="video">فيديو</option></select><button type="button" class="admin-btn admin-btn-secondary service-image-add">إضافة ملف</button><button type="button" class="admin-btn admin-btn-primary service-images-save">حفظ وسائط الخدمة</button></div><small class="service-media-help">الفيديو يعمل تلقائيًا بدون صوت داخل السلايدر. يفضّل MP4 وحجمًا أقل من 25 MB.</small></div>`).join('');
 bindServiceMediaActions(box);
}
function bindServiceMediaActions(scope){
 scope.querySelectorAll('.service-image-remove').forEach(b=>b.onclick=()=>b.closest('.service-image-item').remove());
 scope.querySelectorAll('.service-image-add').forEach(b=>b.onclick=async()=>{const card=b.closest('.service-image-admin-card'),file=card.querySelector('.service-image-file').files[0];let url=card.querySelector('.service-new-url').value.trim(),type=card.querySelector('.service-new-type').value;if(file){const fd=new FormData();fd.append('service_media',file);const uploaded=await api('/api/upload-service-media',{method:'POST',body:fd});url=uploaded.url;type=uploaded.type}if(!url)return alert('اختر صورة أو فيديو أو ضع رابطًا');const item={url,type};card.querySelector('.service-image-list').insertAdjacentHTML('beforeend',`<div class="service-image-item" data-type="${type}">${previewHtml(item)}<input class="service-image-url" value="${escapeHtml(url)}"><select class="service-media-type"><option value="image" ${type==='image'?'selected':''}>صورة</option><option value="video" ${type==='video'?'selected':''}>فيديو</option></select><button type="button" class="admin-btn admin-btn-danger service-image-remove">حذف</button></div>`);bindServiceMediaActions(card);card.querySelector('.service-image-file').value='';card.querySelector('.service-new-url').value=''});
 scope.querySelectorAll('.service-images-save').forEach(b=>b.onclick=async()=>{const card=b.closest('.service-image-admin-card'),key=card.dataset.key,media=[...card.querySelectorAll('.service-image-item')].map(row=>({url:row.querySelector('.service-image-url').value.trim(),type:row.querySelector('.service-media-type').value})).filter(x=>x.url);const originalHtml=b.innerHTML;b.disabled=true;b.innerHTML='<i class="fas fa-spinner fa-spin"></i> جارٍ الحفظ...';try{await api('/api/service-images/'+key,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({media})});b.innerHTML='<i class="fas fa-check-circle"></i> تم الحفظ! ✓';b.style.backgroundColor='#28a745';b.style.borderColor='#28a745'}catch(e){alert(e.message);b.innerHTML='<i class="fas fa-times-circle"></i> فشل الحفظ'}finally{setTimeout(()=>{b.disabled=false;b.innerHTML=originalHtml;b.style.backgroundColor='';b.style.borderColor=''},3000)}});
}
