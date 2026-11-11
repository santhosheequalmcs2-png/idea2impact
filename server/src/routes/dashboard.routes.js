import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRouter = Router();

// GET /api/dashboard/stats
dashboardRouter.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get innovations by this user
    const userInnovations = await prisma.innovation.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        title: true,
        price: true,
        category: { select: { name: true } },
        createdAt: true,
        visibility: true,
        status: true,
        imageUrl: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            favourites: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const innovationIds = userInnovations.map(x => x.id);

    // Total likes and comments received
    const totalLikesReceived = userInnovations.reduce((sum, item) => sum + item._count.likes, 0);
    const totalCommentsReceived = userInnovations.reduce((sum, item) => sum + item._count.comments, 0);

    // Total saved by this user
    const savedCount = await prisma.favourite.count({
      where: { userId }
    });

    // Recent comments on user's innovations
    const recentComments = innovationIds.length > 0 ? await prisma.comment.findMany({
      where: { innovationId: { in: innovationIds } },
      include: {
        author: { select: { id: true, name: true, profile: { select: { avatar: true } } } },
        innovation: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    }) : [];

    // Recent likes on user's innovations
    const recentLikes = innovationIds.length > 0 ? await prisma.like.findMany({
      where: { innovationId: { in: innovationIds } },
      include: {
        user: { select: { id: true, name: true } },
        innovation: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    }) : [];

    res.json({
      stats: {
        myInnovationsCount: userInnovations.length,
        savedCount,
        totalLikesReceived,
        totalCommentsReceived,
        profileStrength: 85
      },
      recentInnovations: userInnovations.slice(0, 5),
      recentActivity: [
        ...recentComments.map(c => ({
          type: 'comment',
          id: c.id,
          createdAt: c.createdAt,
          message: `${c.author.name} commented on "${c.innovation.title}": "${c.body.slice(0, 60)}${c.body.length > 60 ? '...' : ''}"`
        })),
        ...recentLikes.map(l => ({
          type: 'like',
          id: l.id,
          createdAt: l.createdAt,
          message: `${l.user.name} liked your innovation "${l.innovation.title}"`
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8)
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard statistics' });
  }
});

// GET /api/dashboard/my-innovations
dashboardRouter.get('/my-innovations', requireAuth, async (req, res) => {
  try {
    const items = await prisma.innovation.findMany({
      where: { creatorId: req.user.id },
      include: {
        category: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            favourites: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        desc: item.description,
        description: item.description,
        category: item.category?.name || 'General',
        categoryId: item.categoryId,
        price: item.price !== null ? Number(item.price) : 0,
        licensing: item.licensing,
        funding: item.funding,
        imageUrl: item.imageUrl,
        visibility: item.visibility,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        author: req.user.name || 'You',
        likeCount: item._count.likes,
        commentCount: item._count.comments,
        favouriteCount: item._count.favourites
      }))
    });
  } catch (err) {
    console.error('Error fetching user innovations:', err);
    res.status(500).json({ error: 'Failed to retrieve your innovations' });
  }
});

// GET /api/dashboard/saved
dashboardRouter.get('/saved', requireAuth, async (req, res) => {
  try {
    const saved = await prisma.favourite.findMany({
      where: { userId: req.user.id },
      include: {
        innovation: {
          include: {
            category: true,
            creator: { select: { id: true, name: true } },
            _count: { select: { likes: true, comments: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      items: saved.map(s => ({
        id: s.innovation.id,
        title: s.innovation.title,
        desc: s.innovation.description,
        description: s.innovation.description,
        category: s.innovation.category?.name || 'General',
        price: s.innovation.price !== null ? Number(s.innovation.price) : 0,
        author: s.innovation.creator?.name || 'Creator',
        imageUrl: s.innovation.imageUrl,
        savedAt: s.createdAt,
        likeCount: s.innovation._count.likes,
        commentCount: s.innovation._count.comments,
        isSaved: true
      }))
    });
  } catch (err) {
    console.error('Error fetching saved innovations:', err);
    res.status(500).json({ error: 'Failed to retrieve saved opportunities' });
  }
});


// GET /api/dashboard/proposals - Incoming offers/proposals for creator
dashboardRouter.get('/proposals', requireAuth, async (req, res) => {
  try {
    const proposals = await prisma.collaborationRequest.findMany({
      where: { recipientId: req.user.id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatar: true, headline: true, location: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      proposals: proposals.map(p => ({
        id: p.id,
        status: p.status,
        message: p.message,
        createdAt: p.createdAt,
        sender: {
          id: p.requester.id,
          name: p.requester.name,
          email: p.requester.email,
          headline: p.requester.profile?.headline || 'Innovator',
          location: p.requester.profile?.location || 'Remote',
          avatar: p.requester.profile?.avatar || null
        }
      }))
    });
  } catch (err) {
    console.error('Error fetching proposals:', err);
    res.status(500).json({ error: 'Failed to retrieve collaboration proposals' });
  }
});
