import { Router } from 'express';
import { prisma } from '../prisma.js';

export const talentsRouter = Router();

talentsRouter.get('/', async (req, res) => {
  try {
    const { role, skill } = req.query;

    const where = {};
    if (role && role !== 'All') {
      const roleMap = {
        'Creator': 'CREATOR',
        'Builder': 'BUILDER',
        'Investor': 'INVESTOR',
        'Patent Professional': 'PATENT_PROFESSIONAL',
        'Company': 'COMPANY'
      };
      const dbRole = roleMap[role] || role.toUpperCase();
      where.roles = { some: { role: dbRole } };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        createdAt: true,
        roles: { select: { role: true } },
        profile: true,
        _count: {
          select: {
            innovations: { where: { status: 'PUBLISHED', visibility: 'PUBLIC' } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const reverseRoleMap = {
      'CREATOR': 'Creator',
      'BUILDER': 'Builder',
      'INVESTOR': 'Investor',
      'PATENT_PROFESSIONAL': 'Patent Professional',
      'COMPANY': 'Company',
      'BUYER': 'Customer / Buyer',
      'ADMIN': 'Admin'
    };

    let talents = users.map(u => ({
      id: u.id,
      name: u.name,
      role: reverseRoleMap[u.roles[0]?.role] || 'Creator',
      roles: u.roles.map(r => reverseRoleMap[r.role] || r.role),
      headline: u.profile?.headline || 'Innovator on IDEA2IMPACT',
      bio: u.profile?.bio || '',
      skills: u.profile?.skills || [],
      location: u.profile?.location || 'Remote',
      avatar: u.profile?.avatar || null,
      projectsCount: u._count.innovations
    }));

    if (skill && String(skill).trim()) {
      const s = String(skill).toLowerCase();
      talents = talents.filter(t => t.skills.some(x => x.toLowerCase().includes(s)));
    }

    res.json({ talents });
  } catch (err) {
    console.error('Error fetching talents:', err);
    res.status(500).json({ error: 'Failed to retrieve talent directory' });
  }
});
