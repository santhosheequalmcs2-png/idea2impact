# IDEA2IMPACT — AI-Powered Creator & Innovation Marketplace

A responsive innovation ecosystem prototype for International Hackathon 5.0. It connects creators, builders, companies, buyers and investors around the journey **Ideas → Build → Grow**.

## What's included

- React + Vite SPA with responsive premium dark/light UI, Three.js hero object, marketplace, innovation details, auth screens, role-aware workspace, AI Studio and pricing demo.
- Express REST API with rate limits, Helmet, CORS allowlist, secure HTTP-only JWT cookie sessions, bcrypt password hashing, Zod validation and role guards.
- PostgreSQL / Prisma normalized schema covering users, roles, profiles, innovations/media, AI conversations, matching, messaging, collaboration, projects, teams, favourites, reviews, competitions/votes, achievements, community, notifications, complaints, reports and audit logs.
- AI service with real OpenAI-compatible chat completion integration when `OPENAI_API_KEY` is configured, and clearly-labelled demo mode otherwise.
- Browser-local demo content and upload-innovation flow so the frontend can be explored without external services.
- Deployment notes and environment template.

## Run locally

Requirements: Node.js 20+, npm 10+, PostgreSQL (Neon works).

1. Copy `.env.example` to `.env` in the repository root.
2. Set `DATABASE_URL` and a long random `JWT_SECRET`. Optional integrations are listed below.
3. Install dependencies: `npm install`.
4. Generate Prisma client: `npx prisma generate --schema server/prisma/schema.prisma`.
5. Apply schema: `npx prisma migrate dev --schema server/prisma/schema.prisma --name init`.
6. Start both apps: `npm run dev`.
7. Frontend: http://localhost:5173 · API health: http://localhost:4000/api/health.

The frontend uses local demo state for quick evaluation. Set `VITE_API_URL=http://localhost:4000/api` in `client/.env` to point it to the API. Copying secrets into client env is not needed; never place private keys in Vite variables.

## Tests and build

- `npm run build` — production frontend bundle.
- `npm test` — backend service tests.
- `npm test -w server` — same backend test suite.

## API overview

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register + create secure session |
| POST | `/api/auth/login` | Login + secure session |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Current session (protected) |
| GET | `/api/innovations` | Public published innovations |
| GET | `/api/innovations/:id` | Public innovation detail |
| POST | `/api/innovations` | Submit innovation (protected; pending moderation) |
| POST | `/api/ai/chat` | AI assistant (protected) |
| POST | `/api/matching/preview` | Profile matching preview (protected) |
| POST | `/api/favourites/:innovationId` | Save favourite (protected) |
| GET | `/api/admin/overview` | Admin metrics (ADMIN only) |

All API payloads are JSON. Auth cookies are HttpOnly, SameSite=Lax and Secure in production. Production deployment should additionally configure HTTPS, CSRF tokens for cookie-authenticated state-changing routes, email verification/password-reset provider, upload storage, OAuth and observability.

## External credentials / integrations

- **Neon PostgreSQL:** `DATABASE_URL` required for persistent backend.
- **AI:** `OPENAI_API_KEY` optional; unset means explicit demo responses. `OPENAI_MODEL` defaults to `gpt-4o-mini`.
- **Google OAuth:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are placeholders for a provider integration; Google sign-in is not wired in this delivery.
- **Email:** SMTP variables are placeholders. Verification and password-reset email delivery are not wired yet.
- **Storage:** No external object storage is configured. The demo upload surface is text-first; secure media upload requires S3-compatible storage credentials and malware scanning.
- **Payments/subscriptions:** intentionally not implemented. Purchase interest and negotiation are demonstrative only.

## Deploy

### Frontend — Vercel

- Import the repository, set project root to `client` (or configure the monorepo build command `npm run build -w client`).
- Output directory: `dist`.
- Set `VITE_API_URL` to the deployed Render API base ending in `/api`.
- Add SPA rewrite to `/index.html` if needed.

### Backend — Render

- Create a Node web service with root directory `server` (or monorepo root command `npm run start -w server`).
- Build command: `npm install && npx prisma generate --schema prisma/schema.prisma` (monorepo root: `npm install && npx prisma generate --schema server/prisma/schema.prisma`).
- Start command: `npm start` (server root) or `npm run start -w server` (root).
- Set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` to the Vercel origin, and optional AI/email/OAuth credentials in Render environment settings.
- Run `npx prisma migrate deploy --schema prisma/schema.prisma` as a release/pre-deploy command.

### Database — Neon

Create a PostgreSQL database, copy its pooled or direct connection string into `DATABASE_URL`, and run the migration command above. Keep credentials in hosting environment settings, never Git.

## Security / product caveats

This is a hackathon-ready functional foundation, not a fully audited production marketplace. The Prisma schema and core API routes are implemented, but not every product surface in the brief has a complete persistent API yet. In particular: OAuth, email verification/reset, full messaging/team/community/admin moderation endpoints, payment processing, external storage, upload scanning, watermark rendering, WebSocket realtime and CSRF token flow remain integration work. Public/private visibility is enforced in public listing APIs; private media delivery must be implemented through authenticated signed URLs before accepting sensitive documents. AI output is not a legal, patentability, investment or market guarantee. Demo stories/listings are explicitly illustrative.

## Repository hygiene

`.env`, `node_modules`, build output and uploaded files are ignored. No secrets are included. Do not push to GitHub until the repository owner authorizes it.
