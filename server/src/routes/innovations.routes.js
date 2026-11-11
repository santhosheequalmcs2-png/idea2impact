import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

export const innovationsRouter = Router();

// GET /api/innovations - Browse, search, filter
innovationsRouter.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, category, sort = 'newest', creatorId } = req.query;

    const where = {
      visibility: 'PUBLIC',
      status: 'PUBLISHED'
    };

    // If viewing a specific creator
    if (creatorId) {
      if (creatorId === 'me' && req.user) {
        where.creatorId = req.user.id;
        delete where.visibility;
        delete where.status;
      } else if (creatorId !== 'me') {
        where.creatorId = String(creatorId);
      }
    }

    // Category filter
    if (category && category !== 'All') {
      const catSlug = String(category).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      where.category = {
        OR: [
          { slug: catSlug },
          { name: { equals: String(category), mode: 'insensitive' } }
        ]
      };
    }

    // Search query filter
    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { creator: { name: { contains: q, mode: 'insensitive' } } }
      ];
    }

    // Sorting
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc' || sort === 'Price: low to high') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_desc' || sort === 'Price: high to low') {
      orderBy = { price: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const rows = await prisma.innovation.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatar: true, headline: true } }
          }
        },
        category: true,
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            favourites: true
          }
        },
        ...(req.user ? {
          likes: { where: { userId: req.user.id }, select: { id: true } },
          favourites: { where: { userId: req.user.id }, select: { id: true } }
        } : {})
      },
      orderBy,
      take: 100
    });

    // If sorting by popular (most likes)
    let items = rows.map(item => ({
      id: item.id,
      title: item.title,
      desc: item.description,
      description: item.description,
      category: item.category?.name || 'General',
      categorySlug: item.category?.slug,
      price: item.price !== null ? Number(item.price) : 0,
      licensing: item.licensing,
      funding: item.funding,
      ownershipConfirmed: item.ownershipConfirmed,
      imageUrl: item.imageUrl || item.media?.[0]?.url || null,
      status: item.status,
      visibility: item.visibility,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      author: item.creator?.name || 'Anonymous',
      creator: item.creator,
      likeCount: item._count.likes,
      commentCount: item._count.comments,
      favouriteCount: item._count.favourites,
      isLiked: Boolean(req.user && item.likes && item.likes.length > 0),
      isSaved: Boolean(req.user && item.favourites && item.favourites.length > 0)
    }));

    if (sort === 'popular' || sort === 'Most Popular') {
      items.sort((a, b) => b.likeCount - a.likeCount);
    }

    res.json({ items });
  } catch (err) {
    console.error('Error fetching innovations:', err);
    res.status(500).json({ error: 'Failed to retrieve marketplace innovations' });
  }
});

// GET /api/innovations/:id - Single idea detail
innovationsRouter.get('/:id', optionalAuth, async (req, res) => {
  try {
    const item = await prisma.innovation.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profile: true
          }
        },
        category: true,
        media: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profile: { select: { avatar: true, headline: true } }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            favourites: true
          }
        },
        ...(req.user ? {
          likes: { where: { userId: req.user.id }, select: { id: true } },
          favourites: { where: { userId: req.user.id }, select: { id: true } }
        } : {})
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Innovation not found' });
    }

    // Check visibility permissions
    if (item.visibility !== 'PUBLIC') {
      const isOwner = req.user && req.user.id === item.creatorId;
      const isAdmin = req.user && req.user.roles?.includes('ADMIN');
      if (!isOwner && !isAdmin) {
        return res.status(404).json({ error: 'Innovation not found or private' });
      }
    }

    res.json({
      item: {
        id: item.id,
        title: item.title,
        desc: item.description,
        description: item.description,
        category: item.category?.name || 'General',
        categorySlug: item.category?.slug,
        categoryId: item.categoryId,
        price: item.price !== null ? Number(item.price) : 0,
        licensing: item.licensing,
        funding: item.funding,
        ownershipConfirmed: item.ownershipConfirmed,
        imageUrl: item.imageUrl || item.media?.[0]?.url || null,
        media: item.media,
        status: item.status,
        visibility: item.visibility,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        author: item.creator?.name || 'Anonymous',
        creator: item.creator,
        comments: item.comments.map(c => ({
          id: c.id,
          body: c.body,
          createdAt: c.createdAt,
          author: {
            id: c.author.id,
            name: c.author.name,
            avatar: c.author.profile?.avatar || null,
            headline: c.author.profile?.headline || null
          }
        })),
        likeCount: item._count.likes,
        commentCount: item._count.comments,
        favouriteCount: item._count.favourites,
        isLiked: Boolean(req.user && item.likes && item.likes.length > 0),
        isSaved: Boolean(req.user && item.favourites && item.favourites.length > 0)
      }
    });
  } catch (err) {
    console.error('Error fetching innovation detail:', err);
    res.status(500).json({ error: 'Failed to retrieve innovation details' });
  }
});

// POST /api/innovations - Publish new idea
innovationsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title max 120 characters'),
      description: z.string().trim().min(20, 'Description must be at least 20 characters').max(10000),
      categoryId: z.string().optional(),
      category: z.string().optional(),
      price: z.number().nonnegative().optional().default(0),
      licensing: z.boolean().optional().default(false),
      funding: z.boolean().optional().default(false),
      ownershipConfirmed: z.boolean().optional().default(true),
      imageUrl: z.string().optional().nullable(),
      visibility: z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']).default('PUBLIC')
    });

    const parsed = schema.parse(req.body);

    // Resolve categoryId
    let catId = parsed.categoryId;
    if (!catId && parsed.category) {
      const slug = parsed.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const cat = await prisma.category.findFirst({
        where: {
          OR: [
            { slug },
            { name: { equals: parsed.category, mode: 'insensitive' } }
          ]
        }
      });
      if (cat) catId = cat.id;
    }

    // Default to first category if none provided
    if (!catId) {
      const firstCat = await prisma.category.findFirst({ orderBy: { name: 'asc' } });
      catId = firstCat?.id;
    }

    if (!catId) {
      return res.status(400).json({ error: 'Valid category is required' });
    }

    const created = await prisma.innovation.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        categoryId: catId,
        creatorId: req.user.id,
        price: parsed.price,
        licensing: parsed.licensing,
        funding: parsed.funding,
        ownershipConfirmed: parsed.ownershipConfirmed,
        imageUrl: parsed.imageUrl,
        visibility: parsed.visibility,
        status: 'PUBLISHED'
      },
      include: {
        creator: { select: { id: true, name: true } },
        category: true
      }
    });

    res.status(201).json({
      item: {
        id: created.id,
        title: created.title,
        desc: created.description,
        description: created.description,
        category: created.category?.name || 'General',
        price: Number(created.price || 0),
        author: created.creator?.name || 'You',
        imageUrl: created.imageUrl,
        visibility: created.visibility,
        createdAt: created.createdAt,
        likeCount: 0,
        commentCount: 0
      },
      message: 'Innovation published successfully!'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid innovation submission' });
    }
    console.error('Error creating innovation:', err);
    res.status(500).json({ error: 'Failed to publish innovation' });
  }
});

// PUT /api/innovations/:id - Edit own idea
innovationsRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.innovation.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Innovation not found' });
    }

    const isOwner = existing.creatorId === req.user.id;
    const isAdmin = req.user.roles?.includes('ADMIN') || req.user.roles?.includes('Admin');
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only edit your own innovations' });
    }

    const schema = z.object({
      title: z.string().trim().min(3).max(120).optional(),
      description: z.string().trim().min(20).max(10000).optional(),
      categoryId: z.string().optional(),
      category: z.string().optional(),
      price: z.number().nonnegative().optional(),
      licensing: z.boolean().optional(),
      funding: z.boolean().optional(),
      imageUrl: z.string().optional().nullable(),
      visibility: z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']).optional()
    });

    const parsed = schema.parse(req.body);

    let catId = parsed.categoryId;
    if (!catId && parsed.category) {
      const slug = parsed.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const cat = await prisma.category.findFirst({
        where: {
          OR: [
            { slug },
            { name: { equals: parsed.category, mode: 'insensitive' } }
          ]
        }
      });
      if (cat) catId = cat.id;
    }

    const updateData = {};
    if (parsed.title) updateData.title = parsed.title;
    if (parsed.description) updateData.description = parsed.description;
    if (catId) updateData.categoryId = catId;
    if (parsed.price !== undefined) updateData.price = parsed.price;
    if (parsed.licensing !== undefined) updateData.licensing = parsed.licensing;
    if (parsed.funding !== undefined) updateData.funding = parsed.funding;
    if (parsed.imageUrl !== undefined) updateData.imageUrl = parsed.imageUrl;
    if (parsed.visibility) updateData.visibility = parsed.visibility;

    const updated = await prisma.innovation.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        category: true,
        creator: { select: { id: true, name: true } }
      }
    });

    res.json({
      item: {
        id: updated.id,
        title: updated.title,
        desc: updated.description,
        description: updated.description,
        category: updated.category?.name,
        price: Number(updated.price || 0),
        imageUrl: updated.imageUrl,
        visibility: updated.visibility,
        author: updated.creator?.name
      },
      message: 'Innovation updated successfully'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid update data' });
    }
    console.error('Error updating innovation:', err);
    res.status(500).json({ error: 'Failed to update innovation' });
  }
});

// DELETE /api/innovations/:id - Delete own idea
innovationsRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.innovation.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Innovation not found' });
    }

    const isOwner = existing.creatorId === req.user.id;
    const isAdmin = req.user.roles?.includes('ADMIN') || req.user.roles?.includes('Admin');
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own innovations' });
    }

    await prisma.innovation.delete({
      where: { id: req.params.id }
    });

    res.json({ ok: true, message: 'Innovation deleted permanently' });
  } catch (err) {
    console.error('Error deleting innovation:', err);
    res.status(500).json({ error: 'Failed to delete innovation' });
  }
});

// POST /api/innovations/:id/like - Toggle like
innovationsRouter.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const innovationId = req.params.id;

    const innovation = await prisma.innovation.findUnique({
      where: { id: innovationId }
    });
    if (!innovation) {
      return res.status(404).json({ error: 'Innovation not found' });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_innovationId: {
          userId: req.user.id,
          innovationId
        }
      }
    });

    let liked = false;
    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      liked = false;
    } else {
      await prisma.like.create({
        data: {
          userId: req.user.id,
          innovationId
        }
      });
      liked = true;
    }

    const likeCount = await prisma.like.count({
      where: { innovationId }
    });

    res.json({ liked, likeCount });
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: 'Failed to update like status' });
  }
});

// POST /api/innovations/:id/save - Toggle bookmark / favourite
innovationsRouter.post('/:id/save', requireAuth, async (req, res) => {
  try {
    const innovationId = req.params.id;

    const innovation = await prisma.innovation.findUnique({
      where: { id: innovationId }
    });
    if (!innovation) {
      return res.status(404).json({ error: 'Innovation not found' });
    }

    const existing = await prisma.favourite.findUnique({
      where: {
        userId_innovationId: {
          userId: req.user.id,
          innovationId
        }
      }
    });

    let saved = false;
    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      saved = false;
    } else {
      await prisma.favourite.create({
        data: {
          userId: req.user.id,
          innovationId
        }
      });
      saved = true;
    }

    const saveCount = await prisma.favourite.count({ where: { innovationId } });

    res.json({ saved, saveCount });
  } catch (err) {
    console.error('Error toggling bookmark:', err);
    res.status(500).json({ error: 'Failed to save innovation' });
  }
});

// GET /api/innovations/:id/comments - Fetch comments
innovationsRouter.get('/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { innovationId: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatar: true, headline: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      comments: comments.map(c => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        author: {
          id: c.author.id,
          name: c.author.name,
          avatar: c.author.profile?.avatar || null,
          headline: c.author.profile?.headline || null
        }
      }))
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// POST /api/innovations/:id/comments - Add comment
innovationsRouter.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      body: z.string().trim().min(1, 'Comment cannot be empty').max(2000, 'Comment max 2000 characters')
    });

    const parsed = schema.parse(req.body);

    const innovation = await prisma.innovation.findUnique({
      where: { id: req.params.id }
    });
    if (!innovation) {
      return res.status(404).json({ error: 'Innovation not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        innovationId: req.params.id,
        authorId: req.user.id,
        body: parsed.body
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatar: true, headline: true } }
          }
        }
      }
    });

    res.status(201).json({
      comment: {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        author: {
          id: comment.author.id,
          name: comment.author.name,
          avatar: comment.author.profile?.avatar || null,
          headline: comment.author.profile?.headline || null
        }
      },
      message: 'Comment posted'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || 'Invalid comment' });
    }
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// DELETE /api/innovations/:id/comments/:commentId - Delete comment
innovationsRouter.delete('/:id/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.commentId },
      include: { innovation: true }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const isCommentAuthor = comment.authorId === req.user.id;
    const isInnovationOwner = comment.innovation?.creatorId === req.user.id;
    const isAdmin = req.user.roles?.includes('ADMIN') || req.user.roles?.includes('Admin');

    if (!isCommentAuthor && !isInnovationOwner && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied to delete this comment' });
    }

    await prisma.comment.delete({
      where: { id: req.params.commentId }
    });

    res.json({ ok: true, message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});
