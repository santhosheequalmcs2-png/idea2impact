import { execSync } from 'child_process';

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
