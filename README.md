# CitroTech Partner Hub

A white-glove portal for CitroTech's **Certified Partner Program (CPP)**. Built for certified installers and distributors to access marketing materials, place product orders, communicate directly with the CitroTech team, and manage their partnership — all in one place.

## Overview

The Partner Hub serves two audiences:

- **Partners** — Certified installers and distributors who log in to browse documents, place orders, message the CitroTech team, and stay up to date with announcements.
- **Admins** — The CitroTech internal team who manage partners, upload documents, process orders, and send announcements.

## Key Features

### For Partners

| Feature | Description |
|---|---|
| **Dashboard** | Personalized greeting, tier badge, quick actions, recent orders, and announcements at a glance |
| **Document Library** | Browse by category (marketing, technical, training, etc.), search across all documents, download with tracking |
| **Orders** | Place orders for MFB-31 and MFB-34 product lines with visual status timeline tracking |
| **Messages** | Chat-style threaded conversations with the CitroTech team, unread badges, and email notifications |
| **Announcements** | Company news feed with markdown rendering, pinned items, and type-based filtering |
| **Support** | Emergency hotline, direct contacts, and searchable FAQ |
| **Profile** | Business details, certification status, logo upload, and warehouse address management |

### For Admins

| Feature | Description |
|---|---|
| **Partner Management** | Invite new partners, view/edit tiers and status, deactivate or remove accounts |
| **Document Management** | Upload files via drag-and-drop, organize by category, track downloads |
| **Order Processing** | Filter by status, update order progress, add internal notes |
| **Messaging** | View all partner conversations, manage conversation status, reply as the CitroTech team |
| **Announcements** | Create, edit, pin, and schedule announcements with markdown support |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript (strict) |
| Styling | Tailwind CSS v4, custom design tokens |
| Auth | Clerk (email + password, role-based access) |
| Database | PostgreSQL via Neon (serverless), Prisma ORM |
| File Storage | Vercel Blob |
| Email | Resend (transactional notifications) |
| UI | Hand-crafted component library, Framer Motion, Lucide icons |
| Fonts | Instrument Sans, DM Sans, JetBrains Mono |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (recommend [Neon](https://neon.tech))
- [Clerk](https://clerk.com) account
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store
- [Resend](https://resend.com) account (for email notifications)

### Installation

```bash
# Clone the repository
git clone https://github.com/andrew-hotsko/citrotech-partner-hub.git
cd citrotech-partner-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in all values — see Environment Variables below

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with categories and sample data
npm run db:seed

# Start development server
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env` file in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=    # From Clerk dashboard
CLERK_SECRET_KEY=                      # From Clerk dashboard
CLERK_WEBHOOK_SECRET=                  # From Clerk webhook settings
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/

# Database
DATABASE_URL=                          # Neon PostgreSQL connection string

# File Storage
BLOB_READ_WRITE_TOKEN=                 # Vercel Blob store token

# Email
RESEND_API_KEY=                        # From Resend dashboard
RESEND_FROM_EMAIL=partners@citrotech.com
```

### Clerk Configuration

1. Create a Clerk application with **email + password** authentication
2. Add a webhook endpoint pointing to `/api/webhooks/clerk` for events: `user.created`, `user.updated`, `user.deleted`
3. Set admin users: `publicMetadata: { role: "admin" }` in the Clerk dashboard
4. Partner users default to `publicMetadata: { role: "partner" }`
5. Partners are invited through the admin portal — no self-registration

## Partner Onboarding Flow

1. Admin invites a partner from the Partner Hub admin dashboard
2. Partner receives a branded welcome email + Clerk password setup email
3. Partner sets their password and signs in
4. Welcome modal introduces key features on first login
5. Dashboard prompts partner to complete their business profile

## Project Structure

```
src/
  app/
    (portal)/        Partner-facing pages (dashboard, library, orders, etc.)
    (admin)/         Admin-facing pages (partner management, documents, etc.)
    api/             REST API routes
    sign-in/         Clerk sign-in page
  components/
    ui/              Reusable UI primitives (Button, Card, Dialog, etc.)
    layout/          Sidebar, mobile nav, page header
    dashboard/       Dashboard-specific components
    admin/           Admin-specific components
    ...              Feature-specific component folders
  lib/               Utilities, auth helpers, email, formatting
  providers/         React context providers (theme, React Query)
prisma/
  schema.prisma      Database schema
  seed.ts            Seed data
```

## Design System

- **Brand Colors**: Citro Orange (`#F78E25`), Forest Teal (`#105D50`)
- **Modes**: Light (default) + dark mode toggle
- **Sidebar**: Always dark (`#0D0D0D`), resizable 200-400px
- **Typography**: Instrument Sans (headings), DM Sans (body), JetBrains Mono (code)
- **Mobile**: Responsive-first with 44px minimum touch targets

## License

Proprietary. All rights reserved.
