require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_MEDIA_STORE_PATH = path.join(__dirname, 'data', 'service-media.json');
const GRADUATION_SUPPORT_STORE_PATH = path.join(__dirname, 'data', 'graduation-support.json');
const JWT_SECRET =
  process.env.JWT_SECRET || 'reverse-tech-please-change-this-secret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'reversetech_admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'reversetech.2024';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.warn(
    'تحذير: متغيرات Supabase غير موجودة. أضف SUPABASE_URL و SUPABASE_SECRET_KEY في إعدادات الاستضافة.',
  );
}

const supabase =
  SUPABASE_URL && SUPABASE_SECRET_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
        auth: { persistSession: false },
      })
    : null;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      if (path.extname(filePath) === '.html')
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    },
  }),
);

function requireDb(req, res, next) {
  if (!supabase)
    return res
      .status(503)
      .json({ error: 'Supabase غير متصل. راجع متغيرات البيئة في الاستضافة.' });
  next();
}

function readJsonStore(storePath) {
  try {
    const text = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error && error.code !== 'ENOENT') console.error(`${path.basename(storePath)} read error:`, error.message);
    return {};
  }
}

function writeJsonStore(storePath, data) {
  try {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`${path.basename(storePath)} write error:`, error.message);
  }
}

function readServiceMediaStore() {
  return readJsonStore(SERVICE_MEDIA_STORE_PATH);
}

function writeServiceMediaStore(data) {
  writeJsonStore(SERVICE_MEDIA_STORE_PATH, data);
}

function readGraduationSupportStore() {
  return readJsonStore(GRADUATION_SUPPORT_STORE_PATH);
}

function writeGraduationSupportStore(data) {
  writeJsonStore(GRADUATION_SUPPORT_STORE_PATH, data);
}

function mergeServiceMediaData(store, fallback) {
  const out = JSON.parse(JSON.stringify(fallback || DEFAULT_SERVICE_MEDIA));
  if (!store || typeof store !== 'object') return out;
  Object.keys(out).forEach((key) => {
    if (Array.isArray(store[key])) {
      const media = store[key]
        .map((item) => normalizeServiceMediaItem(item))
        .filter(Boolean);
      if (media.length) out[key] = media;
    }
  });
  return out;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'لازم تسجل الدخول الأول' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'الجلسة انتهت، سجل الدخول تاني' });
  }
}

function generateId() {
  return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}
function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
function dbError(res, error, fallback = 'حصل خطأ في قاعدة البيانات') {
  console.error(error);
  return res.status(500).json({ error: error?.message || fallback });
}

function sanitizeInput(value) {
  return String(value || '').trim();
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(String(email || '').trim());
}

async function getPricing() {
  const fallback = require('./data/pcb-pricing.json');
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase
      .from('pcb_pricing')
      .select('config')
      .eq('id', 1)
      .single();
    if (error) {
      if (String(error.message || '').includes('pcb_pricing')) {
        return fallback;
      }
      throw error;
    }
    return { ...fallback, ...(data?.config || {}) };
  } catch (err) {
    console.warn('Supabase getPricing error, using fallback:', err.message);
    return fallback;
  }
}


function calculatePcbPrice(input, cfg) {
  const widthMm = Math.max(1, Number(input.width_mm) || 0);
  const lengthMm = Math.max(1, Number(input.length_mm) || 0);
  const areaCm2 = (widthMm / 10) * (lengthMm / 10);
  const layerKey = String(input.layers);
  const ratePerCm2 =
    cfg.pricePerCm2ByLayers[layerKey] ?? cfg.pricePerCm2ByLayers['2'];
  let unitPrice = areaCm2 * ratePerCm2;
  if (input.color && input.color !== 'green')
    unitPrice *= 1 + cfg.colorSurchargePercent / 100;
  if (Number(input.thickness_mm) !== Number(cfg.standardThicknessMm))
    unitPrice += cfg.thicknessSurchargeEGP;
  const quantity = Math.max(1, Math.round(Number(input.quantity) || 1));
  const grossSubtotal = unitPrice * quantity + cfg.setupFeeEGP;
  const tier = [...cfg.quantityDiscountTiers]
    .sort((a, b) => b.minQty - a.minQty)
    .find((t) => quantity >= t.minQty) || { discountPercent: 0 };
  const afterTierDiscount = grossSubtotal * (1 - tier.discountPercent / 100);
  const rush = input.rush === true || input.rush === 'true';
  const rushFee = rush
    ? afterTierDiscount * (cfg.rushSurchargePercent / 100)
    : 0;
  const afterRush = afterTierDiscount + rushFee;
  const submittedCode = String(input.discount_code || '').trim();
  const codeApplied = Boolean(
    submittedCode &&
    cfg.discountCode?.active &&
    submittedCode.toUpperCase() ===
      String(cfg.discountCode.code || '').toUpperCase(),
  );
  const finalBeforeMin =
    afterRush * (codeApplied ? 1 - cfg.discountCode.discountPercent / 100 : 1);
  const shippingFee = calculateShippingFee(input);
  const productPrice = Math.round(
    Math.max(finalBeforeMin, cfg.minimumOrderEGP),
  );
  const finalPrice = productPrice + shippingFee;
  const priceBeforeDiscount = Math.round(grossSubtotal + rushFee + shippingFee);
  const discountValue = Math.max(0, priceBeforeDiscount - finalPrice);
  return {
    price_before_discount: priceBeforeDiscount,
    discount_value: discountValue,
    shipping_fee: shippingFee,
    product_price: productPrice,
    final_price: finalPrice,
    price_per_unit: Math.round(productPrice / quantity),
    quantity,
    currency: 'EGP',
    lead_time: rush
      ? cfg.estimatedLeadTime.rush
      : cfg.estimatedLeadTime.standard,
    discount_code_applied: codeApplied,
    tier_discount_percent: tier.discountPercent,
  };
}

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const isProjectImage = req.path.includes('upload-project-image');
    const isServiceMedia = req.path.includes('upload-service-media');
    if (isProjectImage)
      return file.mimetype.startsWith('image/')
        ? cb(null, true)
        : cb(new Error('اختار ملف صورة صحيح'));
    if (isServiceMedia)
      return (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/'))
        ? cb(null, true)
        : cb(new Error('اختار ملف صورة أو فيديو صحيح'));
    return ['.zip', '.rar'].includes(
      path.extname(file.originalname).toLowerCase(),
    )
      ? cb(null, true)
      : cb(new Error('الملفات المسموح بيها ZIP أو RAR بس'));
  },
});

// ===== Simple In-Memory Rate Limiter for Login =====
const loginAttempts = new Map();
function checkLoginRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 min
  const maxAttempts = 10;
  const record = loginAttempts.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }
  if (record.count >= maxAttempts) {
    const waitMins = Math.ceil((record.resetTime - now) / 60000);
    return `تم تجاوز عدد محاولات الدخول المسموح بها. حاول بعد ${waitMins} دقيقة.`;
  }
  record.count += 1;
  loginAttempts.set(ip, record);
  return null;
}

app.post('/api/login', (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const rateLimitError = checkLoginRateLimit(ip);
  if (rateLimitError) {
    return res.status(429).json({ error: rateLimitError });
  }

  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    if (loginAttempts.has(ip)) loginAttempts.delete(ip);
    return res.json({
      token: jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' }),
    });
  }
  res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
});

app.get('/api/verify-auth', requireAuth, (req, res) => {
  res.json({ valid: true });
});


app.get('/api/projects', async (req, res) => {
  const defaults = require('./data/default-projects.json');

  // الصفحة العامة لازم تفضل تعرض المشاريع حتى لو Supabase غير متصل
  // أو جدول projects لم يتم تشغيل SQL الخاص به بعد.
  if (!supabase) return res.json(defaults);

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error(
        'تعذر تحميل المشاريع من Supabase، تم استخدام المشاريع الافتراضية:',
        error,
      );
      return res.json(defaults);
    }

    return res.json(data && data.length ? data : defaults);
  } catch (error) {
    console.error(
      'تعذر تحميل المشاريع، تم استخدام المشاريع الافتراضية:',
      error,
    );
    return res.json(defaults);
  }
});

app.post(
  '/api/upload-project-image',
  requireDb,
  requireAuth,
  memoryUpload.single('project_image'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار ملف' });
    const filename = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const { error } = await supabase.storage
      .from('project-images')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (error) return dbError(res, error, 'تعذر رفع الصورة');
    const { data } = supabase.storage
      .from('project-images')
      .getPublicUrl(filename);
    res.json({ url: data.publicUrl });
  },
);


app.post(
  '/api/upload-service-media',
  requireAuth,
  memoryUpload.single('service_media'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'لم يتم اختيار ملف' });
    const type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    const filename = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const localDir = path.join(__dirname, 'media', 'uploads', 'service-media');
    const localPath = path.join(localDir, filename);
    try {
      fs.mkdirSync(localDir, { recursive: true });
      fs.writeFileSync(localPath, req.file.buffer);
    } catch (error) {
      console.error('فشل حفظ الملف المحلي:', error.message);
      return res.status(500).json({ error: 'تعذر حفظ الملف على الخادم' });
    }
    if (supabase) {
      try {
        const remoteFilename = `services/${filename}`;
        const { error } = await supabase.storage
          .from('project-images')
          .upload(remoteFilename, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });
        if (!error) {
          const { data } = supabase.storage.from('project-images').getPublicUrl(remoteFilename);
          return res.json({ url: data.publicUrl, type });
        }
      } catch (error) {
        console.error('فشل رفع الملف إلى Supabase:', error.message);
      }
    }
    res.json({ url: `/media/uploads/service-media/${filename}`, type });
  },
);

app.post('/api/projects', requireDb, requireAuth, async (req, res) => {
  const body = req.body || {};
  const required = [
    'image',
    'tag_ar',
    'tag_en',
    'title_ar',
    'title_en',
    'desc_ar',
    'desc_en',
  ];
  const missing = required.filter((f) => !String(body[f] || '').trim());
  if (missing.length)
    return res
      .status(400)
      .json({ error: 'الحقول دي ناقصة: ' + missing.join(', ') });
  const project = {
    id: generateId(),
    ...Object.fromEntries(required.map((f) => [f, String(body[f]).trim()])),
  };
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  if (error) return dbError(res, error);
  res.status(201).json(data);
});

app.put('/api/projects/:id', requireDb, requireAuth, async (req, res) => {
  const allowed = [
    'image',
    'tag_ar',
    'tag_en',
    'title_ar',
    'title_en',
    'desc_ar',
    'desc_en',
  ];
  const update = {};
  allowed.forEach((f) => {
    if (req.body?.[f] !== undefined) update[f] = String(req.body[f]).trim();
  });
  const { data, error } = await supabase
    .from('projects')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return dbError(res, error);
  res.json(data);
});

app.delete('/api/projects/:id', requireDb, requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', req.params.id);
  if (error) return dbError(res, error);
  res.json({ success: true });
});

app.post('/api/projects/reset', requireDb, requireAuth, async (req, res) => {
  const defaults = require('./data/default-projects.json');
  const { error: delError } = await supabase
    .from('projects')
    .delete()
    .neq('id', '__never__');
  if (delError) return dbError(res, delError);
  const { data, error } = await supabase
    .from('projects')
    .insert(defaults)
    .select();
  if (error) return dbError(res, error);
  res.json(data);
});

app.post('/api/pcb-quote', requireDb, async (req, res) => {
  try {
    res.json(calculatePcbPrice(req.body || {}, await getPricing()));
  } catch (e) {
    dbError(res, e, 'تعذر تحميل إعدادات التسعير');
  }
});
app.get('/api/pcb-pricing', requireDb, requireAuth, async (req, res) => {
  try {
    res.json(await getPricing());
  } catch (e) {
    dbError(res, e);
  }
});
app.put('/api/pcb-pricing', requireDb, requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('pcb_pricing')
    .upsert({ id: 1, config: req.body, updated_at: new Date().toISOString() })
    .select('config')
    .single();
  if (error) return dbError(res, error);
  res.json(data.config);
});

app.post(
  '/api/pcb-orders',
  requireDb,
  memoryUpload.single('gerber_file'),
  async (req, res) => {
    try {
      const body = req.body || {};
      const required = [
        'customer_name',
        'customer_phone',
        'layers',
        'quantity',
        'width_mm',
        'length_mm',
        'thickness_mm',
        'color',
      ];
      const missing = required.filter((f) => !body[f]);
      if (missing.length)
        return res
          .status(400)
          .json({ error: 'الحقول دي ناقصة: ' + missing.join(', ') });
      const quote = calculatePcbPrice(body, await getPricing());
      const id = generateId();
      let gerber_filename = null,
        gerber_original_name = null;
      if (req.file) {
        const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        gerber_filename = `${id}/${Date.now()}_${safeName}`;
        gerber_original_name = req.file.originalname;

        if (supabase) {
          try {
            await supabase.storage
              .from('gerber-files')
              .upload(gerber_filename, req.file.buffer, {
                contentType: req.file.mimetype || 'application/octet-stream',
              });
          } catch (uploadErr) {
            console.warn('Supabase gerber upload warning:', uploadErr.message);
          }
        }
        
        // Save local copy so file download works reliably in all cases
        try {
          const gerberDir = path.join(__dirname, 'media', 'uploads', 'gerber-files');
          fs.mkdirSync(gerberDir, { recursive: true });
          const localFileName = `${id}_${safeName}`;
          fs.writeFileSync(path.join(gerberDir, localFileName), req.file.buffer);
          if (!supabase) {
            gerber_filename = `/media/uploads/gerber-files/${localFileName}`;
          }
        } catch (localErr) {
          console.error('Local gerber file write error:', localErr.message);
        }
      }
      const order = {
        id,
        customer_name: String(body.customer_name).trim(),
        customer_phone: String(body.customer_phone).trim(),
        customer_email: String(body.customer_email || '').trim(),
        layers: Number(body.layers) || 2,
        quantity: Number(body.quantity) || 1,
        width_mm: Number(body.width_mm) || 10,
        length_mm: Number(body.length_mm) || 10,
        thickness_mm: Number(body.thickness_mm) || 1.6,
        color: String(body.color || 'green'),
        rush: body.rush === 'true' || body.rush === true,
        discount_code: String(body.discount_code || ''),
        gerber_filename,
        gerber_original_name,
        quote,
        ...shippingPayload(body),
        status: 'جديد',
      };
      if (supabase) {
        const { data, error } = await supabase
          .from('pcb_orders')
          .insert(order)
          .select()
          .single();
        if (error) throw error;
        const whatsappUrl = buildWhatsAppUrl('pcb', data);
        res.status(201).json({ success: true, order_id: data.id, quote, email: { queued: true }, whatsapp_url: whatsappUrl });
        setImmediate(() => {
          notifyOrderWithoutBreaking('pcb', data).catch((err) => console.error('PCB notification error:', err));
        });
      } else {
        const whatsappUrl = buildWhatsAppUrl('pcb', order);
        res.status(201).json({ success: true, order_id: order.id, quote, email: { queued: true }, whatsapp_url: whatsappUrl });
        setImmediate(() => {
          notifyOrderWithoutBreaking('pcb', order).catch((err) => console.error('PCB notification error:', err));
        });
      }
    } catch (e) {
      dbError(res, e, 'حصل خطأ أثناء إرسال الطلب');
    }
  },
);

app.get('/api/pcb-orders', requireAuth, async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from('pcb_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return dbError(res, error);
  res.json(data || []);
});

app.get(
  '/api/pcb-orders/:id/gerber',
  requireAuth,
  async (req, res) => {
    try {
      const orderId = req.params.id;
      let order = null;
      if (supabase) {
        const { data } = await supabase
          .from('pcb_orders')
          .select('gerber_filename, gerber_original_name')
          .eq('id', orderId)
          .maybeSingle();
        order = data;
      }
      
      // 1. Local file check
      const gerberDir = path.join(__dirname, 'media', 'uploads', 'gerber-files');
      if (fs.existsSync(gerberDir)) {
        const files = fs.readdirSync(gerberDir);
        const matched = files.find(f => f.startsWith(orderId + '_'));
        if (matched) {
          const downloadName = order?.gerber_original_name || matched.replace(`${orderId}_`, '');
          return res.download(path.join(gerberDir, matched), downloadName);
        }
      }

      // 2. Supabase Storage signed URL
      if (supabase && order?.gerber_filename) {
        const { data, error: signError } = await supabase.storage
          .from('gerber-files')
          .createSignedUrl(order.gerber_filename, 600);
        if (!signError && data?.signedUrl) {
          return res.json({ url: data.signedUrl });
        }
      }

      return res.status(404).json({ error: 'الملف غير موجود' });
    } catch (err) {
      res.status(500).json({ error: err.message || 'خطأ أثناء جلب الملف' });
    }
  },
);

app.put('/api/pcb-orders/:id', requireDb, requireAuth, async (req, res) => {
  try {
    const allowed = [
      'customer_name',
      'customer_phone',
      'customer_email',
      'layers',
      'quantity',
      'width_mm',
      'length_mm',
      'thickness_mm',
      'color',
      'rush',
      'discount_code',
      'status',
    ];
    const update = {};
    allowed.forEach((f) => {
      if (req.body?.[f] !== undefined) update[f] = req.body[f];
    });
    const pricingFields = [
      'layers',
      'quantity',
      'width_mm',
      'length_mm',
      'thickness_mm',
      'color',
      'rush',
      'discount_code',
    ];
    if (pricingFields.some((f) => req.body?.[f] !== undefined)) {
      const { data: old, error } = await supabase
        .from('pcb_orders')
        .select('*')
        .eq('id', req.params.id)
        .single();
      if (error) throw error;
      update.quote = calculatePcbPrice(
        { ...old, ...update },
        await getPricing(),
      );
    }
    const { data, error } = await supabase
      .from('pcb_orders')
      .update(update)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    dbError(res, e, 'حصل خطأ أثناء تعديل الطلب');
  }
});

app.delete('/api/pcb-orders/:id', requireDb, requireAuth, async (req, res) => {
  const { data: order } = await supabase
    .from('pcb_orders')
    .select('gerber_filename')
    .eq('id', req.params.id)
    .maybeSingle();
  if (order?.gerber_filename)
    await supabase.storage.from('gerber-files').remove([order.gerber_filename]);
  const { error } = await supabase
    .from('pcb_orders')
    .delete()
    .eq('id', req.params.id);
  if (error) return dbError(res, error);
  res.json({ success: true });
});

// ================= Unified Service Pricing =================
const SERVICE_PRICING_DEFAULTS = {
  printing: {
    setupFeeEGP: 50,
    minimumOrderEGP: 100,
    materialPricePerUnit: {
      PLA: 80,
      ABS: 95,
      PETG: 100,
      Resin: 140,
      Nylon: 160,
    },
    finishingMultiplier: { Standard: 1, Sanding: 1.15, Painting: 1.35 },
    thicknessMultiplier: { 1: 1, 2: 1.15, 3: 1.3, 5: 1.5 },
    quantityDiscountTiers: [
      { minQty: 1, discountPercent: 0 },
      { minQty: 5, discountPercent: 5 },
      { minQty: 10, discountPercent: 10 },
      { minQty: 25, discountPercent: 15 },
    ],
  },
  stencil: {
    setupFeeEGP: 120,
    minimumOrderEGP: 250,
    pricePerCm2: 0.35,
    standardBasePriceEGP: 180,
    thicknessMultiplier: { 0.1: 1, 0.12: 1.05, 0.15: 1.12, 0.2: 1.2 },
    quantityDiscountTiers: [
      { minQty: 1, discountPercent: 0 },
      { minQty: 5, discountPercent: 5 },
      { minQty: 10, discountPercent: 10 },
      { minQty: 25, discountPercent: 15 },
    ],
  },
  mechanical: {
    setupFeeEGP: 0,
    minimumOrderEGP: 0,
    rushSurchargePercent: 25,
    quantityDiscountTiers: [
      { minQty: 1, discountPercent: 0 },
      { minQty: 10, discountPercent: 5 },
      { minQty: 50, discountPercent: 10 },
    ],
  },
};
function getTierDiscount(qty, tiers = []) {
  return [...tiers]
    .sort((a, b) => Number(a.minQty) - Number(b.minQty))
    .reduce(
      (v, t) => (qty >= Number(t.minQty) ? Number(t.discountPercent || 0) : v),
      0,
    );
}
async function getServicePricing(service) {
  const fallback = SERVICE_PRICING_DEFAULTS[service];
  const { data, error } = await supabase
    .from('service_pricing')
    .select('config')
    .eq('service', service)
    .maybeSingle();
  if (error) {
    if (String(error.message || '').includes('service_pricing'))
      return fallback;
    throw error;
  }
  return { ...fallback, ...(data?.config || {}) };
}
async function saveServicePricing(service, config) {
  const { data, error } = await supabase
    .from('service_pricing')
    .upsert(
      { service, config, updated_at: new Date().toISOString() },
      { onConflict: 'service' },
    )
    .select('config')
    .single();
  if (error) throw error;
  return data.config;
}
function calculateShippingFee(body) {
  const method = String(body.shipping_method || 'pickup');
  const weight = Math.max(0.1, Number(body.shipping_weight_kg || 1));
  if (method === 'egypt')
    return round2(150 + Math.max(0, Math.ceil(weight) - 1) * 15);
  if (method === 'international') return 5000;
  return 0;
}
function shippingPayload(body) {
  return {
    shipping_method: String(body.shipping_method || 'pickup'),
    shipping_country: String(body.shipping_country || ''),
    shipping_address: String(body.shipping_address || ''),
    shipping_recipient_name: String(body.shipping_recipient_name || ''),
    shipping_phone: String(body.shipping_phone || ''),
    shipping_weight_kg: Math.max(0.1, Number(body.shipping_weight_kg || 1)),
    shipping_fee: calculateShippingFee(body),
  };
}
function calculatePrintingQuote(body, cfg) {
  const qty = Math.max(1, Number(body.quantity || 1));
  const material = body.material || 'PLA';
  const finishing = body.finishing || 'Standard';
  const thickness = String(body.thickness || '1');
  const unit = Number((cfg.materialPricePerUnit || {})[material] || 0);
  const finishMult = Number((cfg.finishingMultiplier || {})[finishing] || 1);
  const thicknessMult = Number((cfg.thicknessMultiplier || {})[thickness] || 1);
  const subtotal =
    Number(cfg.setupFeeEGP || 0) + unit * finishMult * thicknessMult * qty;
  const discountPercent = getTierDiscount(qty, cfg.quantityDiscountTiers);
  const discountValue = (subtotal * discountPercent) / 100;
  const shippingFee = calculateShippingFee(body);
  const finalPrice =
    Math.max(Number(cfg.minimumOrderEGP || 0), subtotal - discountValue) +
    shippingFee;
  return {
    service: 'printing',
    shippingFee,
    quantity: qty,
    unitPrice: unit,
    material,
    finishing,
    thickness,
    finishMultiplier: finishMult,
    thicknessMultiplier: thicknessMult,
    subtotal: round2(subtotal),
    discountPercent,
    discountValue: round2(discountValue),
    finalPrice: round2(finalPrice),
  };
}
function parseDimensions(v) {
  const m = String(v || '').match(/([0-9.]+)\s*[x×*]\s*([0-9.]+)/i);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}
function calculateStencilQuote(body, cfg) {
  const qty = Math.max(1, Number(body.quantity || 1));
  const [w, h] = parseDimensions(body.dimensions);
  const areaCm2 = (w * h) / 100;
  const thickness = String(body.thickness || '0.12');
  const mult = Number((cfg.thicknessMultiplier || {})[thickness] || 1);
  const unit =
    (Number(cfg.standardBasePriceEGP || 0) +
      areaCm2 * Number(cfg.pricePerCm2 || 0)) *
    mult;
  const subtotal = Number(cfg.setupFeeEGP || 0) + unit * qty;
  const discountPercent = getTierDiscount(qty, cfg.quantityDiscountTiers);
  const discountValue = (subtotal * discountPercent) / 100;
  const shippingFee = calculateShippingFee(body);
  const finalPrice =
    Math.max(Number(cfg.minimumOrderEGP || 0), subtotal - discountValue) +
    shippingFee;
  return {
    service: 'stencil',
    shippingFee,
    quantity: qty,
    areaCm2: round2(areaCm2),
    unitPrice: round2(unit),
    subtotal: round2(subtotal),
    discountPercent,
    discountValue: round2(discountValue),
    finalPrice: round2(finalPrice),
  };
}
function calculateMechanicalQuote(part, body, cfg) {
  const qty = Math.max(1, Number(body.quantity || 1));
  const base = Number(part.price || 0) * qty + Number(cfg.setupFeeEGP || 0);
  const rush = String(body.rush) === 'true' || body.rush === true;
  const rushValue = rush
    ? (base * Number(cfg.rushSurchargePercent || 0)) / 100
    : 0;
  const discountPercent = getTierDiscount(qty, cfg.quantityDiscountTiers);
  const discountValue = (base * discountPercent) / 100;
  const shippingFee = calculateShippingFee(body);
  const finalPrice =
    Math.max(
      Number(cfg.minimumOrderEGP || 0),
      base + rushValue - discountValue,
    ) + shippingFee;
  return {
    service: 'mechanical',
    shippingFee,
    quantity: qty,
    unitPrice: Number(part.price || 0),
    subtotal: round2(base),
    rushValue: round2(rushValue),
    discountPercent,
    discountValue: round2(discountValue),
    finalPrice: round2(finalPrice),
  };
}
app.get('/api/service-pricing/:service', requireDb, async (req, res) => {
  try {
    const service = req.params.service;
    if (!SERVICE_PRICING_DEFAULTS[service])
      return res.status(404).json({ error: 'خدمة غير معروفة' });
    res.json(await getServicePricing(service));
  } catch (e) {
    dbError(res, e);
  }
});
app.put(
  '/api/service-pricing/:service',
  requireDb,
  requireAuth,
  async (req, res) => {
    try {
      const service = req.params.service;
      if (!SERVICE_PRICING_DEFAULTS[service])
        return res.status(404).json({ error: 'خدمة غير معروفة' });
      res.json(await saveServicePricing(service, req.body || {}));
    } catch (e) {
      dbError(res, e);
    }
  },
);
app.post('/api/printing-quote', requireDb, async (req, res) => {
  try {
    res.json(
      calculatePrintingQuote(
        req.body || {},
        await getServicePricing('printing'),
      ),
    );
  } catch (e) {
    dbError(res, e);
  }
});
app.post('/api/stencil-quote', requireDb, async (req, res) => {
  try {
    res.json(
      calculateStencilQuote(req.body || {}, await getServicePricing('stencil')),
    );
  } catch (e) {
    dbError(res, e);
  }
});
app.post('/api/mechanical-quote', requireDb, async (req, res) => {
  try {
    const b = req.body || {};
    const { data: part, error } = await supabase
      .from('mechanical_parts')
      .select('*')
      .eq('id', b.part_id)
      .single();
    if (error) throw error;
    res.json(
      calculateMechanicalQuote(part, b, await getServicePricing('mechanical')),
    );
  } catch (e) {
    dbError(res, e);
  }
});

// ================= Reverse Tech V2 APIs =================
const orderUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});
async function uploadOrderFile(bucket, folder, file) {
  if (!file) return null;
  const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const key = `${folder}/${Date.now()}_${safe}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(key, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
    });
  if (error) throw error;
  return key;
}
app.get('/api/mechanical-parts', requireDb, async (req, res) => {
  const { data, error } = await supabase
    .from('mechanical_parts')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) return dbError(res, error);
  res.json(data || []);
});
app.post(
  '/api/upload-part-image',
  requireDb,
  requireAuth,
  orderUpload.single('part_image'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'اختر صورة' });
      const key = await uploadOrderFile('mechanical-images', 'parts', req.file);
      const { data } = supabase.storage
        .from('mechanical-images')
        .getPublicUrl(key);
      res.json({ url: data.publicUrl });
    } catch (e) {
      dbError(res, e);
    }
  },
);
app.post('/api/mechanical-parts', requireDb, requireAuth, async (req, res) => {
  const b = req.body || {};
  const { data, error } = await supabase
    .from('mechanical_parts')
    .insert({ ...b, active: true })
    .select()
    .single();
  if (error) return dbError(res, error);
  res.status(201).json(data);
});
app.put(
  '/api/mechanical-parts/:id',
  requireDb,
  requireAuth,
  async (req, res) => {
    const { data, error } = await supabase
      .from('mechanical_parts')
      .update(req.body || {})
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return dbError(res, error);
    res.json(data);
  },
);
app.delete(
  '/api/mechanical-parts/:id',
  requireDb,
  requireAuth,
  async (req, res) => {
    const { error } = await supabase
      .from('mechanical_parts')
      .delete()
      .eq('id', req.params.id);
    if (error) return dbError(res, error);
    res.json({ success: true });
  },
);
app.post('/api/mechanical-orders', requireDb, async (req, res) => {
  try {
    const b = req.body || {};
    const { data: part, error: pe } = await supabase
      .from('mechanical_parts')
      .select('*')
      .eq('id', b.part_id)
      .single();
    if (pe) throw pe;
    const quote = calculateMechanicalQuote(
      part,
      b,
      await getServicePricing('mechanical'),
    );
    const payload = {
      part_id: b.part_id,
      part_title: part.title_ar || b.part_title || '',
      customer_name: b.customer_name,
      phone: b.phone,
      email: b.email || '',
      quantity: Number(b.quantity || 1),
      notes: b.notes || '',
      ...shippingPayload(b),
      status: 'جديد',
      quote,
    };
    const { data, error } = await supabase
      .from('mechanical_orders')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    const whatsappUrl = buildWhatsAppUrl('mechanical', data);
    res.status(201).json({ ...data, email_notification: { queued: true }, whatsapp_url: whatsappUrl });
    setImmediate(() => {
      notifyOrderWithoutBreaking('mechanical', data).catch((err) => console.error('Mechanical notification error:', err));
    });
  } catch (e) {
    dbError(res, e);
  }
});
app.get('/api/mechanical-orders', requireDb, requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('mechanical_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return dbError(res, error);
  res.json(data || []);
});
app.post(
  '/api/printing-orders',
  requireDb,
  orderUpload.single('model_file'),
  async (req, res) => {
    try {
      const file_url = await uploadOrderFile('order-files', '3d', req.file);
      const b = req.body || {};
      const quote = calculatePrintingQuote(
        b,
        await getServicePricing('printing'),
      );
      const { data, error } = await supabase
        .from('printing_orders')
        .insert({
          customer_name: b.customer_name,
          phone: b.phone,
          email: b.email || '',
          file_url,
          material: b.material,
          color: b.color,
          quantity: Number(b.quantity || 1),
          finishing: b.finishing || '',
          price: quote.finalPrice,
          quote,
          ...shippingPayload(b),
          status: 'جديد',
        })
        .select()
        .single();
      if (error) throw error;
      const whatsappUrl = buildWhatsAppUrl('printing', data);
      res.status(201).json({ ...data, email_notification: { queued: true }, whatsapp_url: whatsappUrl });
      setImmediate(() => {
        notifyOrderWithoutBreaking('printing', data).catch((err) => console.error('3D printing notification error:', err));
      });
    } catch (e) {
      dbError(res, e);
    }
  },
);
app.get('/api/printing-orders', requireDb, requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('printing_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return dbError(res, error);
  res.json(data || []);
});
app.post(
  '/api/stencil-orders',
  requireDb,
  orderUpload.single('gerber_file'),
  async (req, res) => {
    try {
      const gerber_file = await uploadOrderFile(
        'order-files',
        'stencil',
        req.file,
      );
      const b = req.body || {};
      const quote = calculateStencilQuote(
        b,
        await getServicePricing('stencil'),
      );
      const { data, error } = await supabase
        .from('stencil_orders')
        .insert({
          customer_name: b.customer_name,
          phone: b.phone,
          email: b.email || '',
          gerber_file,
          dimensions: b.dimensions,
          thickness: b.thickness,
          quantity: Number(b.quantity || 1),
          price: quote.finalPrice,
          quote,
          ...shippingPayload(b),
          status: 'جديد',
        })
        .select()
        .single();
      if (error) throw error;
      const whatsappUrl = buildWhatsAppUrl('stencil', data);
      res.status(201).json({ ...data, email_notification: { queued: true }, whatsapp_url: whatsappUrl });
      setImmediate(() => {
        notifyOrderWithoutBreaking('stencil', data).catch((err) => console.error('Stencil notification error:', err));
      });
    } catch (e) {
      dbError(res, e);
    }
  },
);
app.get('/api/stencil-orders', requireDb, requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('stencil_orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return dbError(res, error);
  res.json(data || []);
});

const GRADUATION_SUPPORT_MEDIA_PATH = path.join(__dirname, 'media', 'uploads', 'graduation-support');

async function getGraduationSupportConfig() {
  const fallback = readGraduationSupportStore().config || {
    start_date: '2026-08-01',
    end_date: null,
    closed_message_ar:
      'انتهت فترة التسجيل لدعم مشاريع التخرج لهذا الموسم، تابعونا لمعرفة موعد الفتح القادم 🚀',
    closed_message_en:
      "Registration for this season's graduation project support has closed. Stay tuned for the next opening 🚀",
  };
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase
      .from('graduation_support_config')
      .select('config')
      .eq('id', 1)
      .single();
    if (error) {
      if (String(error.message || '').includes('graduation_support_config')) {
        return fallback;
      }
      throw error;
    }
    return { ...fallback, ...(data?.config || {}) };
  } catch (error) {
    console.warn('Supabase graduation support config fallback:', error.message);
    return fallback;
  }
}

function getGraduationSupportStatus(config) {
  const now = new Date();
  const start = config.start_date ? new Date(config.start_date) : null;
  const end = config.end_date ? new Date(config.end_date) : null;
  const open =
    Boolean(start) &&
    now >= start &&
    (end === null || now <= end);
  return {
    open: Boolean(open),
    config,
    message_ar: config.closed_message_ar,
    message_en: config.closed_message_en,
  };
}

async function saveGraduationSupportConfig(config) {
  const sanitized = {
    start_date: sanitizeInput(config.start_date),
    end_date: sanitizeInput(config.end_date),
    closed_message_ar: sanitizeInput(config.closed_message_ar),
    closed_message_en: sanitizeInput(config.closed_message_en),
  };
  if (!supabase) {
    const store = readGraduationSupportStore();
    store.config = sanitized;
    writeGraduationSupportStore(store);
    return sanitized;
  }
  const { data, error } = await supabase
    .from('graduation_support_config')
    .upsert({ id: 1, config: sanitized, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select('config')
    .single();
  if (error) throw error;
  return data.config;
}

async function getGraduationSupportRequests() {
  if (!supabase) {
    const store = readGraduationSupportStore();
    return Array.isArray(store.requests) ? store.requests : [];
  }
  const { data, error } = await supabase
    .from('graduation_project_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function saveGraduationSupportRequest(request) {
  if (!supabase) {
    const store = readGraduationSupportStore();
    store.requests = store.requests || [];
    store.requests.unshift(request);
    writeGraduationSupportStore(store);
    return request;
  }
  const { data, error } = await supabase
    .from('graduation_project_requests')
    .insert(request)
    .select()
    .single();
  if (error) throw error;
  return data;
}

function buildGraduationSupportFileUrl(request, key) {
  const stored = request[`${key}_filename`];
  if (!stored) return null;
  if (request[`${key}_url`]) return request[`${key}_url`];
  if (!supabase) {
    return `/media/uploads/graduation-support/${path.basename(stored)}`;
  }
  return stored;
}

async function uploadGraduationSupportFile(file, fieldName, requestId) {
  if (!file) return null;
  const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_\.]/g, '_');
  const key = `${requestId}/${fieldName}_${Date.now()}_${safeName}`;
  if (supabase) {
    try {
      const { error } = await supabase.storage
        .from('graduation-support-files')
        .upload(key, file.buffer, { contentType: file.mimetype || 'application/octet-stream' });
      if (error) {
        const message = String(error.message || '');
        if (/bucket|not found/i.test(message)) {
          throw new Error('BUCKET_FALLBACK');
        }
        throw error;
      }
      const { data } = supabase.storage.from('graduation-support-files').getPublicUrl(key);
      return data?.publicUrl || key;
    } catch (error) {
      if (error?.message === 'BUCKET_FALLBACK') {
        console.warn('Graduation support bucket missing; falling back to local storage.');
      } else {
        console.error('Graduation support upload error:', error.message);
      }
    }
  }
  try {
    fs.mkdirSync(GRADUATION_SUPPORT_MEDIA_PATH, { recursive: true });
    const localPath = path.join(GRADUATION_SUPPORT_MEDIA_PATH, `${requestId}_${fieldName}_${safeName}`);
    fs.writeFileSync(localPath, file.buffer);
    return localPath;
  } catch (error) {
    console.error('Graduation support local upload error:', error.message);
    return null;
  }
}

function graduationSupportRequestFromBody(body) {
  const members = Array.isArray(body.team_members)
    ? body.team_members
    : typeof body.team_members === 'string'
    ? JSON.parse(body.team_members || '[]')
    : [];
  return {
    id: generateId(),
    project_name: sanitizeInput(body.project_name),
    university_name: sanitizeInput(body.university_name),
    team_leader_name: sanitizeInput(body.team_leader_name),
    team_leader_email: sanitizeInput(body.team_leader_email),
    team_leader_phone: sanitizeInput(body.team_leader_phone),
    supervisor_name: sanitizeInput(body.supervisor_name),
    supervisor_phone: sanitizeInput(body.supervisor_phone),
    team_members: members.map((member) => ({
      name: sanitizeInput(member.name),
      phone: sanitizeInput(member.phone),
    })).filter((member) => member.name),
    engineering_projects: sanitizeInput(body.engineering_projects),
    engineering_project_names: sanitizeInput(body.engineering_project_names),
    engineering_project_description: sanitizeInput(body.engineering_project_description),
    sponsorship: sanitizeInput(body.sponsorship),
    sponsorship_source: sanitizeInput(body.sponsorship_source),
    language: sanitizeInput(body.language) || 'ar',
    status: 'جديد',
    created_at: new Date().toISOString(),
  };
}

function graduationSupportAdminHtml(request) {
  const safe = (value) => escapeEmailHtml(String(value || '-'));
  const rows = [
    ['Project Name', request.project_name],
    ['University Name', request.university_name],
    ['Team Leader Name', request.team_leader_name],
    ['Team Leader Email', request.team_leader_email],
    ['Team Leader Phone', request.team_leader_phone],
    ['Supervisor Name', request.supervisor_name],
    ['Supervisor Phone', request.supervisor_phone],
    ['Engineering Projects', request.engineering_projects],
    ['Engineering Project Names', request.engineering_project_names],
    ['Engineering Project Description', request.engineering_project_description],
    ['Sponsorship', request.sponsorship],
    ['Sponsorship Source', request.sponsorship_source],
  ];
  const membersHtml = request.team_members
    .map((member, index) => `<tr><td style="padding:10px;border-bottom:1px solid #e7eef5">Team member ${index + 1}</td><td style="padding:10px;border-bottom:1px solid #e7eef5">${safe(member.name)}${member.phone ? ` (${safe(member.phone)})` : ''}</td></tr>`)
    .join('');
  const filesHtml = [
    request.university_letter_original_name ? `<tr><td style="padding:10px;border-bottom:1px solid #e7eef5">University Letter</td><td style="padding:10px;border-bottom:1px solid #e7eef5">${safe(request.university_letter_original_name)}</td></tr>` : '',
    request.project_proposal_original_name ? `<tr><td style="padding:10px;border-bottom:1px solid #e7eef5">Project Proposal</td><td style="padding:10px;border-bottom:1px solid #e7eef5">${safe(request.project_proposal_original_name)}</td></tr>` : '',
  ].join('');
  return `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#eef5fb;font-family:Arial,sans-serif;color:#0b2c4b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef5fb;padding:28px 12px"><tr><td align="center"><table width="680" style="max-width:680px;width:100%;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 35px rgba(5,72,120,.12)"><tr><td style="background:linear-gradient(135deg,#087ed1,#05b9aa);padding:26px;color:#fff;text-align:center"><h1 style="margin:0">Reverse Tech</h1><p style="margin:8px 0 0">طلب دعم مشاريع التخرج جديد</p></td></tr><tr><td style="padding:26px"><table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e7eef5;border-radius:12px;overflow:hidden">${rows.map(([label,value])=>`<tr><td style="padding:10px;border-bottom:1px solid #e7eef5;font-weight:bold;width:34%">${escapeEmailHtml(label)}</td><td style="padding:10px;border-bottom:1px solid #e7eef5;white-space:pre-wrap">${escapeEmailHtml(value)}</td></tr>`).join('')}${membersHtml}${filesHtml}</table></td></tr><tr><td style="padding:15px;text-align:center;color:#6a7f91;font-size:12px;background:#f8fbfd">تم إنشاء الطلب تلقائيًا من موقع Reverse Tech</td></tr></table></td></tr></table></body></html>`;
}

function graduationSupportCustomerHtml(request) {
  const safe = (value) => escapeEmailHtml(String(value || '-'));
  const membersHtml = request.team_members
    .map((member, index) => `<li>${safe(member.name)}${member.phone ? ` - ${safe(member.phone)}` : ''}</li>`)
    .join('');
  return `<!doctype html><html dir="${request.language === 'en' ? 'ltr' : 'rtl'}" lang="${request.language === 'en' ? 'en' : 'ar'}"><body style="margin:0;background:#eef5fb;font-family:Arial,sans-serif;color:#0b2c4b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table width="620" style="max-width:620px;width:100%;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:linear-gradient(135deg,#087ed1,#05b9aa);color:#fff;text-align:center;padding:26px"><h1 style="margin:0">Reverse Tech</h1></td></tr><tr><td style="padding:30px;line-height:1.9"><h2>${request.language === 'en' ? 'Thank you for your submission' : 'شكرًا لتسجيل طلب الدعم'}</h2><p>${request.language === 'en' ? 'We have received your graduation project support request and our team will review it shortly.' : 'تم استلام طلب دعم مشروع التخرج الخاص بكم وسيتابع الفريق التواصل معكم قريبًا.'}</p><ul style="padding-left:18px;line-height:1.8">${request.language === 'en' ? '<li><b>Project:</b> ' + safe(request.project_name) + '</li>' : '<li><b>اسم المشروع:</b> ' + safe(request.project_name) + '</li>'}<li>${request.language === 'en' ? '<b>University:</b> ' : '<b>الجامعة:</b> '}${safe(request.university_name)}</li><li>${request.language === 'en' ? '<b>Team leader:</b> ' : '<b>قائد الفريق:</b> '}${safe(request.team_leader_name)} (${safe(request.team_leader_email)})</li></ul><p>${request.language === 'en' ? 'Uploaded files:' : 'الملفات المرفوعة:'}</p><ul><li>${escapeEmailHtml(request.university_letter_original_name || '–')}</li><li>${escapeEmailHtml(request.project_proposal_original_name || '–')}</li></ul><p>${request.language === 'en' ? 'Our team will contact you soon. For any questions, write to info@reversetech-med.com.' : 'سيتواصل معكم فريقنا قريبًا. لأي استفسار ارسلوا إلى info@reversetech-med.com.'}</p></td></tr></table></td></tr></table></body></html>`;
}

async function sendGraduationSupportEmails(request) {
  const transporter = await createWorkingTransporter();
  const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;
  const admins = ['info@reversetech-med.com', 'ieldesouky99@gmail.com', 'abmena333@gmail.com'];
  const adminSubject = `طلب دعم مشروع التخرج جديد - ${request.project_name}`;
  await transporter.sendMail({
    from: `Reverse Tech <${from}>`,
    to: admins.join(','),
    subject: adminSubject,
    html: graduationSupportAdminHtml(request),
    text: `Graduation support request received for ${request.project_name}`,
  });
  const customerEmail = request.team_leader_email;
  if (customerEmail && isValidEmail(customerEmail)) {
    try {
      await transporter.sendMail({
        from: `Reverse Tech <${from}>`,
        to: customerEmail,
        subject: request.language === 'en' ? 'Your Graduation Project Support Request Received' : 'تم استلام طلب دعم مشروع التخرج',
        html: graduationSupportCustomerHtml(request),
        text: `Your request for ${request.project_name} has been received.`,
      });
    } catch (sendError) {
      console.error('Graduation support confirmation email failed:', sendError.message);
    }
  }
}

app.get('/api/graduation-support/status', async (req, res) => {
  try {
    const config = await getGraduationSupportConfig();
    res.json(getGraduationSupportStatus(config));
  } catch (error) {
    dbError(res, error, 'تعذر الحصول على حالة التسجيل');
  }
});

app.post(
  '/api/graduation-support/requests',
  orderUpload.fields([
    { name: 'university_letter', maxCount: 1 },
    { name: 'project_proposal', maxCount: 1 },
    { name: 'engineering_project_images', maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const body = req.body || {};
      const required = [
        'project_name',
        'university_name',
        'team_leader_name',
        'team_leader_phone',
        'team_leader_email',
        'supervisor_name',
        'supervisor_phone',
      ];
      const missing = required.filter((key) => !sanitizeInput(body[key]));
      if (missing.length) {
        return res.status(400).json({ error: 'الحقول الأساسية مطلوبة: ' + missing.join(', ') });
      }
      if (!isValidEmail(body.team_leader_email)) {
        return res.status(400).json({ error: 'البريد الإلكتروني لمدير الفريق غير صحيح' });
      }
      const request = graduationSupportRequestFromBody(body);
      const uploadedLetter = req.files?.university_letter?.[0] || null;
      const uploadedProposal = req.files?.project_proposal?.[0] || null;
      const uploadedEngineeringImages = req.files?.engineering_project_images || [];
      if (!uploadedLetter || !uploadedProposal) {
        return res.status(400).json({ error: 'يجب رفع خطاب الجامعة والبروبوزال' });
      }
      request.university_letter_original_name = uploadedLetter.originalname;
      request.project_proposal_original_name = uploadedProposal.originalname;
      request.university_letter_filename = await uploadGraduationSupportFile(
        uploadedLetter,
        'university_letter',
        request.id,
      );
      request.project_proposal_filename = await uploadGraduationSupportFile(
        uploadedProposal,
        'project_proposal',
        request.id,
      );
      if (uploadedEngineeringImages.length) {
        const uploadedEngineeringImagePaths = await Promise.all(
          uploadedEngineeringImages.map((file) => uploadGraduationSupportFile(file, 'engineering_project_image', request.id)),
        );
        request.engineering_project_images = uploadedEngineeringImagePaths.filter(Boolean);
        request.engineering_project_images_original_names = uploadedEngineeringImages.map((file) => file.originalname);
      }
      const savedRequest = await saveGraduationSupportRequest(request);
      const whatsappUrl = buildGraduationSupportWhatsAppUrl(savedRequest);
      res.status(201).json({ success: true, request: savedRequest, email_notification: { queued: true }, whatsapp_url: whatsappUrl });
      setImmediate(() => {
        sendGraduationSupportEmails(savedRequest).catch((err) => console.error('Graduation support email error:', err.message));
      });
    } catch (error) {
      dbError(res, error, 'تعذر إرسال طلب دعم مشاريع التخرج');
    }
  },
);

app.get('/api/graduation-support/requests', requireAuth, async (req, res) => {
  try {
    const requests = await getGraduationSupportRequests();
    res.json(requests);
  } catch (error) {
    dbError(res, error);
  }
});

app.put('/api/graduation-support/requests/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const update = {};
    if (req.body?.status) update.status = sanitizeInput(req.body.status);
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
    }
    if (!supabase) {
      const store = readGraduationSupportStore();
      store.requests = Array.isArray(store.requests) ? store.requests : [];
      const idx = store.requests.findIndex((item) => String(item.id) === String(id));
      if (idx === -1) return res.status(404).json({ error: 'الطلب غير موجود' });
      store.requests[idx] = { ...store.requests[idx], ...update };
      writeGraduationSupportStore(store);
      return res.json(store.requests[idx]);
    }
    const { data, error } = await supabase
      .from('graduation_project_requests')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    dbError(res, error);
  }
});

app.delete('/api/graduation-support/requests/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!supabase) {
      const store = readGraduationSupportStore();
      store.requests = Array.isArray(store.requests) ? store.requests : [];
      store.requests = store.requests.filter((item) => String(item.id) !== String(id));
      writeGraduationSupportStore(store);
      return res.json({ success: true });
    }
    const { error } = await supabase
      .from('graduation_project_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    dbError(res, error);
  }
});

app.put('/api/graduation-support/config', requireAuth, async (req, res) => {
  try {
    res.json(await saveGraduationSupportConfig(req.body || {}));
  } catch (error) {
    dbError(res, error);
  }
});


// ================= Service card media sliders =================
const DEFAULT_SERVICE_MEDIA = {
  pcb: [
    {url:'/media/public/pcb-design-manufacturing.png',type:'image'},
    {url:'/media/public/greenpcb.jpg',type:'image'},
    {url:'/media/public/project1.png',type:'image'}
  ],
  maintenance: [
    {url:'/media/public/pcb-maintenance.png',type:'image'},
    {url:'/media/public/cardiac_Device.jpg',type:'image'},
    {url:'/media/public/project3.jpg',type:'image'}
  ],
  cnc: [
    {url:'/media/public/cnc-machining.png',type:'image'},
    {url:'/media/public/project4.jpg',type:'image'},
    {url:'/media/public/project5.jpg',type:'image'}
  ],
  printing3d: [
    {url:'/media/public/3d-scanning-printing.png',type:'image'},
    {url:'/media/public/print.jpg',type:'image'},
    {url:'/media/public/project2.png',type:'image'}
  ],
  reverse: [
    {url:'/media/public/solid.jpg',type:'image'},
    {url:'/media/public/3d-scanning-printing.png',type:'image'},
    {url:'/media/public/project6.jpg',type:'image'}
  ]
};
function normalizeServiceMediaItem(item){
  if(typeof item==='string') return {url:item,type:/\.(mp4|webm|ogg|mov)(\?|$)/i.test(item)?'video':'image'};
  const url=String(item?.url||item?.image_url||'').trim();
  const type=item?.type==='video'||item?.media_type==='video'?'video':'image';
  return url?{url,type}:null;
}
app.get('/api/service-images', async (req,res)=>{
  if(!supabase){
    const store=readServiceMediaStore();
    return res.json(mergeServiceMediaData(store));
  }
  try{
    const {data,error}=await supabase.from('service_images').select('service_key,image_url,media_type,sort_order').order('sort_order',{ascending:true});
    if(error) throw error;
    const out=JSON.parse(JSON.stringify(DEFAULT_SERVICE_MEDIA));
    if(data?.length){
      for(const k of Object.keys(out)) out[k]=[];
      for(const row of data){ if(out[row.service_key]){ const item=normalizeServiceMediaItem(row); if(item) out[row.service_key].push(item); } }
      for(const k of Object.keys(out)) if(!out[k].length) out[k]=DEFAULT_SERVICE_MEDIA[k];
    }
    res.json(out);
  }catch(e){ console.error('service media fallback:',e.message); res.json(mergeServiceMediaData(readServiceMediaStore())); }
});
app.put('/api/service-images/:key', requireAuth, async (req,res)=>{
  const key=String(req.params.key||''); if(!DEFAULT_SERVICE_MEDIA[key]) return res.status(400).json({error:'خدمة غير صحيحة'});
  const raw=Array.isArray(req.body?.media)?req.body.media:(Array.isArray(req.body?.images)?req.body.images:[]);
  const media=raw.map(normalizeServiceMediaItem).filter(Boolean).slice(0,20);
  if(!media.length) return res.status(400).json({error:'أضف صورة أو فيديو واحدًا على الأقل'});
  if(!supabase){
    const store=readServiceMediaStore();
    store[key]=media;
    writeServiceMediaStore(store);
    return res.json({service_key:key,media});
  }
  const {error:delErr}=await supabase.from('service_images').delete().eq('service_key',key); if(delErr) return dbError(res,delErr);
  const rows=media.map((item,i)=>({service_key:key,image_url:item.url,media_type:item.type,sort_order:i}));
  const {error}=await supabase.from('service_images').insert(rows); if(error) return dbError(res,error);
  res.json({service_key:key,media});
});

// ================= Email notifications for all orders =================
function buildWhatsAppUrl(orderType, order) {
  const number = String(process.env.WHATSAPP_TO_NUMBER || '').replace(/\D/g, '');
  if (!number) return '';
  const names = { pcb:'PCB', printing:'3D Printing', stencil:'SMT Stencil', mechanical:'Mechanical Parts' };
  const lines = [
    `طلب ${names[orderType] || 'خدمة'} جديد`,
    `الاسم: ${order?.customer_name || order?.name || '-'}`,
    `الهاتف: ${order?.customer_phone || order?.phone || '-'}`,
    `البريد: ${order?.customer_email || order?.email || '-'}`,
    `رقم الطلب: ${order?.id || '-'}`
  ];
  if (order?.quote?.finalPrice != null) lines.push(`السعر النهائي: ${order.quote.finalPrice} جنيه`);
  else if (order?.price != null) lines.push(`السعر: ${order.price} جنيه`);
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
}
function orderCustomerHtml(orderType, order) {
  const name = escapeEmailHtml(order?.customer_name || 'عميلنا العزيز');
  const names = { pcb:'تصنيع PCB', printing:'الطباعة ثلاثية الأبعاد', stencil:'SMT Stencil', mechanical:'القطع الميكانيكية' };
  const service = escapeEmailHtml(names[orderType] || 'الخدمة المطلوبة');
  const id = escapeEmailHtml(order?.id || '');
  return `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#eef5fb;font-family:Arial,sans-serif;color:#0b2c4b"><table role="presentation" width="100%" style="padding:28px 12px"><tr><td align="center"><table width="620" style="max-width:620px;width:100%;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:linear-gradient(135deg,#087ed1,#05b9aa);color:#fff;text-align:center;padding:26px"><h1 style="margin:0">Reverse Tech</h1></td></tr><tr><td style="padding:30px;line-height:1.9"><h2>شكرًا ${name}</h2><p>تم استلام طلب <b>${service}</b> بنجاح، وسيقوم فريقنا بمراجعته والتواصل معك قريبًا.</p>${id?`<p><b>رقم الطلب:</b> ${id}</p>`:''}<p style="color:#60778b">هذه رسالة تأكيد تلقائية.</p></td></tr></table></td></tr></table></body></html>`;
}
function orderEmailHtml(orderType, order) {
  const labels = {
    pcb: 'طلب تصنيع PCB جديد',
    printing: 'طلب طباعة ثلاثية الأبعاد جديد',
    stencil: 'طلب SMT Stencil جديد',
    mechanical: 'طلب قطعة ميكانيكية جديد',
  };
  const ignored = new Set(['gerber_filename', 'file_url']);
  const rows = Object.entries(order || {})
    .filter(([key, value]) => !ignored.has(key) && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      const shown = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      return `<tr><td style="padding:10px 12px;border-bottom:1px solid #e7eef5;font-weight:bold;width:34%">${escapeEmailHtml(key.replaceAll('_',' '))}</td><td style="padding:10px 12px;border-bottom:1px solid #e7eef5;white-space:pre-wrap">${escapeEmailHtml(shown)}</td></tr>`;
    }).join('');
  return `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#eef5fb;font-family:Arial,sans-serif;color:#0b2c4b">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center">
  <table width="680" style="max-width:680px;width:100%;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 35px rgba(5,72,120,.12)">
  <tr><td style="background:linear-gradient(135deg,#087ed1,#05b9aa);padding:26px;color:#fff;text-align:center"><h1 style="margin:0">Reverse Tech</h1><p style="margin:8px 0 0">${labels[orderType] || 'طلب جديد من الموقع'}</p></td></tr>
  <tr><td style="padding:26px"><table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e7eef5;border-radius:12px;overflow:hidden">${rows}</table></td></tr>
  <tr><td style="padding:15px;text-align:center;color:#6a7f91;font-size:12px;background:#f8fbfd">تم إنشاء الطلب تلقائيًا من موقع Reverse Tech</td></tr>
  </table></td></tr></table></body></html>`;
}
async function sendOrderNotification(orderType, order) {
  const transporter = await createWorkingTransporter();
  const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;
  const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
  const customerEmail = String(order?.customer_email || order?.email || '').trim();
  const customerName = String(order?.customer_name || 'عميل').trim();
  const typeNames = { pcb:'PCB', printing:'3D Printing', stencil:'SMT Stencil', mechanical:'Mechanical Parts' };
  await transporter.sendMail({
    from: `Reverse Tech <${from}>`,
    to,
    replyTo: customerEmail || undefined,
    subject: `طلب ${typeNames[orderType] || 'خدمة'} جديد - ${customerName}`,
    text: Object.entries(order || {}).map(([k,v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n'),
    html: orderEmailHtml(orderType, order),
  });
  let customerSent = false;
  if (customerEmail && /^\S+@\S+\.\S+$/.test(customerEmail)) {
    try {
      await transporter.sendMail({
        from: `Reverse Tech <${from}>`,
        to: customerEmail,
        subject: `تم استلام طلبك - Reverse Tech`,
        text: `مرحبًا ${customerName}، تم استلام طلبك بنجاح وسيتم التواصل معك قريبًا. رقم الطلب: ${order?.id || '-'}`,
        html: orderCustomerHtml(orderType, order),
      });
      customerSent = true;
    } catch (e) { console.error('Customer confirmation email failed:', e.message); }
  }
  return { sent: true, customer_sent: customerSent };
}
async function notifyOrderWithoutBreaking(orderType, order) {
  try { return await sendOrderNotification(orderType, order); }
  catch (error) { console.error(`Order email failed (${orderType}):`, error.message); return { sent:false, error:error.message }; }
}

// ================= Contact form: Supabase + Email + direct WhatsApp =================
function cleanContactText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}
function escapeEmailHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function contactAdminHtml({ name, email, phone, company, service, message }) {
  const safeName = escapeEmailHtml(name);
  const safeEmail = escapeEmailHtml(email);
  const safePhone = escapeEmailHtml(phone || 'غير مُدخل');
  const safeCompany = escapeEmailHtml(company || 'غير مُدخل');
  const safeService = escapeEmailHtml(service || 'غير محددة');
  const safeDate = new Intl.DateTimeFormat('ar-EG',{dateStyle:'full',timeStyle:'short',timeZone:'Africa/Cairo'}).format(new Date());
  const safeMessage = escapeEmailHtml(message).replace(/\n/g, '<br>');
  const waPhone = String(phone || '').replace(/\D/g, '');
  return `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#eef5fb;font-family:Arial,sans-serif;color:#0b2c4b">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef5fb;padding:28px 12px"><tr><td align="center">
  <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 35px rgba(5,72,120,.12)">
  <tr><td style="background:linear-gradient(135deg,#087ed1,#05b9aa);padding:28px;color:#fff;text-align:center"><h1 style="margin:0;font-size:27px">Reverse Tech</h1><p style="margin:8px 0 0">رسالة تواصل جديدة من الموقع</p></td></tr>
  <tr><td style="padding:28px"><table width="100%" cellspacing="0" cellpadding="0">
  <tr><td style="padding:12px;background:#f4f8fc;border-radius:10px"><b>اسم العميل:</b> ${safeName}</td></tr><tr><td height="10"></td></tr>
  <tr><td style="padding:12px;background:#f4f8fc;border-radius:10px"><b>البريد:</b> <a href="mailto:${safeEmail}">${safeEmail}</a></td></tr><tr><td height="10"></td></tr>
  <tr><td style="padding:12px;background:#f4f8fc;border-radius:10px"><b>الهاتف:</b> <a href="tel:${safePhone}">${safePhone}</a></td></tr><tr><td height="10"></td></tr>
  <tr><td style="padding:12px;background:#f4f8fc;border-radius:10px"><b>الشركة:</b> ${safeCompany}</td></tr><tr><td height="10"></td></tr>
  <tr><td style="padding:12px;background:#f4f8fc;border-radius:10px"><b>الخدمة المطلوبة:</b> ${safeService}</td></tr><tr><td height="10"></td></tr>
  <tr><td style="padding:12px;background:#f4f8fc;border-radius:10px"><b>التاريخ والوقت:</b> ${safeDate}</td></tr><tr><td height="16"></td></tr>
  <tr><td style="padding:18px;border:1px solid #dbe9f5;border-radius:12px"><b>الرسالة:</b><div style="margin-top:10px;line-height:1.9">${safeMessage}</div></td></tr>
  </table><div style="margin-top:22px;text-align:center"><a href="mailto:${safeEmail}" style="display:inline-block;background:#087ed1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px;margin:4px">الرد بالبريد</a>${waPhone?`<a href="https://wa.me/${waPhone}" style="display:inline-block;background:#05a884;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px;margin:4px">فتح واتساب</a>`:''}</div></td></tr>
  <tr><td style="padding:16px;text-align:center;color:#6a7f91;font-size:12px;background:#f8fbfd">تم الإرسال تلقائيًا من موقع Reverse Tech</td></tr></table></td></tr></table></body></html>`;
}
function contactCustomerHtml({ name }) {
  const safeName = escapeEmailHtml(name);
  return `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#eef5fb;font-family:Arial,sans-serif;color:#0b2c4b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table width="620" style="max-width:620px;width:100%;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:#087ed1;color:white;text-align:center;padding:26px"><h1 style="margin:0">Reverse Tech</h1></td></tr><tr><td style="padding:30px;line-height:1.9"><h2>شكرًا لتواصلك معنا، ${safeName}</h2><p>تم استلام رسالتك بنجاح، وسيقوم فريقنا بمراجعتها والتواصل معك في أقرب وقت ممكن.</p><p style="color:#60778b">هذه رسالة تأكيد تلقائية، ولا تحتاج إلى الرد عليها.</p></td></tr></table></td></tr></table></body></html>`;
}
async function createWorkingTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error('SMTP_NOT_CONFIGURED');
  const configured = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
  };
  const candidates = [configured];
  if (configured.host !== 'smtp.office365.com') candidates.push({ host: 'smtp.office365.com', port: 587, secure: false });
  if (configured.host !== 'smtpout.secureserver.net') candidates.push({ host: 'smtpout.secureserver.net', port: 465, secure: true });
  let lastError;
  for (const c of candidates) {
    if (!c.host) continue;
    const transporter = nodemailer.createTransport({ ...c, auth: { user, pass }, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000 });
    try { await transporter.verify(); return transporter; }
    catch (e) { lastError = e; console.error(`SMTP verify failed (${c.host}:${c.port}):`, e.message); }
  }
  throw lastError || new Error('تعذر الاتصال بخادم البريد');
}
async function sendContactEmails({ name, email, phone, company, service, message }) {
  const transporter = await createWorkingTransporter();
  const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;
  const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
  await transporter.sendMail({
    from: `Reverse Tech <${from}>`, to, replyTo: email,
    subject: `رسالة جديدة من موقع Reverse Tech - ${name}`,
    text: `الاسم: ${name}\nالبريد: ${email}\nالهاتف: ${phone || 'غير مُدخل'}\nالشركة: ${company || 'غير مُدخل'}\nالخدمة: ${service || 'غير محددة'}\n\nالرسالة:\n${message}`,
    html: contactAdminHtml({ name, email, phone, company, service, message }),
  });
  // Confirmation to customer. Failure here should not cancel the admin email.
  try {
    await transporter.sendMail({
      from: `Reverse Tech <${from}>`, to: email,
      subject: 'تم استلام رسالتك - Reverse Tech',
      text: `مرحبًا ${name}، تم استلام رسالتك بنجاح وسيتم التواصل معك قريبًا.`,
      html: contactCustomerHtml({ name }),
    });
  } catch (e) { console.error('Customer confirmation email failed:', e.message); }
  return { sent: true };
}
app.post('/api/contact', async (req, res) => {
  try {
    const name = cleanContactText(req.body?.name, 120);
    const email = cleanContactText(req.body?.email, 180);
    const phone = cleanContactText(req.body?.phone, 40);
    const company = cleanContactText(req.body?.company, 180);
    const service = cleanContactText(req.body?.service, 180);
    const message = cleanContactText(req.body?.message, 4000);
    if (!name || !email || !message) return res.status(400).json({ error: 'الاسم والبريد والرسالة مطلوبة' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' });
    let saved = false;
    if (supabase) {
      const row = { name, email, phone, company, service, message, status: 'جديد' };
      let { error } = await supabase.from('contact_messages').insert(row);
      // Compatibility with an older table until the contact migration is executed.
      if (error && /(phone|company|service|status)/i.test(error.message || '')) ({ error } = await supabase.from('contact_messages').insert({ name, email, message }));
      if (error) throw error;
      saved = true;
    }
    const emailResult = await sendContactEmails({ name, email, phone, company, service, message });
    const whatsappNumber = String(process.env.WHATSAPP_TO_NUMBER || '').replace(/\D/g, '');
    const whatsappText = `رسالة من موقع Reverse Tech\nالاسم: ${name}\nالبريد: ${email}\nالهاتف: ${phone || 'غير مُدخل'}\nالشركة: ${company || 'غير مُدخل'}\nالخدمة: ${service || 'غير محددة'}\nالرسالة: ${message}`;
    const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}` : '';
    res.status(201).json({ success: true, saved, email: emailResult, whatsapp_url: whatsappUrl });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: error.message || 'تعذر إرسال الرسالة' });
  }
});



// ================= Newsletter inquiry: company notification + customer confirmation =================
function newsletterCompanyHtml(email) {
  const safeEmail = escapeEmailHtml(email);
  const safeDate = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Cairo' }).format(new Date());
  return `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#eef5fb;font-family:Arial,sans-serif;color:#0b2c4b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table width="620" style="max-width:620px;width:100%;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:linear-gradient(135deg,#087ed1,#05b9aa);color:white;text-align:center;padding:26px"><h1 style="margin:0">Reverse Tech</h1><p style="margin:8px 0 0">استفسار/اشتراك جديد من الموقع</p></td></tr><tr><td style="padding:30px;line-height:1.9"><p><b>البريد الإلكتروني:</b> <a href="mailto:${safeEmail}">${safeEmail}</a></p><p><b>التاريخ والوقت:</b> ${safeDate}</p><p>قام صاحب هذا البريد بإرسال طلب من نموذج البريد الموجود في الموقع.</p></td></tr></table></td></tr></table></body></html>`;
}
function newsletterCustomerHtml(email) {
  const safeEmail = escapeEmailHtml(email);
  return `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#eef5fb;font-family:Arial,sans-serif;color:#0b2c4b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table width="620" style="max-width:620px;width:100%;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:#087ed1;color:white;text-align:center;padding:26px"><h1 style="margin:0">Reverse Tech</h1></td></tr><tr><td style="padding:30px;line-height:1.9"><h2>تم استلام رسالتك بنجاح</h2><p>وصل طلبك إلى شركة Reverse Tech من البريد <b>${safeEmail}</b>، وسيتواصل معك فريقنا عند الحاجة.</p><p style="color:#60778b">هذه رسالة تأكيد تلقائية.</p></td></tr></table></td></tr></table></body></html>`;
}
app.post('/api/newsletter-subscribe', async (req, res) => {
  try {
    const email = cleanContactText(req.body?.email, 180);
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' });
    const transporter = await createWorkingTransporter();
    const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;
    const to = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER;
    await transporter.sendMail({
      from: `Reverse Tech <${from}>`,
      to,
      replyTo: email,
      subject: `استفسار/اشتراك جديد من الموقع - ${email}`,
      text: `يوجد استفسار أو اشتراك جديد من الموقع.\nالبريد: ${email}`,
      html: newsletterCompanyHtml(email),
    });
    try {
      await transporter.sendMail({
        from: `Reverse Tech <${from}>`,
        to: email,
        subject: 'تم استلام رسالتك - Reverse Tech',
        text: 'تم استلام رسالتك لدى شركة Reverse Tech بنجاح.',
        html: newsletterCustomerHtml(email),
      });
    } catch (customerError) {
      console.error('Newsletter customer confirmation failed:', customerError.message);
    }
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Newsletter email error:', error);
    res.status(500).json({ error: error.message || 'تعذر إرسال الرسالة' });
  }
});

// ===== Contact messages admin workflow =====
app.get('/api/contact-messages', requireDb, requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  if (error) return dbError(res, error);
  res.json(data || []);
});
app.put('/api/contact-messages/:id', requireDb, requireAuth, async (req, res) => {
  const allowed = ['جديد','قيد المراجعة','تم التواصل','منتهي','ملغي'];
  const status = cleanContactText(req.body?.status, 60);
  if (!allowed.includes(status)) return res.status(400).json({ error: 'حالة الرسالة غير صحيحة' });
  const { data, error } = await supabase.from('contact_messages').update({ status }).eq('id', req.params.id).select().single();
  if (error) return dbError(res, error);
  res.json(data);
});
app.delete('/api/contact-messages/:id', requireDb, requireAuth, async (req, res) => {
  const { error } = await supabase.from('contact_messages').delete().eq('id', req.params.id);
  if (error) return dbError(res, error);
  res.json({ success: true });
});

// ===== Generic admin workflow for all service orders =====
const ORDER_TABLES = {
  'printing-orders': 'printing_orders',
  'stencil-orders': 'stencil_orders',
  'mechanical-orders': 'mechanical_orders',
};
for (const [routeName, tableName] of Object.entries(ORDER_TABLES)) {
  app.put(`/api/${routeName}/:id`, requireDb, requireAuth, async (req, res) => {
    const allowedStatuses = ['جديد', 'قيد المراجعة', 'قيد التنفيذ', 'تم التنفيذ', 'تم التواصل', 'منتهي', 'ملغي'];
    const status = cleanContactText(req.body?.status, 60);
    if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'حالة الطلب غير صحيحة' });
    const { data, error } = await supabase.from(tableName).update({ status }).eq('id', req.params.id).select().single();
    if (error) return dbError(res, error);
    res.json(data);
  });
  app.delete(`/api/${routeName}/:id`, requireDb, requireAuth, async (req, res) => {
    const { error } = await supabase.from(tableName).delete().eq('id', req.params.id);
    if (error) return dbError(res, error);
    res.json({ success: true });
  });
}

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')),
);
app.use((err, req, res, next) =>
  res.status(400).json({ error: err.message || 'حصل خطأ أثناء رفع الملف' }),
);
app.listen(PORT, () => console.log(`Reverse Tech server running on ${PORT}`));
