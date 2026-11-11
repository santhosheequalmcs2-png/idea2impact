import { PrismaClient } from '../src/generated/client/index.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !dbUrl.includes('connect_timeout')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connect_timeout=30';
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl }
  }
});

export async function setupDatabase() {
  console.log('--- Initializing database schema & seed ---');

  try {
    await prisma.$connect();
    console.log('Connected to database successfully.');

    // 0. Ensure Comment.postId is nullable so comments can be on innovations
    await prisma.$executeRawUnsafe('ALTER TABLE "Comment" ALTER COLUMN "postId" DROP NOT NULL;');

    // 1. Seed Categories
    const categoriesData = [
      { name: 'Ideas', slug: 'ideas' },
      { name: 'Inventions', slug: 'inventions' },
      { name: 'Physical Products', slug: 'physical-products' },
      { name: 'Websites', slug: 'websites' },
      { name: 'Mobile Apps', slug: 'mobile-apps' },
      { name: 'Games', slug: 'games' },
      { name: 'Software', slug: 'software' },
      { name: 'Creative Designs', slug: 'creative-designs' }
    ];

    for (const cat of categoriesData) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: { name: cat.name, slug: cat.slug }
      });
    }
    console.log(`✓ Seeded ${categoriesData.length} categories.`);

    // 2. Ensure a default creator user exists
    const demoEmail = 'creator@idea2impact.example';
    let demoUser = await prisma.user.findUnique({
      where: { email: demoEmail }
    });

    if (!demoUser) {
      const passwordHash = await bcrypt.hash('CreatorPass123!', 10);
      demoUser = await prisma.user.create({
        data: {
          name: 'Maya Chen',
          email: demoEmail,
          passwordHash,
          roles: {
            create: [{ role: 'CREATOR' }]
          },
          profile: {
            create: {
              headline: 'Hardware & IoT Innovator',
              bio: 'Passionate about environmental sensors, sustainability, and human-centered design.',
              skills: ['IoT', 'Hardware Design', 'Embedded C', 'Rapid Prototyping'],
              interests: ['Clean Water', 'Green Tech', 'Smart Cities'],
              industry: 'CleanTech',
              location: 'San Francisco, CA'
            }
          }
        }
      });
      console.log('✓ Created demo creator account: Maya Chen (creator@idea2impact.example)');
    }

    // 3. Seed initial innovations
    const inventionsCat = await prisma.category.findUnique({ where: { slug: 'inventions' } });
    const appsCat = await prisma.category.findUnique({ where: { slug: 'mobile-apps' } });
    const softwareCat = await prisma.category.findUnique({ where: { slug: 'software' } });
    const productsCat = await prisma.category.findUnique({ where: { slug: 'physical-products' } });

    const seedItems = [
      {
        title: 'AquaSense — Smart Water Monitor',
        description: 'A low-cost sensor concept that helps households spot leaks and understand daily water use with high precision. Integrates with mobile notifications and municipal water conservation goals.',
        categoryId: inventionsCat.id,
        creatorId: demoUser.id,
        price: 120,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'LocalLoop Community Marketplace',
        description: 'A neighbourhood-first mobile application connecting independent makers with nearby customers for on-demand local pickups and hyper-local delivery.',
        categoryId: appsCat.id,
        creatorId: demoUser.id,
        price: 0,
        licensing: false,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'FormFlow — No-code Form Builder',
        description: 'A lightweight workflow tool that turns complex intake forms and multi-step applications into simple, friendly conversations.',
        categoryId: softwareCat.id,
        creatorId: demoUser.id,
        price: 49,
        licensing: true,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'ModuNest Furniture System',
        description: 'Flat-pack modular furniture engineered for compact urban living spaces. Easily disassembled, expanded, and customized without tools.',
        categoryId: productsCat.id,
        creatorId: demoUser.id,
        price: 280,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
      }
    ];

    for (const item of seedItems) {
      let existing = await prisma.innovation.findFirst({ where: { title: item.title } });
      if (!existing) {
        existing = await prisma.innovation.create({ data: item });
        console.log(`✓ Created idea: ${item.title}`);
      }
      
      const commentCount = await prisma.comment.count({ where: { innovationId: existing.id } });
      if (commentCount === 0) {
        await prisma.comment.create({
          data: {
            innovationId: existing.id,
            authorId: demoUser.id,
            body: 'Excited to share this project with the IDEA2IMPACT community! Open to collaboration and feedback.'
          }
        });
        console.log(`✓ Added initial comment for: ${item.title}`);
      }
    }

    const allInnovations = await prisma.innovation.findMany({
      select: { id: true, title: true, status: true, _count: { select: { comments: true, likes: true } } }
    });
    console.log('All innovations in DB:', allInnovations);

    console.log('--- Database setup complete! ---');
  } catch (err) {
    console.error('Database setup error:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith('db-setup.js')) {
  setupDatabase().catch(() => process.exit(1));
}
