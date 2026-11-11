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

    // 0. Ensure Comment.postId is nullable if table already existed from legacy schema
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "Comment" ALTER COLUMN "postId" DROP NOT NULL;');
    } catch {
      // Safe to ignore if table does not exist yet or column is already nullable
    }

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

    // 2. Seed Realistic Workman / Creators / Builders / Investors
    const sharedPasswordHash = await bcrypt.hash('DemoPass123!', 10);

    const talents = [
      {
        email: 'creator@idea2impact.example',
        name: 'Maya Chen',
        role: 'CREATOR',
        headline: 'Hardware & IoT Innovator · CleanTech Founder',
        bio: 'Passionate about environmental sensors, sustainability, and human-centered embedded hardware design.',
        skills: ['IoT', 'Hardware Design', 'Embedded C', 'Rapid Prototyping'],
        interests: ['Clean Water', 'Green Tech', 'Smart Cities'],
        industry: 'CleanTech',
        location: 'San Francisco, CA',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'marcus.vance@apexhorizons.example',
        name: 'Marcus Vance',
        role: 'INVESTOR',
        headline: 'Venture Partner @ Apex Horizons · Angel Investor',
        bio: 'Backing early-stage hardware, robotics, and climate resilience technologies across US and Europe. Deployed $4.2M in pre-seed & seed rounds.',
        skills: ['Seed Funding', 'Due Diligence', 'Series A', 'Cap Table Management'],
        interests: ['DeepTech', 'Robotics', 'Clean Energy', 'Agritech'],
        industry: 'Venture Capital',
        location: 'London, UK',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'devon.brooks@buildlab.example',
        name: 'Devon Brooks',
        role: 'BUILDER',
        headline: 'Principal Robotics Engineer & AI Systems Architect',
        bio: 'Over 8 years designing autonomous drone control stacks, bionic mechanics, and embedded edge vision. Open to co-founding deep-tech startups.',
        skills: ['ROS2', 'PyTorch', 'Embedded Linux', 'Computer Vision', 'CUDA'],
        interests: ['Autonomous Drones', 'Bionics', 'Wearable Tech'],
        industry: 'Robotics & AI',
        location: 'Austin, TX',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'aiko.tanaka@designcore.example',
        name: 'Aiko Tanaka',
        role: 'CREATOR',
        headline: 'Lead Industrial Designer & Ergonomics Specialist',
        bio: 'Specializing in sustainable consumer hardware, minimalist modular furniture, and human-first spatial computing accessories.',
        skills: ['SolidWorks', '3D Rendering', 'CMF Design', 'Sustainable Materials'],
        interests: ['Circular Design', 'Modular Tech', 'Smart Home'],
        industry: 'Product Design',
        location: 'Tokyo, Japan',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'elena.rostova@aerosolar.example',
        name: 'Elena Rostova',
        role: 'CREATOR',
        headline: 'Aerospace Engineer & Autonomous Solar Flight Pioneer',
        bio: 'Developing high-altitude continuous solar UAV platforms for wildfire detection and climate atmospheric modeling.',
        skills: ['Aerodynamics', 'Photovoltaics', 'Carbon Fiber', 'Autopilot PX4'],
        interests: ['Solar Energy', 'Climate Tech', 'Autonomous Flight'],
        industry: 'Aerospace',
        location: 'Munich, Germany',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'david.miller@millerip.example',
        name: 'David S. Miller, Esq.',
        role: 'PATENT_PROFESSIONAL',
        headline: 'Registered Patent Attorney · Tech IP & Licensing Strategist',
        bio: 'Advising inventors, university spin-outs and early-stage founders on provisional patents, freedom-to-operate opinions, and IP monetization.',
        skills: ['Patent Drafting', 'USPTO Filing', 'IP Licensing', 'Trade Secrets'],
        interests: ['Patent Law', 'Technology Transfer', 'Licensing Deals'],
        industry: 'Legal & IP',
        location: 'Washington, D.C.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
      }
    ];

    const userMap = {};
    for (const t of talents) {
      let u = await prisma.user.findUnique({ where: { email: t.email } });
      if (!u) {
        u = await prisma.user.create({
          data: {
            name: t.name,
            email: t.email,
            passwordHash: sharedPasswordHash,
            roles: { create: [{ role: t.role }] },
            profile: {
              create: {
                headline: t.headline,
                bio: t.bio,
                skills: t.skills,
                interests: t.interests,
                industry: t.industry,
                location: t.location,
                avatar: t.avatar
              }
            }
          }
        });
        console.log(`✓ Seeded workman: ${t.name} (${t.role})`);
      } else {
        // Update profile avatar & headline
        await prisma.profile.upsert({
          where: { userId: u.id },
          update: {
            headline: t.headline,
            bio: t.bio,
            skills: t.skills,
            avatar: t.avatar,
            location: t.location
          },
          create: {
            userId: u.id,
            headline: t.headline,
            bio: t.bio,
            skills: t.skills,
            avatar: t.avatar,
            location: t.location
          }
        });
      }
      userMap[t.email] = u;
    }

    // 3. Seed High-Caliber Innovations
    const inventionsCat = await prisma.category.findUnique({ where: { slug: 'inventions' } });
    const appsCat = await prisma.category.findUnique({ where: { slug: 'mobile-apps' } });
    const softwareCat = await prisma.category.findUnique({ where: { slug: 'software' } });
    const productsCat = await prisma.category.findUnique({ where: { slug: 'physical-products' } });

    const seedItems = [
      {
        title: 'AquaSense — Smart Water Monitor',
        description: 'A low-cost sensor concept that helps households spot leaks and understand daily water use with high precision. Integrates with mobile notifications and municipal water conservation goals.',
        categoryId: inventionsCat.id,
        creatorId: userMap['creator@idea2impact.example'].id,
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
        creatorId: userMap['creator@idea2impact.example'].id,
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
        creatorId: userMap['creator@idea2impact.example'].id,
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
        creatorId: userMap['aiko.tanaka@designcore.example'].id,
        price: 280,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'AeroGlide Solar Drone — Multi-Day Aerial Sentinel',
        description: 'Autonomous carbon-composite drone powered by 24% efficient perovskite-silicon tandem solar cells, delivering 72+ hours of non-stop flight for wildfire detection and ocean monitoring.',
        categoryId: inventionsCat.id,
        creatorId: userMap['elena.rostova@aerosolar.example'].id,
        price: 1250,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'NeuroGrip Haptic Bionic Hand',
        description: 'Sub-$800 3D-printed multi-articulating bionic prosthesis with embedded neural myoelectric sensors and tactile vibration feedback for amputees.',
        categoryId: productsCat.id,
        creatorId: userMap['devon.brooks@buildlab.example'].id,
        price: 790,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Klarity AI — Real-time Contract & IP Risk Scanner',
        description: 'Browser-based privacy-first AI assistant that scans commercial NDAs, licensing agreements, and assignment clauses in 5 seconds to highlight unfavorable terms.',
        categoryId: softwareCat.id,
        creatorId: userMap['david.miller@millerip.example'].id,
        price: 99,
        licensing: true,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      }
    ];

    for (const item of seedItems) {
      let existing = await prisma.innovation.findFirst({ where: { title: item.title } });
      if (!existing) {
        existing = await prisma.innovation.create({ data: item });
        console.log(`✓ Created idea: ${item.title}`);
      }

      // Add realistic discussion comments
      const commentCount = await prisma.comment.count({ where: { innovationId: existing.id } });
      if (commentCount <= 1) {
        if (item.title.includes('AeroGlide')) {
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['marcus.vance@apexhorizons.example'].id,
              body: 'Our fund is actively scouting persistent aerial monitoring tech. Would love to discuss a $250k seed tranche if prototype telemetry validates the 72-hour window.'
            }
          });
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['devon.brooks@buildlab.example'].id,
              body: 'The tandem solar cell integration looks sleek! What power management bus are you using for night glide phases?'
            }
          });
        } else if (item.title.includes('NeuroGrip')) {
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['david.miller@millerip.example'].id,
              body: 'Ensure you file the provisional patent on the tendon actuator design prior to public release demos. Excellent work.'
            }
          });
        } else if (item.title.includes('AquaSense')) {
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['marcus.vance@apexhorizons.example'].id,
              body: 'Huge market in municipal water conservation. Clean hardware execution!'
            }
          });
        }
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
