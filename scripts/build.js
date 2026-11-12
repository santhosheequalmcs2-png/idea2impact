import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const hasDatabase = Boolean(process.env.DATABASE_URL);

if (hasDatabase) {
  console.log('[build.js] DATABASE_URL detected. Running Prisma schema migration and database seed...');
  try {
    execSync('npx prisma generate --schema server/prisma/schema.prisma', { stdio: 'inherit' });
    execSync('npx prisma db push --schema server/prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
    execSync('node server/prisma/db-setup.js', { stdio: 'inherit' });
    console.log('[build.js] Database sync complete.');
  } catch (err) {
    console.error('[build.js] Database sync error:', err.message);
    if (process.env.RENDER) {
      process.exit(1);
    }
  }
} else {
  console.log('[build.js] No DATABASE_URL provided. Skipping Prisma database migration (Frontend build mode).');
}

console.log('[build.js] Building frontend client...');
try {
  execSync('npm run build -w client', { stdio: 'inherit' });
  console.log('[build.js] Frontend build completed successfully.');
} catch (err) {
  console.error('[build.js] Client build failed:', err.message);
  process.exit(1);
}

// Universal Failsafe: Sync client/dist to root public/ and root dist/ so Vercel finds the output under ANY configuration
try {
  const clientDist = path.resolve('client/dist');
  if (fs.existsSync(clientDist)) {
    const rootPublic = path.resolve('public');
    const rootDist = path.resolve('dist');

    if (!fs.existsSync(rootPublic)) fs.mkdirSync(rootPublic, { recursive: true });
    fs.cpSync(clientDist, rootPublic, { recursive: true });

    if (!fs.existsSync(rootDist)) fs.mkdirSync(rootDist, { recursive: true });
    fs.cpSync(clientDist, rootDist, { recursive: true });

    console.log('[build.js] Copied build output to root public/ and dist/ for universal Vercel compatibility.');
  }
} catch (err) {
  console.warn('[build.js] Non-fatal notice during output directory sync:', err.message);
}
