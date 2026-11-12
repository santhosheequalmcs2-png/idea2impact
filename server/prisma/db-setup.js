import { PrismaClient } from '../src/generated/client/index.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
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

    const catList = await prisma.category.findMany();
    const catMap = {};
    catList.forEach(c => { catMap[c.slug] = c.id; });

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
      },
      {
        email: 'dr.thorne@biogenome.example',
        name: 'Dr. Aris Thorne',
        role: 'CREATOR',
        headline: 'Lead Bioinformatician & Synthetic Genomics Pioneer',
        bio: 'Translating CRISPR gene circuits and rapid enzymatic biosensors into decentralized clinical diagnostics.',
        skills: ['CRISPR', 'Synthetic Biology', 'Microfluidics', 'Bioinformatics'],
        interests: ['Preventative Medicine', 'Point-of-Care Diagnostics', 'Biotech'],
        industry: 'Biotechnology',
        location: 'Boston, MA',
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'priya.sharma@agritech.example',
        name: 'Priya Sharma',
        role: 'CREATOR',
        headline: 'AgriTech Systems Engineer & Soil Climate Architect',
        bio: 'Building autonomous subsurface soil spectrometers and closed-loop solar desalination vertical farming pods.',
        skills: ['Soil Chemistry', 'IoT Sensors', 'Closed-loop Hydroponics', 'Embedded Hardware'],
        interests: ['Sustainable Agriculture', 'Water Conservation', 'Precision Farming'],
        industry: 'AgriTech',
        location: 'Bengaluru, India',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'lucas.moreau@spatialhaptics.example',
        name: 'Lucas Moreau',
        role: 'BUILDER',
        headline: 'Acoustic Ultrasound Engineer & Spatial Haptics Specialist',
        bio: 'Pioneering mid-air tactile wave-focusing transducers for immersive AR spatial computing and surgical simulations.',
        skills: ['Ultrasound Phased Arrays', 'DSP', 'C++', 'Spatial Audio', 'Haptics'],
        interests: ['Spatial Computing', 'Virtual Reality', 'Biomechanics'],
        industry: 'Hardware & VR',
        location: 'Paris, France',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
      },
      {
        email: 'zoe.kalu@defitrust.example',
        name: 'Zoe Kalu',
        role: 'BUILDER',
        headline: 'Zero-Knowledge Cryptographer & Distributed Systems Architect',
        bio: 'Focused on trustless verification protocols, cryptographic proof-of-competence, and decentralized trade finance networks.',
        skills: ['zk-SNARKs', 'Rust', 'Distributed Systems', 'Cryptography'],
        interests: ['Decentralized Identity', 'Financial Inclusion', 'Open Source'],
        industry: 'FinTech & Crypto',
        location: 'Nairobi, Kenya',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80'
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

    // 3. Seed 40 High-Caliber Innovations Across All 8 Categories (5 per category)
    const seedItems = [
      // ==========================================
      // CATEGORY 1: IDEAS (5 items)
      // ==========================================
      {
        title: 'AquaMesh — Atmospheric Fog & Humidity Water Harvester',
        description: 'Passive biomimetic mesh capturing 15L of potable water daily in arid coastal zones with zero electricity. Inspired by the Namib Desert beetle\'s hydrophilic-hydrophobic microstructures.',
        categoryId: catMap['ideas'],
        creatorId: userMap['priya.sharma@agritech.example'].id,
        price: 0,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'DirectAir — Solar Solid-State CO2 Mineralization Matrix',
        description: 'A modular architectural building-cladding filter that binds ambient carbon dioxide into harmless calcium carbonate minerals using ambient humidity and passive solar thermal convection.',
        categoryId: catMap['ideas'],
        creatorId: userMap['creator@idea2impact.example'].id,
        price: 0,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'DecentralGrid — P2P Renewable Microgrid Exchange Protocol',
        description: 'Open protocol design allowing residential solar battery owners to trade kilowatt-hours locally with neighbours via ultra-low latency cryptographic state channels.',
        categoryId: catMap['ideas'],
        creatorId: userMap['zoe.kalu@defitrust.example'].id,
        price: 0,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'MycoFeed — Fungal Protein Bioconversion System',
        description: 'Converts organic agricultural byproduct streams into high-nutrient mycoprotein feedstock using oyster mushroom mycelium strains, cutting animal feed emissions by 80%.',
        categoryId: catMap['ideas'],
        creatorId: userMap['dr.thorne@biogenome.example'].id,
        price: 150,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1546842931-886c185b4c8c?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'OceanPlast — Enzymatic Biodegradation River Trap',
        description: 'Self-anchored floating river booms utilizing engineered bacterial PETases to depolymerize plastic waste into non-toxic terephthalic acid before reaching open oceans.',
        categoryId: catMap['ideas'],
        creatorId: userMap['creator@idea2impact.example'].id,
        price: 0,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'
      },

      // ==========================================
      // CATEGORY 2: INVENTIONS (5 items)
      // ==========================================
      {
        title: 'AquaSense — Smart Water Monitor',
        description: 'A low-cost sensor concept that helps households spot micro-leaks and understand daily water use with high precision. Integrates with mobile notifications and municipal water conservation goals.',
        categoryId: catMap['inventions'],
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
        title: 'AeroGlide Solar Drone — Multi-Day Aerial Sentinel',
        description: 'Autonomous carbon-composite drone powered by 24% efficient perovskite-silicon tandem solar cells, delivering 72+ hours of non-stop flight for wildfire detection and ocean monitoring.',
        categoryId: catMap['inventions'],
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
        title: 'ThermaHarvest — Industrial Waste-Heat Thermoelectric Generator',
        description: 'Solid-state bismuth-telluride thermoelectric generator capturing factory exhaust heat (150-450°C) and converting it to electricity with a 3-year commercial payback period.',
        categoryId: catMap['inventions'],
        creatorId: userMap['creator@idea2impact.example'].id,
        price: 450,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'VoltaTile — Kinetic Footstep Energy Harvesting Pavers',
        description: 'Piezoelectric-electromagnetic hybrid floor tiles for high-traffic train stations and airports generating up to 7 Joules per footstep to power local emergency lighting and beacons.',
        categoryId: catMap['inventions'],
        creatorId: userMap['devon.brooks@buildlab.example'].id,
        price: 195,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'CanopyEye — Autonomous Tree-Planting Drone Swarm',
        description: 'Autonomous lidar-guided drone swarm planting pre-germinated seed pods in deforested terrains with 85% germination success, planting up to 40,000 trees per day.',
        categoryId: catMap['inventions'],
        creatorId: userMap['elena.rostova@aerosolar.example'].id,
        price: 890,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80'
      },

      // ==========================================
      // CATEGORY 3: PHYSICAL PRODUCTS (5 items)
      // ==========================================
      {
        title: 'ModuNest Furniture System',
        description: 'Flat-pack modular furniture engineered for compact urban living spaces. Easily disassembled, expanded, and customized without tools using precision magnetic snap-joints.',
        categoryId: catMap['physical-products'],
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
        title: 'NeuroGrip Haptic Bionic Hand',
        description: 'Sub-$800 3D-printed multi-articulating bionic prosthesis with embedded neural myoelectric sensors and tactile vibration feedback for amputees.',
        categoryId: catMap['physical-products'],
        creatorId: userMap['devon.brooks@buildlab.example'].id,
        price: 790,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'BioLoom — Algae-Based Carbon Capture Façade Panels',
        description: 'Architectural double-glazed exterior glass panels circulating chlorella microalgae to absorb indoor building CO2 while providing biophilic shade and biomass insulation.',
        categoryId: catMap['physical-products'],
        creatorId: userMap['aiko.tanaka@designcore.example'].id,
        price: 340,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'CobotGrip — Soft-Pneumatic Tactile End-Effector',
        description: 'Food-safe silicone soft-robotics gripper with embedded micro-pressure sensors for handling delicate produce and fragile biological samples without bruising.',
        categoryId: catMap['physical-products'],
        creatorId: userMap['devon.brooks@buildlab.example'].id,
        price: 520,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'HydroPod — Solar Closed-Loop Desalination Greenhouse',
        description: 'Compact modular greenhouse utilizing passive solar thermal evaporation to desalinate saline groundwater for organic hydroponic produce in desert communities.',
        categoryId: catMap['physical-products'],
        creatorId: userMap['priya.sharma@agritech.example'].id,
        price: 1100,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80'
      },

      // ==========================================
      // CATEGORY 4: WEBSITES (5 items)
      // ==========================================
      {
        title: 'OpenPatent — Crowdsourced Prior-Art Invalidation Exchange',
        description: 'Global collaborative web platform incentivizing patent researchers and engineers with bounty pools to unearth prior art against predatory patent trolls.',
        categoryId: catMap['websites'],
        creatorId: userMap['david.miller@millerip.example'].id,
        price: 0,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'ReClaim — Circular Economy Industrial Surplus Marketplace',
        description: 'B2B web exchange connecting manufacturing plants with circular upcyclers to divert scrap metals, chemicals, and industrial polymers from landfills.',
        categoryId: catMap['websites'],
        creatorId: userMap['creator@idea2impact.example'].id,
        price: 75,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'SoundForge — Procedural Ambient Audio Synthesizer',
        description: 'Browser-based WebAudio DSP synthesizer generating infinite dynamic, royalty-free soundscapes tailored for focus workspaces, podcasts, and game designers.',
        categoryId: catMap['websites'],
        creatorId: userMap['lucas.moreau@spatialhaptics.example'].id,
        price: 35,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'VentureTAM — AI Market Size & Competitive Density Modeler',
        description: 'Interactive web analytics platform empowering hardware and deep-tech founders to compute bottom-up Total Addressable Market (TAM) with verified patent graphs.',
        categoryId: catMap['websites'],
        creatorId: userMap['marcus.vance@apexhorizons.example'].id,
        price: 85,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'SkillLink — Collaborative Scientific Equipment Sharing Portal',
        description: 'Academic equipment booking network connecting private biomedical startups with idle university electron microscopes, sequencers, and mass spectrometers.',
        categoryId: catMap['websites'],
        creatorId: userMap['dr.thorne@biogenome.example'].id,
        price: 40,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80'
      },

      // ==========================================
      // CATEGORY 5: MOBILE APPS (5 items)
      // ==========================================
      {
        title: 'LocalLoop Community Marketplace',
        description: 'A neighbourhood-first mobile application connecting independent makers with nearby customers for on-demand local pickups and hyper-local delivery.',
        categoryId: catMap['mobile-apps'],
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
        title: 'VitalPatch — 14-Day Biodegradable Cardiac Telemetry App & Patch',
        description: 'Ultra-thin chest patch made from biodegradable silk fibroin paired with a mobile telemetry app for continuous ECG, arrhythmia detection, and doctor alerts.',
        categoryId: catMap['mobile-apps'],
        creatorId: userMap['dr.thorne@biogenome.example'].id,
        price: 45,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'KindredKit — Hyper-Local Emergency Preparedness Network',
        description: 'Mesh-networking offline mobile application that organizes neighborhood disaster supplies, CPR responders, and rescue coordination without cellular towers.',
        categoryId: catMap['mobile-apps'],
        creatorId: userMap['zoe.kalu@defitrust.example'].id,
        price: 0,
        licensing: false,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'SkillBridge — Apprentice-to-Master Micro-Mentorship App',
        description: 'Micro-coaching mobile platform pairing early-career tradespeople and technicians with retired master craftspeople for asynchronous video review and advice.',
        categoryId: catMap['mobile-apps'],
        creatorId: userMap['devon.brooks@buildlab.example'].id,
        price: 29,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'PantryZero — Computer Vision Food Expiration & Recipe Planner',
        description: 'Mobile kitchen assistant that scans grocery receipts and fridge shelves to generate zero-waste chef recipes before ingredients spoil.',
        categoryId: catMap['mobile-apps'],
        creatorId: userMap['priya.sharma@agritech.example'].id,
        price: 19,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
      },

      // ==========================================
      // CATEGORY 6: GAMES (5 items)
      // ==========================================
      {
        title: 'Chronos: Echoes of Carthage — Historical Tactical RPG',
        description: 'Isometric turn-based tactical strategy game set during the Punic Wars with authentic Hellenistic engineering, siege mechanics, and tactical dilemmas.',
        categoryId: catMap['games'],
        creatorId: userMap['lucas.moreau@spatialhaptics.example'].id,
        price: 39,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Aetheria — Cooperative Gravity-Shifting Puzzle Platformer',
        description: 'Two-player physics platformer where players manipulate localized gravitational fields and quantum polarity to solve intricate environmental puzzles.',
        categoryId: catMap['games'],
        creatorId: userMap['lucas.moreau@spatialhaptics.example'].id,
        price: 25,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'SubGrid: Cyber Defense Sandbox',
        description: 'Real-time network security simulation game where players defend simulated smart cities, satellites, and electric power grids against complex cyber-physical attacks.',
        categoryId: catMap['games'],
        creatorId: userMap['zoe.kalu@defitrust.example'].id,
        price: 30,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'BiomeCraft: Terraforming Mars Strategy Simulator',
        description: 'Hard sci-fi biological planetary simulation balancing atmospheric pressure, extremophile genetics, cyanobacteria cultures, and orbital solar radiation mirrors.',
        categoryId: catMap['games'],
        creatorId: userMap['dr.thorne@biogenome.example'].id,
        price: 34,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Echoes of the Deep: Sonar Exploration Adventure',
        description: 'Atmospheric abyss submarine exploration title where navigation, hydrothermal discovery, and survival rely entirely on realistic acoustic raytracing and sound waves.',
        categoryId: catMap['games'],
        creatorId: userMap['lucas.moreau@spatialhaptics.example'].id,
        price: 28,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
      },

      // ==========================================
      // CATEGORY 7: SOFTWARE (5 items)
      // ==========================================
      {
        title: 'FormFlow — No-code Form Builder',
        description: 'A lightweight workflow tool that turns complex intake forms and multi-step applications into simple, friendly conversations.',
        categoryId: catMap['software'],
        creatorId: userMap['creator@idea2impact.example'].id,
        price: 49,
        licensing: true,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Klarity AI — Real-time Contract & IP Risk Scanner',
        description: 'Browser-based privacy-first AI assistant that scans commercial NDAs, licensing agreements, and assignment clauses in 5 seconds to highlight unfavorable terms.',
        categoryId: catMap['software'],
        creatorId: userMap['david.miller@millerip.example'].id,
        price: 89,
        licensing: true,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'CipherVault — Zero-Knowledge Micro-Credential Registry',
        description: 'Cryptographic identity service enabling verified talent and university graduates to prove certifications and clearances without revealing personal identity.',
        categoryId: catMap['software'],
        creatorId: userMap['zoe.kalu@defitrust.example'].id,
        price: 120,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'LatencyZero — Edge ML Model Quantization Compiler',
        description: 'LLVM-backed compiler optimization suite that shrinks transformer neural networks by 85% for zero-latency inference on low-cost microcontrollers.',
        categoryId: catMap['software'],
        creatorId: userMap['devon.brooks@buildlab.example'].id,
        price: 150,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'AuditForge — Autonomous Smart Contract Vulnerability Fuzzer',
        description: 'AI-guided symbolic execution engine that tests decentralized smart contracts against reentrancy, flash-loan, and oracle manipulation exploits.',
        categoryId: catMap['software'],
        creatorId: userMap['zoe.kalu@defitrust.example'].id,
        price: 210,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80'
      },

      // ==========================================
      // CATEGORY 8: CREATIVE DESIGNS (5 items)
      // ==========================================
      {
        title: 'LumaFold — Origami Kinematic Solar Lantern',
        description: 'Waterproof recycled PET lantern that folds completely flat for backpack transport and expands into a 360-degree ambient campsite lantern charged via integrated solar film.',
        categoryId: catMap['creative-designs'],
        creatorId: userMap['aiko.tanaka@designcore.example'].id,
        price: 65,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'AuraSound — Parametric Acoustic Timber Wall Panels',
        description: 'Sculptural wooden acoustic tiles engineered with algorithmic sound-diffusing Voronoi patterns for recording studios, home theaters, and open-plan lofts.',
        categoryId: catMap['creative-designs'],
        creatorId: userMap['aiko.tanaka@designcore.example'].id,
        price: 180,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'AeroZero — Ultra-Light Aerogel Winter Jacket',
        description: 'Minimalist extreme-weather outerwear utilizing encapsulated silica aerogel insulation just 2mm thick to provide -30°C thermal protection at one-third standard winter coat weight.',
        categoryId: catMap['creative-designs'],
        creatorId: userMap['aiko.tanaka@designcore.example'].id,
        price: 320,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'BioMorph — 3D-Knitted Ergonomic Kinetic Chair',
        description: 'Single-strand recycled ocean polymer knit chair that dynamically conforms to lumbar micro-movements without mechanical adjustment levers.',
        categoryId: catMap['creative-designs'],
        creatorId: userMap['aiko.tanaka@designcore.example'].id,
        price: 490,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'ChromaDesk — Modular Magnetic Minimalist Workstation',
        description: 'Solid anodized aerospace aluminum desk with integrated flush magnetic power rails and modular accessory docks for creative digital professionals.',
        categoryId: catMap['creative-designs'],
        creatorId: userMap['aiko.tanaka@designcore.example'].id,
        price: 640,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80'
      }
    ];

    for (const item of seedItems) {
      let existing = await prisma.innovation.findFirst({ where: { title: item.title } });
      if (!existing) {
        existing = await prisma.innovation.create({ data: item });
        console.log(`✓ Created idea: ${item.title}`);
      } else {
        existing = await prisma.innovation.update({
          where: { id: existing.id },
          data: {
            categoryId: item.categoryId,
            imageUrl: item.imageUrl,
            price: item.price,
            description: item.description,
            status: item.status,
            visibility: item.visibility
          }
        });
        console.log(`↻ Updated idea: ${item.title}`);
      }

      // Add realistic discussion comments
      const commentCount = await prisma.comment.count({ where: { innovationId: existing.id } });
      if (commentCount < 1) {
        if (item.title.includes('ThermaHarvest')) {
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['marcus.vance@apexhorizons.example'].id,
              body: 'Capturing factory waste heat is a massive decarbonization vector. What is the degradation rate on the bismuth-telluride junctions?'
            }
          });
        } else if (item.title.includes('CanopyEye')) {
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['devon.brooks@buildlab.example'].id,
              body: 'We tested pneumatic seed delivery on rugged terrain last year. Happy to assist with the flight stabilization PID tuning!'
            }
          });
        } else if (item.title.includes('BioLoom')) {
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['creator@idea2impact.example'].id,
              body: 'Stunning architectural design! Does the algae media require automated nutrient dosing or can it use ambient rainwater filtration?'
            }
          });
        } else if (item.title.includes('OpenPatent')) {
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['david.miller@millerip.example'].id,
              body: 'A crowdsourced prior art exchange significantly levels the playing field for independent inventors defending against non-practicing entities.'
            }
          });
        } else if (item.title.includes('LumaFold')) {
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['marcus.vance@apexhorizons.example'].id,
              body: 'Gorgeous industrial origami execution. Would sell rapidly on outdoor retail channels and crowdfunding platforms.'
            }
          });
        }
      }
    }

    const totalInnovations = await prisma.innovation.count();
    console.log(`✓ Total innovations now in Neon PostgreSQL: ${totalInnovations}`);

    const counts = await prisma.innovation.groupBy({
      by: ['categoryId'],
      _count: { id: true }
    });
    console.log('--- FINAL CATEGORY DISTRIBUTION ---');
    for (const c of catList) {
      const found = counts.find(x => x.categoryId === c.id);
      console.log(`${c.name} (${c.slug}): ${found ? found._count.id : 0}`);
    }

    console.log('--- Database setup complete! ---');
  } catch (err) {
    console.error('Database setup error:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

// Auto-run if executed directly via node
setupDatabase().catch((err) => {
  console.error('Fatal database setup error:', err);
  process.exit(1);
});
