# CitroTech Partner Hub

A branded portal for CitroTech's Certified Partner Program (CPP). Partners access marketing materials, place product orders, message the CitroTech team, receive announcements, and manage their partnership.

## Tech Stack

- **Framework**: Next.js 16 with App Router, TypeScript (strict)
- **Styling**: Tailwind CSS v4 with custom CSS properties (globals.css)
- **UI Components**: Hand-crafted shadcn-style components in `src/components/ui/`
- **Auth**: Clerk (email + password, roles: "partner" and "admin" via publicMetadata)
- **Database**: Prisma v5 with PostgreSQL (Neon serverless)
- **File Storage**: Vercel Blob
- **Email**: Resend (transactional notifications)
- **Notifications**: Sonner toasts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Instrument Sans (headings), DM Sans (body), JetBrains Mono (mono)
- **Data Fetching**: React Query with 30s polling for messages

## Features Built

### Partner Pages
- **Dashboard** (`/`): Greeting, tier badge, quick actions, recent orders, announcements, cert expiry warnings
- **Document Library** (`/library`): Category grid, document search, download tracking, file type badges
- **Orders** (`/orders`): Order list, new order sheet (MFB-31/MFB-34), order detail with visual status timeline
- **Messages** (`/messages`): Conversation list, chat-style threaded view, real-time polling, unread badges
- **Announcements** (`/announcements`): Feed with markdown rendering, type badges, pinned items
- **Support** (`/support`): Emergency hotline, contacts, FAQ accordion
- **Profile** (`/profile`): Read-only partner info, certification status

### Admin Pages
- **Admin Dashboard** (`/admin`): KPI cards, recent activity
- **Partners** (`/admin/partners`): Table, detail with tier/status editing via server actions
- **Documents** (`/admin/documents`): Upload (Vercel Blob), CRUD table, drag-drop
- **Orders** (`/admin/orders`): Status tab filter, quick action dropdown, admin notes
- **Messages** (`/admin/messages`): All conversations, status management, threaded replies
- **Announcements** (`/admin/announcements`): CRUD with markdown preview, type/pin/expiry

### Auth
- Split-screen sign-in page with Clerk
- Clerk webhook syncs users to Partner records
- Role-based access: partner vs admin via publicMetadata
- Protected routes via middleware

### Design System
- Light mode default with dark mode toggle (localStorage persisted)
- Sidebar always dark (#0D0D0D), resizable 200-400px
- Brand: Citro Orange (#F78E25), Forest Teal (#105D50)
- Status colors consistent across orders/conversations
- Skeleton loading on every page, empty states with CTAs
- 44px minimum tap targets, mobile-first responsive

## Local Dev Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in all values in .env

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npm run db:seed

# Start dev server
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=    # Clerk dashboard
CLERK_SECRET_KEY=                      # Clerk dashboard
CLERK_WEBHOOK_SECRET=                  # Clerk webhook endpoint settings
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
DATABASE_URL=                          # Neon PostgreSQL connection string
BLOB_READ_WRITE_TOKEN=                 # Vercel Blob
RESEND_API_KEY=                        # Resend dashboard
RESEND_FROM_EMAIL=partners@citrotech.com
```

## Clerk Setup

1. Create Clerk application with email + password
2. Set up webhook endpoint pointing to `/api/webhooks/clerk` with events: `user.created`, `user.updated`, `user.deleted`
3. For admin users: set `publicMetadata: { role: "admin" }` in Clerk dashboard
4. For partner users: set `publicMetadata: { role: "partner" }` (default)
5. No self-registration — create users manually in Clerk dashboard

## Messaging Architecture

- Conversations belong to a Partner, contain Messages
- Messages have senderType (PARTNER/ADMIN) and read tracking (isReadByPartner/isReadByAdmin)
- When a user opens a conversation, the GET endpoint marks messages from the other party as read
- Unread badge counts conversations with unread messages from the other party
- React Query polls every 30 seconds for new messages and unread counts
- Email notifications sent via Resend on new messages

## File Structure

```
src/
├── app/
│   ├── (portal)/          # Partner route group
│   │   ├── page.tsx       # Dashboard
│   │   ├── library/       # Document library
│   │   ├── orders/        # Order management
│   │   ├── messages/      # Messaging
│   │   ├── announcements/ # Announcements feed
│   │   ├── support/       # Support page
│   │   ├── profile/       # Partner profile
│   │   └── layout.tsx     # Portal layout with sidebar
│   ├── (admin)/           # Admin route group
│   │   └── admin/         # All admin pages
│   ├── api/               # API routes
│   │   ├── documents/     # Document CRUD + download
│   │   ├── orders/        # Order CRUD + status
│   │   ├── conversations/ # Messaging API
│   │   ├── announcements/ # Announcement CRUD
│   │   ├── upload/        # Vercel Blob upload
│   │   └── webhooks/      # Clerk webhook
│   ├── sign-in/           # Clerk sign-in
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Design tokens + Tailwind
├── components/
│   ├── ui/                # Reusable UI primitives
│   ├── layout/            # Sidebar, mobile nav, page header
│   ├── dashboard/         # Dashboard components
│   ├── library/           # Library components
│   ├── orders/            # Order components
│   ├── messages/          # Message components
│   ├── announcements/     # Announcement components
│   ├── support/           # Support components
│   ├── profile/           # Profile components
│   └── admin/             # Admin components
├── lib/
│   ├── db.ts              # Prisma singleton
│   ├── auth.ts            # Auth helpers
│   ├── email.ts           # Resend email functions
│   ├── utils.ts           # cn() utility
│   └── format.ts          # Date, file size, status formatters
└── providers/
    ├── theme-provider.tsx  # Light/dark theme context
    └── query-provider.tsx  # React Query provider
prisma/
├── schema.prisma          # Database schema (8 models, 7 enums)
└── seed.ts                # Seed data (categories, announcements, sample partner)
```

## Database Models

Partner, DocumentCategory, Document, Order, OrderItem, Conversation, Message, Announcement

## Order Numbers

Format: `CPP-{YEAR}-{NNNN}` (e.g., CPP-2026-0001). Auto-incremented per year.

## Known Issues

- Middleware uses deprecated `middleware.ts` convention (Next.js 16 prefers `proxy.ts`)
- No WebSocket support — relies on 30s polling for message updates
- No file preview — documents open in new tab via URL
- Partner profile is read-only (by design — partners contact admin to update)

## Phase 2 Plans

- QA submission workflow for partner installations
- Partner directory map (geographic visualization)
- Analytics dashboard (order trends, download metrics, partner activity)
- Community feed for partner-to-partner discussion
- Real-time messaging via Pusher or Ably
- Partner self-registration with admin approval flow
- Multi-language support
