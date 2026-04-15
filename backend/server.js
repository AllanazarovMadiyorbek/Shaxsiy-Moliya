import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import reportRoutes from './routes/reports.js';
import currencyRoutes from './routes/currency.js';
import oauthRoutes from './routes/oauth.js';
import passwordResetRoutes from './routes/password-reset.js';
import recurringRoutes from './routes/recurring.js';
import goalsRoutes from './routes/goals.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import insightsRoutes from './routes/insights.js';
import setupRoutes from './routes/setup.js';
import forecastRoutes from './routes/forecast.js';
import trendsRoutes from './routes/trends.js';
import familiesRoutes from './routes/families.js';
import familySharedRoutes from './routes/family-shared.js';
import { processRecurringTransactions } from './utils/recurring-processor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://aurora-ledger.vercel.app',
      'https://shaxsiy-moliya-rouge.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    // Match any Vercel preview/prod URL for this project, including
    // team-scoped previews like shaxsiy-moliya-<hash>-<team>-projects.vercel.app
    const vercelPreview = /^https:\/\/shaxsiy-moliya[a-z0-9-]*\.vercel\.app$/i;

    if (allowedOrigins.includes(origin) || vercelPreview.test(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Diagnostics: checks DB connectivity, required tables, and critical env vars.
// Exposed intentionally (read-only) so production misconfigs can be diagnosed
// without Render shell access.
app.get('/health/diag', async (req, res) => {
  const diag = {
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || null,
      NODE_ENV: process.env.NODE_ENV || null,
    },
    db: { connected: false, error: null, usersTable: null },
  };
  try {
    const { default: pool } = await import('./config/database.js');
    const r = await pool.query('SELECT 1 AS ok');
    diag.db.connected = r.rows[0]?.ok === 1;
    const t = await pool.query(
      "SELECT to_regclass('public.users') AS users, to_regclass('public.categories') AS categories"
    );
    diag.db.usersTable = t.rows[0]?.users || null;
    diag.db.categoriesTable = t.rows[0]?.categories || null;
  } catch (err) {
    diag.db.error = err.message;
  }
  res.json(diag);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/families', familiesRoutes);
app.use('/api/family', familySharedRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/goals', goalsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


// Setup recurring transactions cron job
// Run every day at 00:05 (5 minutes after midnight)
cron.schedule('5 0 * * *', async () => {
  console.log('⏰ Running scheduled recurring transactions processor...');
  try {
    await processRecurringTransactions();
  } catch (error) {
    console.error('❌ Scheduled recurring processing failed:', error);
  }
});

// Also run on server startup (optional, for immediate processing)
if (process.env.PROCESS_RECURRING_ON_STARTUP === 'true') {
  console.log('🔄 Processing recurring transactions on startup...');
  processRecurringTransactions().catch(err => {
    console.error('❌ Startup recurring processing failed:', err);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || '*'}`);
  console.log(`⏰ Recurring transactions cron job scheduled (daily at 00:05)`);
});

export default app;

