# IDEA2IMPACT — Complete Mobile App Architecture Context

> **Use this file as your primary context file in Google AI Studio** to convert IDEA2IMPACT into a React Native / Expo mobile application.

---

## 1. Project Overview & Production Services
* **Live Web App**: `https://idea2impact-yges.vercel.app/`
* **Live Backend API**: `https://idea2impact-g8fe.onrender.com/api`
* **Local Backend API**: `http://localhost:4000/api`
* **Local Frontend**: `http://localhost:5173/`
* **Database**: Neon Serverless PostgreSQL with Prisma ORM
* **AI Provider**: Google Gemini 2.0 Flash (`gemini-2.0-flash`) via `/api/ai/chat`

---

## 2. Live API Endpoints & Contracts

### Authentication (`/api/auth`)
* `POST /api/auth/register`: `{ name, email, password, roles?: string[] }` -> returns `{ token, user }`
* `POST /api/auth/login`: `{ email, password }` -> returns `{ token, user }`
* `GET /api/auth/me`: Headers `Authorization: Bearer <token>` -> returns current user & profile
* `PUT /api/auth/profile`: Update user skills, bio, interests, and title

### Innovations / Marketplace (`/api/innovations`)
* `GET /api/innovations?search=&category=&stage=&sort=`: Returns list of innovations with author, category, like counts, and tags
* `GET /api/innovations/:id`: Full details of a single innovation including comments, likes, and NDA status
* `POST /api/innovations`: Create new innovation listing (requires Bearer token)
* `POST /api/innovations/:id/like`: Toggle like on an innovation
* `POST /api/innovations/:id/favourite`: Toggle bookmark/save on an innovation
* `GET /api/innovations/:id/comments`: Fetch discussion comments
* `POST /api/innovations/:id/comments`: Post a comment `{ text }`
* `POST /api/innovations/:id/proposals`: Submit collaboration request `{ type, amount, message, contactInfo }`
* `POST /api/innovations/:id/pitch-deck`: Generates 5-slide executive investor summary

### Categories & Builders (`/api/categories`, `/api/talents`)
* `GET /api/categories`: Returns all 8 categories (Ideas, Inventions, Physical Products, Websites, Mobile Apps, AI & Robotics, Software, Green Tech)
* `GET /api/talents?role=&skill=`: Returns vetted talent directory of creators, engineers, investors, and patent attorneys

### User Dashboard (`/api/dashboard`)
* `GET /api/dashboard/stats`: Returns count of posted innovations, saved items, proposals received, and recent likes/comments
* `GET /api/dashboard/my-innovations`: List of user's own listings
* `GET /api/dashboard/saved`: List of user's bookmarked innovations
* `GET /api/dashboard/proposals`: Inbound collaboration requests

### Impact AI Copilot (`/api/ai/chat`)
* `POST /api/ai/chat`: Body: `{ prompt, context, apiKey? }` -> Returns `{ reply, engine, mode }` powered by Google Gemini 2.0 Flash

---

## 3. Database Schema (Prisma)

```prisma
enum Role {
  CREATOR
  BUYER
  COMPANY
  INVESTOR
  BUILDER
  PATENT_PROFESSIONAL
  ADMIN
}

enum Visibility {
  PUBLIC
  PRIVATE
  RESTRICTED
}

enum ListingStatus {
  DRAFT
  PENDING
  PUBLISHED
  ARCHIVED
}

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String
  passwordHash String?
  roles        UserRole[]
  profile      Profile?
  innovations  Innovation[]
  likes        Like[]
  favourites   Favourite[]
  comments     Comment[]
  proposalsSent     CollaborationRequest[] @relation("ProposalsSent")
  proposalsReceived CollaborationRequest[] @relation("ProposalsReceived")
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Profile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String?
  bio       String?
  skills    String[]
  interests String[]
  location  String?
  avatarUrl String?
}

model Innovation {
  id          String        @id @default(cuid())
  title       String
  description String
  stage       String        @default("Idea") // Idea, Prototype, MVP, Launched
  seeking     String[]      // Funding, Co-Founder, Engineering, Manufacturing
  fundingGoal Float?
  valuation   Float?
  authorId    String
  author      User          @relation(fields: [authorId], references: [id])
  categoryId  String
  category    Category      @relation(fields: [categoryId], references: [id])
  status      ListingStatus @default(PUBLISHED)
  likes       Like[]
  favourites  Favourite[]
  comments    Comment[]
  proposals   CollaborationRequest[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model Category {
  id          String       @id @default(cuid())
  name        String       @unique
  slug        String       @unique
  description String?
  innovations Innovation[]
}

model CollaborationRequest {
  id           String   @id @default(cuid())
  innovationId String
  innovation   Innovation @relation(fields: [innovationId], references: [id])
  requesterId  String
  requester    User     @relation("ProposalsSent", fields: [requesterId], references: [id])
  receiverId   String
  receiver     User     @relation("ProposalsReceived", fields: [receiverId], references: [id])
  type         String   // Investment, Co-Founder, Engineering, Distribution
  amount       Float?
  message      String
  contactInfo  String
  status       String   @default("PENDING") // PENDING, ACCEPTED, DECLINED
  createdAt    DateTime @default(now())
}
```

---

## 4. UI Design System & Dual-Theme Palette

* **Dark Theme (Default)**:
  - Background: `#080b14`
  - Surface Card: `#101625` (border `rgba(159, 181, 220, 0.13)`)
  - Primary Text: `#edf2ff`
  - Muted Text: `#8d9ab1`
  - Neon Cyan Accent: `#54e6f5`
  - Electric Blue: `#6485ff`
  - Emerald Green: `#10b981`

* **Light Theme**:
  - Background: `#F5F0FF`
  - Surface Card: `#FFFFFF` (border `rgba(185, 154, 255, 0.35)`)
  - Primary Brand Purple: `#7041C7`
  - Deep Navy Text: `#30204F`
  - Soft Purple Muted: `#5F4B7E`

* **Typography**:
  - Headlines: Space Grotesk (bold, tight tracking)
  - Body & Numbers: DM Sans

---

## 5. React Native / Expo Target Architecture
* **Framework**: React Native with Expo Router (tabs: `/explore`, `/talents`, `/copilot`, `/dashboard`, `/profile`)
* **Secure Storage**: `expo-secure-store` for JWT persistence
* **Icons**: `lucide-react-native`
* **AI Copilot**: Native chat stream connecting directly to `POST https://idea2impact-g8fe.onrender.com/api/ai/chat`
