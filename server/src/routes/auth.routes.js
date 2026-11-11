import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'idea2impact-jwt-secret-fallback-key-2026';

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login or registration attempts. Please try again later.' }
});

const cookieOpts = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 864e5
};

const roleMap = {
  'Creator': 'CREATOR',
  'Customer / Buyer': 'BUYER',
  'Company': 'COMPANY',
  'Investor': 'INVESTOR',
  'Builder': 'BUILDER',
  'Patent Professional': 'PATENT_PROFESSIONAL'
};

const reverseRoleMap = {
  'CREATOR': 'Creator',
  'BUYER': 'Customer / Buyer',
  'COMPANY': 'Company',
  'INVESTOR': 'Investor',
  'BUILDER': 'Builder',
  'PATENT_PROFESSIONAL': 'Patent Professional',
  'ADMIN': 'Admin'
};

authRouter.post('/register', authLimit, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
      email: z.string().trim().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters').max(100),
      role: z.enum(['Creator', 'Customer / Buyer', 'Company', 'Investor', 'Builder', 'Patent Professional']).default('Creator')
    });

    const parsed = schema.parse(req.body);
    const email = parsed.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 12);
    const mappedRole = roleMap[parsed.role] || 'CREATOR';

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email,
        passwordHash,
        roles: {
          create: [{ role: mappedRole }]
        },
        profile: {
          create: {
            headline: `${parsed.role} on IDEA2IMPACT`,
            bio: '',
            skills: [],
            interests: []
          }
        }
      },
      include: {
        roles: true,
        profile: true
      }
    });

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map(r => reverseRoleMap[r.role] || r.role)
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('session', token, cookieOpts).status(201).json({
      user: {
        ...payload,
        profile: user.profile
      },
      token,
      message: 'Account created successfully'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid registration details' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Unable to complete registration. Please try again.' });
  }
});

authRouter.post('/login', authLimit, async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().trim().email('Please enter a valid email'),
      password: z.string().min(1, 'Please enter your password')
    });

    const parsed = schema.parse(req.body);
    const email = parsed.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
        profile: true
      }
    });

    if (!user || !user.passwordHash || !(await bcrypt.compare(parsed.password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.suspended) {
      return res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map(r => reverseRoleMap[r.role] || r.role)
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('session', token, cookieOpts).json({
      user: {
        ...payload,
        profile: user.profile
      },
      token,
      message: 'Login successful'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid login details' });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to log in. Please try again.' });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('session', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  }).json({ ok: true, message: 'Logged out successfully' });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        roles: true,
        profile: true,
        _count: {
          select: {
            innovations: true,
            favourites: true,
            likes: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map(r => reverseRoleMap[r.role] || r.role),
      profile: user.profile || null,
      stats: {
        innovationsCount: user._count.innovations,
        savedCount: user._count.favourites,
        likesCount: user._count.likes
      }
    };

    res.json({ user: payload });
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

authRouter.put('/profile', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().trim().min(2).max(80).optional(),
      headline: z.string().max(160).optional(),
      bio: z.string().max(2000).optional(),
      skills: z.array(z.string().trim().min(1)).max(30).optional(),
      interests: z.array(z.string().trim().min(1)).max(30).optional(),
      industry: z.string().max(80).optional(),
      location: z.string().max(80).optional(),
      avatar: z.string().url().or(z.string().startsWith('/uploads')).or(z.string().startsWith('data:image')).optional().nullable()
    });

    const parsed = schema.parse(req.body);

    if (parsed.name) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { name: parsed.name }
      });
    }

    const profileData = {
      headline: parsed.headline,
      bio: parsed.bio,
      skills: parsed.skills,
      interests: parsed.interests,
      industry: parsed.industry,
      location: parsed.location,
      avatar: parsed.avatar
    };

    // Filter undefined
    Object.keys(profileData).forEach(k => profileData[k] === undefined && delete profileData[k]);

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      update: profileData,
      create: {
        userId: req.user.id,
        ...profileData
      }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { roles: true, profile: true }
    });

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        roles: updatedUser.roles.map(r => reverseRoleMap[r.role] || r.role),
        profile: updatedUser.profile
      },
      message: 'Profile updated successfully'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid profile details' });
    }
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Public profile viewer
authRouter.get('/users/:id/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        roles: { select: { role: true } },
        profile: true,
        innovations: {
          where: { visibility: 'PUBLIC', status: 'PUBLISHED' },
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            price: true,
            createdAt: true,
            category: { select: { name: true, slug: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        joinedAt: user.createdAt,
        roles: user.roles.map(r => reverseRoleMap[r.role] || r.role),
        profile: user.profile,
        innovations: user.innovations
      }
    });
  } catch (err) {
    console.error('Error fetching public user profile:', err);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});
