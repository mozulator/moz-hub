const express = require('express');
const path = require('path');
const multer = require('multer');
const OpenAI = require('openai');
const session = require('express-session');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

function normalizeBasePath(basePath) {
  const raw = String(basePath || '').trim();
  if (!raw || raw === '/') return '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function safeRequirePrismaClient({ projectRoot }) {
  // Prefer a per-project generated client so multiple Prisma apps can coexist in the monorepo.
  // Fallback to '@prisma/client' to keep local dev workable before generate is run.
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(path.join(projectRoot, 'generated', 'prisma', 'client'));
  } catch {
    // eslint-disable-next-line global-require
    return require('@prisma/client');
  }
}

function createApp({ basePath, repoRoot }) {
  const basePathNorm = normalizeBasePath(basePath);
  const projectRoot = path.join(repoRoot, 'Projects', 'Budget Tracker');

  const app = express();

  // Render (and most PaaS) terminates TLS at the edge proxy.
  // Trust the proxy so secure cookies/sessions work correctly.
  app.set('trust proxy', 1);

  // OpenAI client (optional)
  const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  // Prisma
  const { PrismaClient } = safeRequirePrismaClient({ projectRoot });
  const prisma = new PrismaClient();

  // Multer configuration for PDF uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') cb(null, true);
      else cb(new Error('Only PDF files are allowed'), false);
    }
  });

  // Middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  let sessionSecret = process.env.BUDGET_TRACKER_SESSION_SECRET;
  if (!sessionSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Missing required env var: BUDGET_TRACKER_SESSION_SECRET (Budget Tracker session secret)'
      );
    }
    // Dev convenience: don’t take the whole hub down if you forgot to set it.
    sessionSecret = crypto.randomBytes(32).toString('hex');
    // eslint-disable-next-line no-console
    console.warn(
      '[budget-tracker] BUDGET_TRACKER_SESSION_SECRET not set; using a random dev secret (sessions reset on restart).'
    );
  }

  app.use(
    session({
      name: 'bt.sid',
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        // Use secure cookies in production, but allow proxy-terminated TLS to work.
        // "auto" = secure when Express considers the request secure.
        secure: process.env.NODE_ENV === 'production' ? 'auto' : false,
        path: basePathNorm || '/'
      }
    })
  );

  app.use(express.static(path.join(projectRoot, 'public')));

  // View engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(projectRoot, 'views'));

  // Helper to format currency
  const formatCurrency = (amount) => {
    return (
      new Intl.NumberFormat('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount) + ' RSD'
    );
  };

  // Make helpers available to all views
  app.use((req, res, next) => {
    res.locals.formatCurrency = formatCurrency;
    res.locals.currentPath = req.path;
    res.locals.basePath = basePathNorm;
    res.locals.isAuthenticated = Boolean(req.session?.userId);
    next();
  });

  function isPublicPath(reqPath) {
    return (
      reqPath === '/login' ||
      reqPath.startsWith('/css/') ||
      reqPath.startsWith('/js/') ||
      reqPath.startsWith('/fonts/') ||
      reqPath.startsWith('/images/') ||
      reqPath.startsWith('/favicon')
    );
  }

  function requireAuth(req, res, next) {
    if (req.session?.userId) return next();
    if (isPublicPath(req.path)) return next();

    const accept = String(req.headers.accept || '');
    const wantsJson =
      req.path.startsWith('/api/') ||
      accept.includes('application/json') ||
      req.method !== 'GET' ||
      req.get('x-requested-with') === 'XMLHttpRequest';

    if (wantsJson) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    return res.redirect('login');
  }

  // Protect everything by default (except /login + static assets)
  app.use(requireAuth);

  // ============================================
  // AUTH ROUTES
  // ============================================

  app.get('/login', (req, res) => {
    if (req.session?.userId) return res.redirect('overview');
    res.render('login', { error: null });
  });

  app.post('/login', async (req, res) => {
    try {
      const username = String(req.body.username || '').trim();
      const password = String(req.body.password || '');

      if (!username || !password) {
        return res.status(400).render('login', { error: 'Username and password are required.' });
      }

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return res.status(401).render('login', { error: 'Invalid credentials.' });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(401).render('login', { error: 'Invalid credentials.' });
      }

      req.session.userId = user.id;
      req.session.username = user.username;

      return res.redirect('overview');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Login error:', error);
      return res.status(500).render('login', { error: 'Login failed. Try again.' });
    }
  });

  app.post('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('login');
    });
  });

  // Build extraction prompt from database template
  async function buildExtractionPrompt(categories) {
    const setting = await prisma.setting.findUnique({
      where: { key: 'extraction_prompt' }
    });

    if (!setting) {
      throw new Error('Extraction prompt not found in database. Run the Budget Tracker seed.');
    }

    const categoryList = categories
      .map((c) => `- "${c.name}": ${c.description || c.name}`)
      .join('\n');
    return setting.value.replace('{{CATEGORIES}}', categoryList);
  }

  // ============================================
  // OVERVIEW ROUTES
  // ============================================

  app.get('/', (req, res) => {
    res.redirect('overview');
  });

  app.get('/overview', async (req, res) => {
    try {
      const monthsResult = await prisma.payment.findMany({
        select: { monthKey: true },
        distinct: ['monthKey'],
        orderBy: { monthKey: 'desc' }
      });

      const availableMonths = monthsResult.map((m) => ({
        value: m.monthKey,
        label: formatMonthLabel(m.monthKey)
      }));

      const currentMonth = new Date().toISOString().slice(0, 7);
      const month =
        req.query.month || (availableMonths.length > 0 ? availableMonths[0].value : currentMonth);

      const payments = await prisma.payment.findMany({
        where: { monthKey: month },
        include: { paymentType: true }
      });

      const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
      const typeStats = {};

      payments.forEach((p) => {
        const typeId = p.paymentTypeId || 'uncategorized';
        if (!typeStats[typeId]) {
          typeStats[typeId] = {
            total: 0,
            count: 0,
            type: p.paymentType || {
              id: 'uncategorized',
              name: 'Uncategorized',
              icon: 'help-circle',
              color: 'gray'
            }
          };
        }
        typeStats[typeId].total += p.amount;
        typeStats[typeId].count += 1;
      });

      const paymentTypes = Object.values(typeStats)
        .map((stat) => ({
          ...stat.type,
          monthlyTotal: stat.total,
          paymentCount: stat.count,
          percentage: totalSpent > 0 ? Math.round((stat.total / totalSpent) * 100) : 0
        }))
        .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

      res.render('overview', {
        month,
        availableMonths,
        paymentTypes,
        totalSpent
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Overview error:', error);
      res.status(500).render('404');
    }
  });

  // ============================================
  // PAYMENTS ROUTES
  // ============================================

  app.get('/payments', async (req, res) => {
    try {
      const search = req.query.search || '';

      const monthsResult = await prisma.payment.findMany({
        select: { monthKey: true },
        distinct: ['monthKey'],
        orderBy: { monthKey: 'desc' }
      });

      const availableMonths = monthsResult.map((m) => ({
        value: m.monthKey,
        label: formatMonthLabel(m.monthKey)
      }));

      const currentMonth = new Date().toISOString().slice(0, 7);
      const month =
        req.query.month || (availableMonths.length > 0 ? availableMonths[0].value : currentMonth);

      const whereClause = { monthKey: month };
      if (search) whereClause.recipient = { contains: search };

      const payments = await prisma.payment.findMany({
        where: whereClause,
        include: { paymentType: true, service: true },
        orderBy: { date: 'desc' }
      });

      const paymentTypes = await prisma.paymentType.findMany({
        orderBy: { name: 'asc' }
      });

      res.render('payments', {
        month,
        search,
        availableMonths,
        payments,
        paymentTypes
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Payments error:', error);
      res.status(500).render('404');
    }
  });

  app.patch('/payments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentTypeId } = req.body;

      const payment = await prisma.payment.update({
        where: { id },
        data: { paymentTypeId: paymentTypeId || null },
        include: { paymentType: true }
      });

      res.json({ success: true, payment });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Update payment error:', error);
      res.status(500).json({ success: false, error: 'Failed to update payment' });
    }
  });

  app.post('/payments/import', upload.single('pdf'), async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'AI import is disabled: OPENAI_API_KEY is not configured.'
        });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
      }

      // eslint-disable-next-line no-console
      console.log(
        '📄 Processing PDF:',
        req.file.originalname,
        `(${(req.file.size / 1024).toFixed(1)} KB)`
      );

      const paymentTypes = await prisma.paymentType.findMany();
      const categoryMap = {};
      paymentTypes.forEach((pt) => {
        categoryMap[pt.name.toLowerCase()] = pt.id;
      });

      const base64Pdf = req.file.buffer.toString('base64');
      const prompt = await buildExtractionPrompt(paymentTypes);

      // eslint-disable-next-line no-console
      console.log('🤖 Sending to OpenAI gpt-4o...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'file',
                file: {
                  filename: req.file.originalname,
                  file_data: `data:application/pdf;base64,${base64Pdf}`
                }
              }
            ]
          }
        ],
        max_tokens: 16000,
        temperature: 0.1
      });

      const content = response.choices[0].message.content;
      // eslint-disable-next-line no-console
      console.log('📥 Received response from OpenAI');

      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      let data;
      try {
        data = JSON.parse(jsonStr);
      } catch {
        // eslint-disable-next-line no-console
        console.error('Failed to parse OpenAI response:', content);
        return res.status(500).json({
          success: false,
          error: 'Failed to parse extracted data from PDF'
        });
      }

      if (!data.payments || !Array.isArray(data.payments)) {
        return res.status(500).json({
          success: false,
          error: 'No payments found in the extracted data'
        });
      }

      // eslint-disable-next-line no-console
      console.log(`✅ Extracted ${data.payments.length} payments from PDF`);

      let imported = 0;
      let skipped = 0;
      let categorized = 0;

      for (const payment of data.payments) {
        if (!payment.date || !payment.recipient || typeof payment.amount !== 'number') {
          skipped++;
          continue;
        }

        const date = new Date(payment.date);
        if (Number.isNaN(date.getTime())) {
          skipped++;
          continue;
        }

        const monthKey = payment.date.slice(0, 7);

        const existing = await prisma.payment.findFirst({
          where: { date, recipient: payment.recipient, amount: payment.amount }
        });

        if (existing) {
          skipped++;
          continue;
        }

        let paymentTypeId = null;
        if (payment.category) {
          const categoryLower = payment.category.toLowerCase();
          paymentTypeId = categoryMap[categoryLower] || null;
          if (paymentTypeId) categorized++;
        }

        await prisma.payment.create({
          data: {
            date,
            recipient: payment.recipient,
            amount: payment.amount,
            monthKey,
            paymentTypeId,
            rawData: JSON.stringify(payment)
          }
        });

        imported++;
      }

      // eslint-disable-next-line no-console
      console.log(`💾 Imported: ${imported}, Categorized: ${categorized}, Skipped: ${skipped}`);

      res.json({
        success: true,
        imported,
        categorized,
        skipped,
        total: data.payments.length,
        metadata: data.metadata
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Import error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to import PDF' });
    }
  });

  app.delete('/payments/clear', async (req, res) => {
    try {
      const month = req.query.month;
      if (!month) {
        return res.status(400).json({ success: false, error: 'Month parameter required' });
      }

      const result = await prisma.payment.deleteMany({
        where: { monthKey: month }
      });

      // eslint-disable-next-line no-console
      console.log(`🗑️ Deleted ${result.count} payments for ${month}`);

      res.json({ success: true, deleted: result.count });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Clear error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to clear payments' });
    }
  });

  // ============================================
  // PAYMENT TYPES ROUTES
  // ============================================

  app.get('/payment-types', async (req, res) => {
    try {
      const paymentTypes = await prisma.paymentType.findMany({
        include: { _count: { select: { payments: true } } },
        orderBy: { name: 'asc' }
      });

      const typesWithStats = await Promise.all(
        paymentTypes.map(async (type) => {
          const aggregate = await prisma.payment.aggregate({
            where: { paymentTypeId: type.id },
            _sum: { amount: true }
          });
          return {
            ...type,
            paymentCount: type._count.payments,
            totalAmount: aggregate._sum.amount || 0
          };
        })
      );

      res.render('payment-types', { paymentTypes: typesWithStats });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Payment types error:', error);
      res.status(500).render('404');
    }
  });

  app.post('/payment-types', async (req, res) => {
    try {
      const { name, icon, color, description } = req.body;
      await prisma.paymentType.create({ data: { name, icon, color, description } });
      res.redirect('payment-types');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Create payment type error:', error);
      res.status(500).redirect('payment-types');
    }
  });

  app.patch('/payment-types/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, icon, color, description } = req.body;
      const paymentType = await prisma.paymentType.update({
        where: { id },
        data: { name, icon, color, description }
      });
      res.json({ success: true, paymentType });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Update payment type error:', error);
      res.status(500).json({ success: false, error: 'Failed to update payment type' });
    }
  });

  app.delete('/payment-types/:id', async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.payment.updateMany({
        where: { paymentTypeId: id },
        data: { paymentTypeId: null }
      });

      await prisma.service.deleteMany({
        where: { paymentTypeId: id }
      });

      await prisma.paymentType.delete({
        where: { id }
      });

      res.json({ success: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Delete payment type error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete payment type' });
    }
  });

  app.get('/payment-types/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const month = req.query.month || null;

      const paymentType = await prisma.paymentType.findUnique({ where: { id } });
      if (!paymentType) return res.status(404).render('404');

      const whereClause = { paymentTypeId: id };
      if (month) whereClause.monthKey = month;

      const payments = await prisma.payment.findMany({
        where: whereClause,
        orderBy: { date: 'desc' }
      });

      const services = await prisma.service.findMany({
        where: { paymentTypeId: id },
        orderBy: { name: 'asc' }
      });

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const stats = {
        totalAmount,
        paymentCount: payments.length,
        averageAmount: payments.length > 0 ? totalAmount / payments.length : 0
      };

      const monthsResult = await prisma.payment.findMany({
        where: { paymentTypeId: id },
        select: { monthKey: true },
        distinct: ['monthKey'],
        orderBy: { monthKey: 'desc' }
      });

      const availableMonths = monthsResult.map((m) => ({
        value: m.monthKey,
        label: formatMonthLabel(m.monthKey)
      }));

      res.render('payment-type-detail', {
        paymentType,
        payments,
        services,
        stats,
        availableMonths,
        selectedMonth: month
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Payment type detail error:', error);
      res.status(500).render('404');
    }
  });

  // ============================================
  // SERVICES ROUTES
  // ============================================

  app.post('/payment-types/:id/services', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, unsubscribeUrl } = req.body;

      await prisma.service.create({
        data: {
          name,
          unsubscribeUrl: unsubscribeUrl || null,
          paymentTypeId: id
        }
      });

      res.redirect(`payment-types/${id}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Create service error:', error);
      res.status(500).redirect(`payment-types/${req.params.id}`);
    }
  });

  app.patch('/services/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, unsubscribeUrl } = req.body;

      const service = await prisma.service.update({
        where: { id },
        data: { name, unsubscribeUrl: unsubscribeUrl || null }
      });

      res.json({ success: true, service });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Update service error:', error);
      res.status(500).json({ success: false, error: 'Failed to update service' });
    }
  });

  app.delete('/services/:id', async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.payment.updateMany({
        where: { serviceId: id },
        data: { serviceId: null }
      });

      await prisma.service.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Delete service error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete service' });
    }
  });

  // ============================================
  // PROMPT/SETTINGS ROUTES
  // ============================================

  app.get('/prompt', async (req, res) => {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: 'extraction_prompt' }
      });

      res.render('prompt', {
        prompt: setting?.value || '',
        lastUpdated: setting?.updatedAt || null
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Prompt page error:', error);
      res.status(500).render('404');
    }
  });

  app.post('/prompt', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Prompt cannot be empty' });
      }

      await prisma.setting.upsert({
        where: { key: 'extraction_prompt' },
        update: { value: prompt },
        create: { key: 'extraction_prompt', value: prompt }
      });

      // eslint-disable-next-line no-console
      console.log('📝 Extraction prompt updated');
      res.json({ success: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Save prompt error:', error);
      res.status(500).json({ success: false, error: 'Failed to save prompt' });
    }
  });

  // ============================================
  // COMPARE ROUTES
  // ============================================

  app.get('/compare', async (req, res) => {
    try {
      const { month1, month2 } = req.query;

      const monthsResult = await prisma.payment.findMany({
        select: { monthKey: true },
        distinct: ['monthKey'],
        orderBy: { monthKey: 'desc' }
      });

      const availableMonths = monthsResult.map((m) => ({
        value: m.monthKey,
        label: formatMonthLabel(m.monthKey)
      }));

      if (!month1 || !month2) {
        return res.render('compare', {
          availableMonths,
          month1: month1 || null,
          month2: month2 || null,
          month1Label: null,
          month2Label: null,
          total1: 0,
          total2: 0,
          totalDiff: 0,
          totalPercent: 0,
          comparison: []
        });
      }

      const paymentTypes = await prisma.paymentType.findMany({
        orderBy: { name: 'asc' }
      });

      const payments1 = await prisma.payment.findMany({
        where: { monthKey: month1 },
        include: { paymentType: true }
      });
      const payments2 = await prisma.payment.findMany({
        where: { monthKey: month2 },
        include: { paymentType: true }
      });

      const totals1 = {};
      const totals2 = {};
      payments1.forEach((p) => {
        const typeId = p.paymentTypeId || 'uncategorized';
        totals1[typeId] = (totals1[typeId] || 0) + p.amount;
      });
      payments2.forEach((p) => {
        const typeId = p.paymentTypeId || 'uncategorized';
        totals2[typeId] = (totals2[typeId] || 0) + p.amount;
      });

      const comparison = paymentTypes
        .map((pt) => ({
          id: pt.id,
          name: pt.name,
          icon: pt.icon,
          color: pt.color,
          amount1: totals1[pt.id] || 0,
          amount2: totals2[pt.id] || 0,
          diff: (totals2[pt.id] || 0) - (totals1[pt.id] || 0)
        }))
        .filter((c) => c.amount1 > 0 || c.amount2 > 0)
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

      const total1 = payments1.reduce((sum, p) => sum + p.amount, 0);
      const total2 = payments2.reduce((sum, p) => sum + p.amount, 0);
      const totalDiff = total2 - total1;
      const totalPercent = total1 > 0 ? Math.round((totalDiff / total1) * 100) : 0;

      res.render('compare', {
        availableMonths,
        month1,
        month2,
        month1Label: formatMonthLabel(month1),
        month2Label: formatMonthLabel(month2),
        total1,
        total2,
        totalDiff,
        totalPercent,
        comparison
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Compare error:', error);
      res.status(500).render('404');
    }
  });

  app.post('/compare/summarize', async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({
          success: false,
          error: 'AI summary is disabled: OPENAI_API_KEY is not configured.'
        });
      }

      const { month1Label, month2Label, total1, total2, comparison } = req.body;
      if (!month1Label || !month2Label || !comparison) {
        return res.status(400).json({ success: false, error: 'Missing comparison data' });
      }

      const fs = require('fs');
      const promptPath = path.join(projectRoot, 'data', 'summarize.md');
      let systemPrompt = '';
      try {
        systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      } catch {
        systemPrompt =
          'You are a helpful financial advisor. Analyze the spending comparison and provide insights.';
      }

      let comparisonText = `Comparing: ${month1Label} vs ${month2Label}\n\n`;
      comparisonText += `${month1Label} Total: ${formatCurrency(total1)}\n`;
      comparisonText += `${month2Label} Total: ${formatCurrency(total2)}\n`;
      comparisonText += `Difference: ${total2 - total1 > 0 ? '+' : ''}${formatCurrency(
        total2 - total1
      )}\n\n`;

      comparisonText += `${month1Label} by Category:\n`;
      comparison.forEach((c) => {
        if (c.amount1 > 0) comparisonText += `- ${c.name}: ${formatCurrency(c.amount1)}\n`;
      });

      comparisonText += `\n${month2Label} by Category:\n`;
      comparison.forEach((c) => {
        if (c.amount2 > 0) comparisonText += `- ${c.name}: ${formatCurrency(c.amount2)}\n`;
      });

      comparisonText += `\nChanges by Category:\n`;
      comparison.forEach((c) => {
        const diff = c.amount2 - c.amount1;
        if (diff !== 0) {
          comparisonText += `- ${c.name}: ${diff > 0 ? '+' : ''}${formatCurrency(diff)} (${
            diff > 0 ? 'increased' : 'decreased'
          })\n`;
        }
      });

      // eslint-disable-next-line no-console
      console.log('🤖 Requesting AI summary for comparison...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: comparisonText }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const summary = response.choices[0].message.content;
      // eslint-disable-next-line no-console
      console.log('✅ AI summary generated');
      res.json({ success: true, summary });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Summarize error:', error);
      res
        .status(500)
        .json({ success: false, error: error.message || 'Failed to generate summary' });
    }
  });

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  function formatMonthLabel(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  app.use((req, res) => {
    res.status(404).render('404');
  });

  // Graceful shutdown (hub process)
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
  });
  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
  });

  return app;
}

module.exports = { createApp };


