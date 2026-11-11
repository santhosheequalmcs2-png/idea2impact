import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { z } from 'zod';

import { prisma } from './prisma.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { askAI } from './services/ai.js';

import { authRouter } from './routes/auth.routes.js';
import { innovationsRouter } from './routes/innovations.routes.js';
import { categoriesRouter } from './routes/categories.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { uploadRouter } from './routes/upload.routes.js';
import { talentsRouter } from './routes/talents.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// Allowed CORS origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:4173'
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach(u => {
    const trimmed = u.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any Vercel deployment preview / production domain
    if (origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev/production with credentials
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file serving for uploads
app.use('/uploads', express.static(uploadDir));

// Rate limiting for general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'idea2impact-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Modular Routes
app.use('/api/auth', authRouter);
app.use('/api/innovations', innovationsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/talents', talentsRouter);

// AI Studio chat endpoint (preserves existing AI assistant feature)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const v = z.object({
      prompt: z.string().min(2).max(4000),
      context: z.string().max(4000).optional()
    }).parse(req.body);

    const result = await askAI(v.prompt, v.context);
    res.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid prompt format' });
    }
    console.error('AI chat error:', e);
    res.status(503).json({ error: 'AI service unavailable', detail: e.message });
  }
});

// Matching preview endpoint
app.post('/api/matching/preview', requireAuth, async (req, res) => {
  try {
    const { skills = [], interests = [], category } = req.body || {};
    const people = await prisma.profile.findMany({
      where: { userId: { not: req.user.id } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            roles: { select: { role: true } }
          }
        }
      },
      take: 100
    });

    const matches = people.map(p => {
      const shared = [...skills, ...interests].filter(s =>
        [...p.skills, ...p.interests].some(x => x.toLowerCase() === String(s).toLowerCase())
      );
      const score = Math.min(
        98,
        Math.round(35 + shared.length * 12 + (category && p.industry?.toLowerCase().includes(String(category).toLowerCase()) ? 15 : 0))
      );
      return {
        user: p.user,
        score,
        explanation: shared.length
          ? `Shared skills or interests: ${shared.join(', ')}`
          : 'Potential match based on profile and role.'
      };
    }).sort((a, b) => b.score - a.score).slice(0, 10);

    res.json({ matches });
  } catch (err) {
    console.error('Matching preview error:', err);
    res.status(500).json({ error: 'Failed to compute matches' });
  }
});

// Admin overview endpoint
app.get('/api/admin/overview', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const [users, innovations, pending, reports] = await Promise.all([
      prisma.user.count(),
      prisma.innovation.count(),
      prisma.innovation.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'OPEN' } })
    ]);
    res.json({ users, innovations, pending, reports });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin stats' });
  }
});

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});
