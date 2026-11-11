import { Router } from 'express';
import { prisma } from '../prisma.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            innovations: {
              where: {
                visibility: 'PUBLIC',
                status: 'PUBLISHED'
              }
            }
          }
        }
      }
    });

    const items = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat._count.innovations
    }));

    res.json({ categories: items });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});
