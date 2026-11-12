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

    // 3. Seed 32 High-Caliber Innovations Across All Fields
    const seedItems = [
      // --- Original Core Innovations ---
      {
        title: 'AquaSense — Smart Water Monitor',
        description: 'A low-cost sensor concept that helps households spot leaks and understand daily water use with high precision. Integrates with mobile notifications and municipal water conservation goals.',
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
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'ModuNest Furniture System',
        description: 'Flat-pack modular furniture engineered for compact urban living spaces. Easily disassembled, expanded, and customized without tools.',
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
        imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Klarity AI — Real-time Contract & IP Risk Scanner',
        description: 'Browser-based privacy-first AI assistant that scans commercial NDAs, licensing agreements, and assignment clauses in 5 seconds to highlight unfavorable terms.',
        categoryId: catMap['software'],
        creatorId: userMap['david.miller@millerip.example'].id,
        price: 99,
        licensing: true,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },

      // --- 25 NEW INNOVATIONS (DIVERSE FIELDS) ---
      // CleanTech & Energy
      {
        title: 'ThermaHarvest — Industrial Waste-Heat Thermoelectric Generator',
        description: 'Solid-state thermoelectric generator capturing low-grade industrial exhaust heat (150°C-350°C) to deliver 12 kW electrical baseload directly into plant microgrids.',
        categoryId: catMap['inventions'],
        creatorId: userMap['creator@idea2impact.example'].id,
        price: 850,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'BioLoom — Algae-Based Carbon Capture Façade Panels',
        description: 'Living architectural exterior cladding panels populated with micro-algae photobioreactors that sequester 4x more CO2 per m² than mature pine trees while producing natural thermal insulation.',
        categoryId: catMap['physical-products'],
        creatorId: userMap['aiko.tanaka@designcore.example'].id,
        price: 420,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'VoltaTile — Kinetic Footstep Energy Harvesting Pavers',
        description: 'Durable composite pavers designed for subway hubs and pedestrian plazas that harness human footstep kinetic pressure to power local LED lighting and emergency beacons.',
        categoryId: catMap['inventions'],
        creatorId: userMap['creator@idea2impact.example'].id,
        price: 190,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      },

      // Robotics, Drones & Marine
      {
        title: 'CanopyEye — Autonomous Tree-Planting Drone Swarm',
        description: 'Autonomous multi-rotor drone system capable of firing 40,000 biodegradable seed pods daily into difficult terrain and wildfire burn scars with GPS tracking.',
        categoryId: catMap['inventions'],
        creatorId: userMap['elena.rostova@aerosolar.example'].id,
        price: 3400,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'CobotGrip — Soft-Pneumatic Tactile End-Effector',
        description: 'Silicone elastomer robotic gripper mimicking human fingertip compliance for bruise-free soft fruit packaging, delicate berry harvesting, and glass vial assembly.',
        categoryId: catMap['physical-products'],
        creatorId: userMap['devon.brooks@buildlab.example'].id,
        price: 640,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'DeepSub Autonomous Coral Reef Surveyor',
        description: 'Submersible micro-AUV equipped with stereo photogrammetry and computer vision to map 3D coral health, temperature gradients, and reef biodiversity at 50m depth.',
        categoryId: catMap['inventions'],
        creatorId: userMap['devon.brooks@buildlab.example'].id,
        price: 2100,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'
      },

      // HealthTech & BioTech
      {
        title: 'NeuroPulse — Transcranial Vagus Nerve Sleep Optimizer',
        description: 'Ergonomic behind-the-ear headband applying targeted micro-current vagal neuromodulation to enhance slow-wave sleep cycles and accelerate athletic neurological recovery.',
        categoryId: catMap['physical-products'],
        creatorId: userMap['creator@idea2impact.example'].id,
        price: 349,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'GlucoSpectra — Non-Invasive Optical Blood Glucose Monitor',
        description: 'Continuous blood glucose monitoring via multi-wavelength Raman spectroscopy without skin lancets or disposable enzyme test strips.',
        categoryId: catMap['inventions'],
        creatorId: userMap['dr.thorne@biogenome.example'].id,
        price: 480,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'VitalPatch — 14-Day Biodegradable Cardiac Telemetry Patch',
        description: 'Water-soluble ECG biosensor patch that records 336 hours of continuous continuous clinical cardiac rhythms and dissolves harmlessly in warm water after use.',
        categoryId: catMap['physical-products'],
        creatorId: userMap['dr.thorne@biogenome.example'].id,
        price: 75,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
      },

      // AgriTech & Food Systems
      {
        title: 'TerraSense — Subsurface Soil Nitrate & Moisture Spectrometer',
        description: 'In-ground solar probe transmitting wireless real-time nitrogen, phosphorus, and moisture profiles to reduce agricultural fertilizer runoff by up to 35%.',
        categoryId: catMap['inventions'],
        creatorId: userMap['priya.sharma@agritech.example'].id,
        price: 290,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'HydroPod — Solar Closed-Loop Desalination Greenhouse',
        description: 'Compact vertical hydroponic greenhouse tower utilizing passive multi-stage solar distillation to grow 800 kg of fresh vegetables using brackish groundwater.',
        categoryId: catMap['physical-products'],
        creatorId: userMap['priya.sharma@agritech.example'].id,
        price: 1850,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'MycoFeed — Fungal Protein Bioconversion System',
        description: 'Low-energy modular fermenter that transforms agricultural chaff and spent brewer grains into high-protein livestock feed supplements in under 48 hours.',
        categoryId: catMap['ideas'],
        creatorId: userMap['priya.sharma@agritech.example'].id,
        price: 0,
        licensing: false,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80'
      },

      // Software & Developer Tools
      {
        title: 'CipherVault — Zero-Knowledge Micro-Credential Registry',
        description: 'Decentralized identity protocol allowing technical universities, coding schools, and trade guilds to issue tamper-proof verifiable proof of engineering competency.',
        categoryId: catMap['software'],
        creatorId: userMap['zoe.kalu@defitrust.example'].id,
        price: 150,
        licensing: true,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'LatencyZero — Edge ML Model Quantization Compiler',
        description: 'Automated developer tool that shrinks PyTorch convolutional neural networks by 85% to run at 60 FPS on $3 ARM Cortex microcontrollers with zero accuracy degradation.',
        categoryId: catMap['software'],
        creatorId: userMap['devon.brooks@buildlab.example'].id,
        price: 299,
        licensing: true,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'AuditForge — Autonomous Smart Contract Vulnerability Fuzzer',
        description: 'Automated formal verification engine detecting re-entrancy, price oracle manipulation, and arithmetic overflows in decentralized liquidity contracts before deployment.',
        categoryId: catMap['software'],
        creatorId: userMap['zoe.kalu@defitrust.example'].id,
        price: 450,
        licensing: true,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80'
      },

      // Spatial Computing & Haptics
      {
        title: 'HapticWave — Ultrasonic Mid-Air Spatial Touch Wearable',
        description: 'Acoustic phased-array band that projects 40kHz radiation pressure directly onto the user palm, letting VR and spatial users feel solid buttons and textures in mid-air.',
        categoryId: catMap['physical-products'],
        creatorId: userMap['lucas.moreau@spatialhaptics.example'].id,
        price: 520,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80'
      },

      // Games & Interactive Simulation
      {
        title: 'Chronos: Echoes of Carthage — Historical Tactical RPG',
        description: 'Turn-based tactical strategy game built in Unreal Engine 5 featuring authentic archaeological Mediterranean topography and physics-based naval ramming mechanics.',
        categoryId: catMap['games'],
        creatorId: userMap['devon.brooks@buildlab.example'].id,
        price: 35,
        licensing: true,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Aetheria — Cooperative Gravity-Shifting Puzzle Platformer',
        description: 'Physics-driven cooperative multiplayer game where players manipulate localized gravitational fields to traverse shifting celestial ruins.',
        categoryId: catMap['games'],
        creatorId: userMap['aiko.tanaka@designcore.example'].id,
        price: 20,
        licensing: true,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80'
      },

      // Mobile Apps
      {
        title: 'KindredKit — Hyper-Local Emergency Preparedness Network',
        description: 'Peer-to-peer Bluetooth mesh app allowing neighbors to share generators, water filtration gear, and first-aid resources when cellular cell towers go dark.',
        categoryId: catMap['mobile-apps'],
        creatorId: userMap['creator@idea2impact.example'].id,
        price: 0,
        licensing: false,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'SkillBridge — Apprentice-to-Master Micro-Mentorship App',
        description: 'On-demand mobile marketplace connecting aspiring electricians, machinists, and fabricators with experienced master craftsmen for paid half-day shadow shifts.',
        categoryId: catMap['mobile-apps'],
        creatorId: userMap['marcus.vance@apexhorizons.example'].id,
        price: 0,
        licensing: false,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'PantryZero — Computer Vision Food Expiration & Recipe Planner',
        description: 'Camera-first fridge inventory assistant that scans expiration dates on dairy and produce to curate delicious zero-waste recipes before food spoils.',
        categoryId: catMap['mobile-apps'],
        creatorId: userMap['aiko.tanaka@designcore.example'].id,
        price: 0,
        licensing: false,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
      },

      // Websites & Web Platforms
      {
        title: 'OpenPatent — Crowdsourced Prior-Art Invalidation Exchange',
        description: 'Decentralized bounty platform rewarding global research engineers for uncovering prior-art publications to invalidate abusive patent assertion entities.',
        categoryId: catMap['websites'],
        creatorId: userMap['david.miller@millerip.example'].id,
        price: 0,
        licensing: false,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'ReClaim — Circular Economy Industrial Surplus Marketplace',
        description: 'B2B platform redirecting surplus aerospace alloy offcuts, industrial polymers, and electronic overstock from landfill into artisan maker supply chains.',
        categoryId: catMap['websites'],
        creatorId: userMap['marcus.vance@apexhorizons.example'].id,
        price: 0,
        licensing: false,
        funding: true,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'SoundForge — Procedural Ambient Audio Synthesizer',
        description: 'Browser-based generative WebAudio DSP studio creating infinite procedural atmospheric soundscapes, sci-fi foley, and cinematic sound design.',
        categoryId: catMap['websites'],
        creatorId: userMap['lucas.moreau@spatialhaptics.example'].id,
        price: 19,
        licensing: true,
        funding: false,
        ownershipConfirmed: true,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
      },

      // Creative Designs
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
        imageUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=800&q=80'
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
        } else if (item.title.includes('GlucoSpectra')) {
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['david.miller@millerip.example'].id,
              body: 'Make sure your spectroscopy patent claims cover the calibration algorithm as well as the optical sensor array.'
            }
          });
        } else if (item.title.includes('LumaFold')) {
          await prisma.comment.create({
            data: {
              innovationId: existing.id,
              authorId: userMap['marcus.vance@apexhorizons.example'].id,
              body: 'Gorgeous industrial origami execution. Would sell rapidly on outdoor retail channels and Kickstarter.'
            }
          });
        }
      }
    }

    const totalInnovations = await prisma.innovation.count();
    console.log(`✓ Total innovations now in Neon PostgreSQL: ${totalInnovations}`);

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

