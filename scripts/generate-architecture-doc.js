const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageBreak, PageNumber, LevelFormat,
  ExternalHyperlink, TabStopType, TabStopPosition,
} = require("docx");

// ── Brand Colors ──────────────────────────────────────────────
const CITRO_ORANGE = "F78E25";
const FOREST_TEAL = "105D50";
const NEAR_BLACK = "0D0D0D";
const LIGHT_GRAY = "F5F5F3";
const MID_GRAY = "E8E8E3";
const TEXT_SECONDARY = "6B6B63";
const WHITE = "FFFFFF";

// ── Page Constants ────────────────────────────────────────────
const PAGE_WIDTH = 12240;    // 8.5" US Letter
const PAGE_HEIGHT = 15840;   // 11"
const MARGIN = 1440;         // 1"
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 9360 DXA

// ── Helpers ───────────────────────────────────────────────────
const border = (color = MID_GRAY) => ({
  style: BorderStyle.SINGLE, size: 1, color,
});
const borders = (color) => ({
  top: border(color), bottom: border(color),
  left: border(color), right: border(color),
});
const noBorders = {
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
};
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: NEAR_BLACK })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: FOREST_TEAL })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: NEAR_BLACK })],
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 20, font: "Arial", color: opts.color || "333333", ...opts })],
  });
}

function bodyRuns(runs) {
  return new Paragraph({
    spacing: { after: 120 },
    children: runs.map(r => new TextRun({ size: 20, font: "Arial", color: "333333", ...r })),
  });
}

function spacer(pts = 120) {
  return new Paragraph({ spacing: { after: pts }, children: [] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: MID_GRAY, space: 8 } },
    children: [],
  });
}

// ── Table builder ─────────────────────────────────────────────
function dataTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        width: { size: colWidths[i], type: WidthType.DXA },
        borders: borders(MID_GRAY),
        shading: { fill: FOREST_TEAL, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 18, font: "Arial", color: WHITE })],
        })],
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) =>
        new TableCell({
          width: { size: colWidths[ci], type: WidthType.DXA },
          borders: borders(MID_GRAY),
          shading: { fill: ri % 2 === 0 ? WHITE : LIGHT_GRAY, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({
            children: [new TextRun({ text: cell, size: 18, font: "Arial", color: "333333" })],
          })],
        })
      ),
    })
  );

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// Bold first cell table
function boldFirstColTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        width: { size: colWidths[i], type: WidthType.DXA },
        borders: borders(MID_GRAY),
        shading: { fill: FOREST_TEAL, type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 18, font: "Arial", color: WHITE })],
        })],
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) =>
        new TableCell({
          width: { size: colWidths[ci], type: WidthType.DXA },
          borders: borders(MID_GRAY),
          shading: { fill: ri % 2 === 0 ? WHITE : LIGHT_GRAY, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({
            children: [new TextRun({ text: cell, size: 18, font: "Arial", color: "333333", bold: ci === 0 })],
          })],
        })
      ),
    })
  );

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// ── Bullet list ───────────────────────────────────────────────
function bulletItem(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, font: "Arial", color: "333333" })],
  });
}

function bulletItemBold(boldPart, rest) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: boldPart, size: 20, font: "Arial", color: "333333", bold: true }),
      new TextRun({ text: rest, size: 20, font: "Arial", color: "333333" }),
    ],
  });
}

// ── Read logo ─────────────────────────────────────────────────
const logoPath = path.join(__dirname, "..", "public", "logo.png");
let logoData;
try { logoData = fs.readFileSync(logoPath); } catch { logoData = null; }

// ══════════════════════════════════════════════════════════════
//  BUILD DOCUMENT
// ══════════════════════════════════════════════════════════════

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 20 } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: NEAR_BLACK },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: FOREST_TEAL },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: NEAR_BLACK },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ],
      },
    ],
  },
  sections: [
    // ══════════════════════════════════════════════════════════
    //  COVER PAGE
    // ══════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: 2880, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      children: [
        spacer(600),
        // Logo
        ...(logoData ? [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new ImageRun({
            type: "png",
            data: logoData,
            transformation: { width: 220, height: 220 },
            altText: { title: "CitroTech Logo", description: "CitroTech company logo", name: "logo" },
          })],
        })] : []),
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "CitroTech Partner Hub", size: 56, bold: true, font: "Arial", color: NEAR_BLACK })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "System Architecture Document", size: 32, font: "Arial", color: FOREST_TEAL })],
        }),
        // Divider line
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: CITRO_ORANGE, space: 8 } },
          children: [],
        }),
        spacer(200),
        // Meta info
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Version 1.0", size: 22, font: "Arial", color: TEXT_SECONDARY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "March 2026", size: 22, font: "Arial", color: TEXT_SECONDARY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Confidential", size: 22, font: "Arial", color: TEXT_SECONDARY, italics: true })],
        }),
      ],
    },

    // ══════════════════════════════════════════════════════════
    //  TABLE OF CONTENTS
    // ══════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            spacing: { after: 0 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: MID_GRAY, space: 4 } },
            children: [
              new TextRun({ text: "CitroTech Partner Hub", size: 16, font: "Arial", color: TEXT_SECONDARY }),
              new TextRun({ text: "\tArchitecture Document", size: 16, font: "Arial", color: TEXT_SECONDARY }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 16, font: "Arial", color: TEXT_SECONDARY }),
              new TextRun({ size: 16, font: "Arial", color: TEXT_SECONDARY, children: [PageNumber.CURRENT] }),
            ],
          })],
        }),
      },
      children: [
        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: "Table of Contents", size: 36, bold: true, font: "Arial", color: NEAR_BLACK })],
        }),
        bodyText("Update this table of contents after opening the document in Microsoft Word (right-click > Update Field).", { color: TEXT_SECONDARY, italics: true }),
        spacer(200),
        // Manual TOC entries
        ...[
          "1. Executive Summary",
          "2. System Overview",
          "3. Technology Stack",
          "4. Infrastructure & Hosting",
          "5. Authentication & Authorization",
          "6. Database Architecture",
          "7. API Architecture",
          "8. Email System",
          "9. File Storage",
          "10. Frontend Architecture",
          "11. Design System",
          "12. Partner Onboarding Flow",
          "13. Data Flow Diagrams",
          "14. Security Model",
          "15. Environment Configuration",
          "16. Known Limitations & Future Roadmap",
        ].map(t => bodyText(t, { color: FOREST_TEAL })),
      ],
    },

    // ══════════════════════════════════════════════════════════
    //  MAIN CONTENT
    // ══════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            spacing: { after: 0 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: MID_GRAY, space: 4 } },
            children: [
              new TextRun({ text: "CitroTech Partner Hub", size: 16, font: "Arial", color: TEXT_SECONDARY }),
              new TextRun({ text: "\tArchitecture Document", size: 16, font: "Arial", color: TEXT_SECONDARY }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 16, font: "Arial", color: TEXT_SECONDARY }),
              new TextRun({ size: 16, font: "Arial", color: TEXT_SECONDARY, children: [PageNumber.CURRENT] }),
            ],
          })],
        }),
      },
      children: [
        // ── 1. EXECUTIVE SUMMARY ────────────────────────────
        heading1("1. Executive Summary"),
        bodyText("The CitroTech Partner Hub is a full-stack web application built to serve as the digital backbone of the Certified Partner Program (CPP). It provides a secure, branded portal where certified installers and distributors can access marketing materials, place product orders, communicate with the CitroTech team, and manage their partnership."),
        bodyText("The platform serves two primary user groups:"),
        bulletItemBold("Partners ", "- Certified installers and distributors who access documents, place orders, and communicate with the CitroTech team."),
        bulletItemBold("Admins ", "- The internal CitroTech team who manage partners, process orders, upload documents, and send announcements."),
        spacer(),
        bodyText("The system is designed as a modern, serverless-first architecture deployed on Vercel, leveraging managed services for authentication, database, file storage, and email to minimize operational overhead while maintaining enterprise-grade security and reliability."),

        // ── 2. SYSTEM OVERVIEW ──────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("2. System Overview"),
        bodyText("The Partner Hub is a monolithic Next.js application using the App Router architecture. All partner-facing and admin-facing pages, API endpoints, and background processes run within a single deployment unit on Vercel."),
        spacer(),
        heading2("2.1 High-Level Architecture"),
        bodyText("The system follows a three-tier architecture:"),
        spacer(80),
        dataTable(
          ["Tier", "Technology", "Responsibility"],
          [
            ["Presentation", "Next.js + React 19", "Server-rendered pages, client-side interactivity, responsive UI"],
            ["Application", "Next.js API Routes", "Business logic, authentication, data validation, email triggers"],
            ["Data", "PostgreSQL (Neon)", "Persistent storage for all partner, order, document, and messaging data"],
          ],
          [2000, 2500, 4860]
        ),
        spacer(),
        heading2("2.2 External Services"),
        dataTable(
          ["Service", "Provider", "Purpose"],
          [
            ["Authentication", "Clerk", "User management, password handling, session tokens, role-based access"],
            ["Database", "Neon", "Serverless PostgreSQL with connection pooling and branching"],
            ["File Storage", "Vercel Blob", "Document and logo uploads with CDN-backed delivery"],
            ["Email", "Resend", "Transactional emails (order confirmations, notifications, welcome emails)"],
            ["Hosting", "Vercel", "Edge network deployment, serverless functions, preview environments"],
            ["Webhooks", "Svix (via Clerk)", "Secure webhook delivery and signature verification"],
          ],
          [2000, 1800, 5560]
        ),

        // ── 3. TECHNOLOGY STACK ─────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("3. Technology Stack"),
        heading2("3.1 Core Framework"),
        boldFirstColTable(
          ["Component", "Technology", "Version"],
          [
            ["Framework", "Next.js (App Router)", "16.2.0"],
            ["Language", "TypeScript (strict mode)", "5.9.3"],
            ["Runtime", "React", "19.2.4"],
            ["ORM", "Prisma", "5.22.0"],
            ["Validation", "Zod", "4.3.6"],
          ],
          [2500, 4360, 2500]
        ),
        spacer(),
        heading2("3.2 Frontend Libraries"),
        boldFirstColTable(
          ["Library", "Purpose", "Version"],
          [
            ["Tailwind CSS", "Utility-first styling with custom design tokens", "4.2.2"],
            ["Framer Motion", "Page transitions and micro-animations", "12.38.0"],
            ["Lucide React", "Consistent icon system (500+ icons)", "0.577.0"],
            ["React Query", "Server state management with polling", "5.91.0"],
            ["Sonner", "Toast notification system", "2.0.7"],
            ["React Markdown", "Markdown rendering for announcements", "10.1.0"],
            ["rehype-sanitize", "HTML sanitization for user content", "6.0.0"],
          ],
          [2500, 4860, 2000]
        ),
        spacer(),
        heading2("3.3 Infrastructure Services"),
        boldFirstColTable(
          ["Service", "Purpose", "Integration"],
          [
            ["Clerk", "Authentication and user management", "SDK + webhook"],
            ["Neon", "Serverless PostgreSQL database", "Prisma connection"],
            ["Vercel Blob", "File uploads and CDN delivery", "SDK"],
            ["Resend", "Transactional email delivery", "SDK"],
          ],
          [2500, 4360, 2500]
        ),

        // ── 4. INFRASTRUCTURE ───────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("4. Infrastructure & Hosting"),
        heading2("4.1 Deployment Architecture"),
        bodyText("The application is deployed on Vercel with automatic deployments triggered by pushes to the master branch on GitHub. Every pull request gets a preview deployment with a unique URL."),
        spacer(),
        bulletItemBold("Production: ", "Auto-deployed from master branch"),
        bulletItemBold("Preview: ", "Auto-deployed from pull requests"),
        bulletItemBold("Edge Network: ", "Global CDN for static assets and edge middleware"),
        bulletItemBold("Serverless Functions: ", "API routes run as serverless functions (10s default timeout)"),
        spacer(),
        heading2("4.2 Connection Architecture"),
        bodyText("All external services connect via HTTPS with API keys stored in environment variables. No VPN or private networking is required."),
        spacer(),
        dataTable(
          ["Connection", "Protocol", "Auth Method"],
          [
            ["App to Neon DB", "PostgreSQL over TLS", "Connection string with password"],
            ["App to Clerk", "HTTPS REST API", "Secret key (server) + publishable key (client)"],
            ["App to Vercel Blob", "HTTPS REST API", "Read/write token"],
            ["App to Resend", "HTTPS REST API", "API key"],
            ["Clerk to App (webhook)", "HTTPS POST", "Svix signature verification"],
          ],
          [3000, 2500, 3860]
        ),

        // ── 5. AUTH ─────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("5. Authentication & Authorization"),
        heading2("5.1 Authentication Flow"),
        bodyText("Authentication is handled entirely by Clerk. Users sign in with email and password on a branded split-screen login page. Clerk manages session tokens, password resets, and account security."),
        spacer(),
        bodyRuns([
          { text: "Session Management: ", bold: true },
          { text: "Clerk issues secure session tokens stored as HTTP-only cookies. The Next.js middleware validates these tokens on every request to protected routes." },
        ]),
        spacer(),
        heading2("5.2 Role-Based Access Control"),
        bodyText("The system uses two roles stored in Clerk user metadata:"),
        spacer(),
        dataTable(
          ["Role", "Access Level", "Assignment"],
          [
            ["partner", "Portal pages (dashboard, library, orders, messages, profile)", "Default for all new users"],
            ["admin", "Admin pages + all partner endpoints", "Set manually in Clerk dashboard"],
          ],
          [1500, 5360, 2500]
        ),
        spacer(),
        heading2("5.3 Route Protection"),
        bodyText("Routes are protected at two levels:"),
        spacer(),
        bulletItemBold("Middleware (edge): ", "Clerk middleware runs on every request. Unauthenticated users are redirected to /sign-in. Public routes: /sign-in and /api/webhooks."),
        bulletItemBold("Server Components: ", "Each page calls requirePartner() or requireAdmin() to verify role and load the associated database record. Unauthorized users are redirected."),
        spacer(),
        heading2("5.4 Partner-Clerk Linking"),
        bodyText("Every Clerk user is linked to a Partner record in the database via clerkUserId. This linking happens through the Clerk webhook on user.created, which either creates a new Partner record or links to a pre-created one (from the admin invite flow)."),

        // ── 6. DATABASE ─────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("6. Database Architecture"),
        heading2("6.1 Overview"),
        bodyText("The database is PostgreSQL hosted on Neon (serverless). The schema is managed by Prisma ORM with 8 models and 8 enums. A Prisma singleton pattern prevents multiple client instances during development."),
        spacer(),
        heading2("6.2 Entity Relationship Summary"),
        dataTable(
          ["Model", "Key Fields", "Relations"],
          [
            ["Partner", "email, clerkUserId, companyName, tier, status, address fields, warehouse fields", "Has many Orders, Conversations"],
            ["DocumentCategory", "name, slug, icon, sortOrder", "Has many Documents"],
            ["Document", "title, fileName, fileUrl, fileType, fileSize, downloadCount, isPublic", "Belongs to DocumentCategory"],
            ["Order", "orderNumber (CPP-YYYY-NNNN), status, projectName, paymentStatus", "Belongs to Partner, has many OrderItems, Conversations"],
            ["OrderItem", "product (MFB_31/MFB_34), quantity", "Belongs to Order (cascade delete)"],
            ["Conversation", "subject, status (OPEN/RESOLVED/ARCHIVED), assignedTo", "Belongs to Partner and optionally Order, has many Messages"],
            ["Message", "body, senderType (PARTNER/ADMIN), isReadByPartner, isReadByAdmin", "Belongs to Conversation (cascade delete)"],
            ["Announcement", "title, body (markdown), type, isPinned, expiresAt", "Standalone (no relations)"],
          ],
          [2000, 4360, 3000]
        ),
        spacer(),
        heading2("6.3 Enums"),
        dataTable(
          ["Enum", "Values"],
          [
            ["PartnerTier", "REGISTERED, CERTIFIED, PREMIER"],
            ["PartnerStatus", "ACTIVE, SUSPENDED, INACTIVE"],
            ["ProductType", "MFB_31, MFB_34"],
            ["OrderStatus", "SUBMITTED, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED"],
            ["PaymentStatus", "PENDING, INVOICED, PAID"],
            ["SenderType", "PARTNER, ADMIN"],
            ["ConversationStatus", "OPEN, RESOLVED, ARCHIVED"],
            ["AnnouncementType", "INFO, PRODUCT, TRAINING, URGENT, FIELD_NOTE"],
          ],
          [3000, 6360]
        ),
        spacer(),
        heading2("6.4 Key Design Decisions"),
        bulletItemBold("Order Numbers: ", "Format CPP-{YEAR}-{NNNN}, auto-incremented per calendar year by counting existing orders."),
        bulletItemBold("Cascade Deletes: ", "OrderItems and Messages cascade-delete with their parent Order/Conversation."),
        bulletItemBold("Read Tracking: ", "Dual boolean fields (isReadByPartner, isReadByAdmin) on each Message rather than a separate read-receipts table."),
        bulletItemBold("Soft Deletes: ", "Not implemented. Partner deletion is permanent via Prisma transaction."),

        // ── 7. API ARCHITECTURE ─────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("7. API Architecture"),
        bodyText("The application exposes 18+ RESTful API routes via Next.js App Router route handlers. All routes use JSON request/response bodies and return appropriate HTTP status codes."),
        spacer(),
        heading2("7.1 Document APIs"),
        dataTable(
          ["Endpoint", "Method", "Auth", "Description"],
          [
            ["/api/documents", "GET", "Any", "List documents (partners: public only; admins: all)"],
            ["/api/documents/[id]", "PATCH", "Admin", "Update document metadata"],
            ["/api/documents/[id]/download", "POST", "Any", "Track download, return document record"],
          ],
          [2800, 900, 900, 4760]
        ),
        spacer(),
        heading2("7.2 Order APIs"),
        dataTable(
          ["Endpoint", "Method", "Auth", "Description"],
          [
            ["/api/orders", "GET", "Any", "List orders (filtered by partner for non-admins)"],
            ["/api/orders", "POST", "Partner", "Submit new order with items, auto-generate order number"],
            ["/api/orders/[id]", "GET", "Any", "Get order detail with items and partner info"],
            ["/api/orders/[id]", "PATCH", "Admin", "Update status, shipping, tracking number"],
          ],
          [2800, 900, 1000, 4660]
        ),
        spacer(),
        heading2("7.3 Messaging APIs"),
        dataTable(
          ["Endpoint", "Method", "Auth", "Description"],
          [
            ["/api/conversations", "GET", "Any", "List conversations (filtered for partners)"],
            ["/api/conversations", "POST", "Partner", "Create new conversation, optionally linked to order"],
            ["/api/conversations/[id]", "GET", "Any", "Get conversation with messages, mark as read"],
            ["/api/conversations/[id]", "PATCH", "Admin", "Update status, assign to team member"],
            ["/api/conversations/[id]/messages", "POST", "Any", "Add message, trigger email notification"],
            ["/api/conversations/unread", "GET", "Any", "Count conversations with unread messages"],
          ],
          [3200, 900, 1000, 4260]
        ),
        spacer(),
        heading2("7.4 Admin & Partner APIs"),
        dataTable(
          ["Endpoint", "Method", "Auth", "Description"],
          [
            ["/api/admin/invite-partner", "POST", "Admin", "Create Partner + Clerk invitation + welcome email"],
            ["/api/admin/partners/[id]", "PATCH", "Admin", "Update partner status/tier, ban/unban in Clerk"],
            ["/api/admin/partners/[id]", "DELETE", "Admin", "Permanently delete partner + Clerk user"],
            ["/api/partner/profile", "GET", "Partner", "Get current partner profile"],
            ["/api/partner/profile", "PATCH", "Partner", "Update profile fields"],
            ["/api/partner/logo", "POST", "Partner", "Upload logo to Vercel Blob"],
            ["/api/upload", "POST", "Admin", "Upload document to Vercel Blob (50MB max)"],
            ["/api/webhooks/clerk", "POST", "Webhook", "Handle user.created/updated/deleted events"],
          ],
          [3200, 900, 1100, 4160]
        ),

        // ── 8. EMAIL SYSTEM ─────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("8. Email System"),
        bodyText("Transactional emails are sent via Resend. All emails use a branded HTML template with the CitroTech header, consistent typography, and a standard footer."),
        spacer(),
        heading2("8.1 Email Types"),
        dataTable(
          ["Email", "Trigger", "Recipient"],
          [
            ["Welcome Email", "Partner invited or created via webhook", "Partner"],
            ["Order Confirmation", "Partner submits a new order", "Partner"],
            ["Order Status Update", "Admin changes order status", "Partner"],
            ["Order Shipped", "Order status set to SHIPPED", "Partner"],
            ["New Order Submitted", "Partner submits a new order", "Admin team"],
            ["New Message", "Message sent in conversation", "Other party (partner or admin)"],
            ["Cert Expiry Reminder", "Scheduled (external trigger)", "Partner"],
          ],
          [2800, 3560, 3000]
        ),
        spacer(),
        heading2("8.2 Email Template Architecture"),
        bodyText("All emails are constructed using a shared emailLayout() wrapper function that produces responsive HTML tables. The template includes:"),
        spacer(),
        bulletItemBold("Header: ", "CitroTech branding with orange accent (#F97316) on black (#0D0D0D)"),
        bulletItemBold("Body: ", "600px max-width content area with padding"),
        bulletItemBold("Footer: ", "Copyright notice and automated notification disclaimer"),
        bulletItemBold("Sender: ", "Configurable via RESEND_FROM_EMAIL environment variable"),
        spacer(),
        heading2("8.3 Error Handling"),
        bodyText("Email failures are caught and logged but never block the primary operation (order submission, partner creation, etc.). The system includes comprehensive logging with [EMAIL] prefixed console messages for debugging."),

        // ── 9. FILE STORAGE ─────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("9. File Storage"),
        heading2("9.1 Vercel Blob"),
        bodyText("All file uploads are stored in Vercel Blob, a CDN-backed object storage service. Files are publicly accessible via generated URLs after upload."),
        spacer(),
        dataTable(
          ["Upload Type", "Max Size", "Allowed Types", "Endpoint"],
          [
            ["Documents", "50 MB", "PDF, DOCX, XLSX, PPTX, PNG, JPEG, SVG, ZIP", "/api/upload"],
            ["Partner Logos", "5 MB", "PNG, JPEG, WEBP, SVG", "/api/partner/logo"],
          ],
          [2000, 1200, 4160, 2000]
        ),
        spacer(),
        heading2("9.2 Document Access Control"),
        bulletItemBold("Public documents: ", "Visible to all authenticated users (partners and admins)"),
        bulletItemBold("Private documents: ", "Visible only to admin users (isPublic: false)"),
        bulletItemBold("Download tracking: ", "Each download increments a counter via POST to /api/documents/[id]/download"),

        // ── 10. FRONTEND ARCHITECTURE ───────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("10. Frontend Architecture"),
        heading2("10.1 Routing"),
        bodyText("The application uses Next.js App Router with route groups to separate partner and admin experiences:"),
        spacer(),
        dataTable(
          ["Route Group", "Path Prefix", "Layout", "Access"],
          [
            ["(portal)", "/", "Sidebar + mobile nav + welcome modal", "Partners only"],
            ["(admin)", "/admin", "Sidebar + admin nav", "Admins only"],
            ["sign-in", "/sign-in", "Split-screen branded layout", "Public"],
            ["api", "/api", "No layout (JSON responses)", "Varies by endpoint"],
          ],
          [1800, 1500, 3560, 2500]
        ),
        spacer(),
        heading2("10.2 State Management"),
        bulletItemBold("Server State: ", "React Query (TanStack Query v5) with 30-second stale time. Polling enabled for messages and unread counts."),
        bulletItemBold("UI State: ", "React useState/useReducer for local component state (forms, modals, filters)."),
        bulletItemBold("Theme: ", "React Context with localStorage persistence. Light mode default."),
        bulletItemBold("Auth: ", "Clerk React hooks (useUser, useAuth) for client-side auth state."),
        spacer(),
        heading2("10.3 Component Architecture"),
        bodyText("Components are organized by feature with a shared UI primitive library:"),
        spacer(),
        dataTable(
          ["Layer", "Location", "Examples"],
          [
            ["UI Primitives", "src/components/ui/", "Button, Card, Dialog, Sheet, Badge, Skeleton, Accordion"],
            ["Layout", "src/components/layout/", "Sidebar, MobileNav, PageHeader, PortalShell"],
            ["Feature Components", "src/components/[feature]/", "DashboardContent, OrdersList, ConversationDetail"],
            ["Page Components", "src/app/[route]/page.tsx", "Server components that fetch data and render feature components"],
          ],
          [2200, 3160, 4000]
        ),

        // ── 11. DESIGN SYSTEM ───────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("11. Design System"),
        heading2("11.1 Brand Colors"),
        dataTable(
          ["Token", "Value", "Usage"],
          [
            ["Citro Orange", "#F78E25", "Primary actions, CTAs, brand accent"],
            ["Citro Orange Dark", "#E8731A", "Hover states for primary buttons"],
            ["Forest Teal", "#105D50", "Secondary accent, headings, badges"],
            ["Near Black", "#0D0D0D", "Sidebar background, dark text"],
            ["Background", "#FAFAF8", "Page background (light mode)"],
            ["Card", "#FFFFFF", "Card and container surfaces"],
            ["Border", "#E8E8E3", "Dividers and borders"],
          ],
          [2500, 1500, 5360]
        ),
        spacer(),
        heading2("11.2 Typography"),
        dataTable(
          ["Font", "Usage", "Weights"],
          [
            ["Instrument Sans", "Headings and display text", "600, 700"],
            ["DM Sans", "Body text and UI elements", "400, 500"],
            ["JetBrains Mono", "Code and monospace content", "500"],
          ],
          [2500, 4360, 2500]
        ),
        spacer(),
        heading2("11.3 Status Colors"),
        dataTable(
          ["Status", "Color", "Hex"],
          [
            ["Submitted", "Blue", "#2563EB"],
            ["Confirmed", "Orange", "#F78E25"],
            ["Processing", "Yellow", "#EAB308"],
            ["Shipped", "Teal", "#105D50"],
            ["Delivered", "Green", "#16A34A"],
            ["Cancelled", "Red", "#DC2626"],
          ],
          [2500, 2500, 4360]
        ),
        spacer(),
        heading2("11.4 Responsive Design"),
        bulletItemBold("Mobile-first: ", "All layouts designed for mobile, enhanced for larger screens."),
        bulletItemBold("Breakpoints: ", "Standard Tailwind (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)."),
        bulletItemBold("Touch targets: ", "Minimum 44px for all interactive elements."),
        bulletItemBold("Sidebar: ", "Collapsible drawer on mobile, fixed panel on desktop (resizable 200-400px)."),
        bulletItemBold("Dynamic viewport: ", "Uses dvh units to handle mobile browser chrome."),

        // ── 12. PARTNER ONBOARDING ──────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("12. Partner Onboarding Flow"),
        bodyText("The partner onboarding process is a multi-step flow that spans admin actions, email delivery, and the partner's first login experience."),
        spacer(),
        heading2("12.1 Invitation Process"),
        bodyText("Step 1: Admin opens the Invite Partner dialog from the admin dashboard or partners page."),
        bodyText("Step 2: Admin fills in partner details (first name, last name, email, company, phone) and submits."),
        bodyText("Step 3: The system creates a Partner database record with a placeholder Clerk ID, creates a Clerk invitation, and sends a branded welcome email via Resend."),
        bodyText("Step 4: Partner receives two emails: the Clerk password-setup email and the CitroTech branded welcome email."),
        spacer(),
        heading2("12.2 First Login"),
        bodyText("Step 5: Partner clicks the Clerk email link, sets their password, and is redirected to the Partner Hub sign-in page."),
        bodyText("Step 6: The Clerk webhook fires on user.created, linking the real Clerk user ID to the pre-created Partner record."),
        bodyText("Step 7: Partner signs in and lands on the dashboard. A race condition handler in the auth layer ensures the partner record is linked even if the webhook is delayed."),
        bodyText("Step 8: A welcome modal introduces key features (Document Library, Orders, Messaging, Announcements)."),
        bodyText("Step 9: A profile completion banner prompts the partner to add their business address, warehouse location, and other company details."),
        spacer(),
        heading2("12.3 Race Condition Handling"),
        bodyText("When a partner signs in for the first time, the Clerk webhook may not have fired yet. The auth helper (requirePartner) handles this by falling back to an email-based lookup. If it finds a Partner record with a pending_ prefix on the clerkUserId, it links the real Clerk ID on the spot."),

        // ── 13. DATA FLOW DIAGRAMS ──────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("13. Data Flow Diagrams"),
        heading2("13.1 Order Submission Flow"),
        bodyText("1. Partner fills out order form (product, quantity, project details, shipping address)"),
        bodyText("2. Client validates form with Zod schema"),
        bodyText("3. POST /api/orders creates Order + OrderItems in a single transaction"),
        bodyText("4. Order number auto-generated: CPP-{YEAR}-{NNNN}"),
        bodyText("5. Confirmation email sent to partner via Resend"),
        bodyText("6. Admin notification email sent to admin team"),
        bodyText("7. Partner redirected to order detail page with status timeline"),
        spacer(),
        heading2("13.2 Order Lifecycle"),
        bodyText("SUBMITTED  -->  CONFIRMED  -->  PROCESSING  -->  SHIPPED  -->  DELIVERED"),
        bodyText("(Can be CANCELLED at any stage by admin)"),
        spacer(),
        bodyText("Each status transition triggers an email notification to the partner. The SHIPPED transition can include a tracking number."),
        spacer(),
        heading2("13.3 Messaging Flow"),
        bodyText("1. Partner creates a new conversation (optionally linked to an order)"),
        bodyText("2. POST /api/conversations creates Conversation record"),
        bodyText("3. Partner or admin adds messages via POST /api/conversations/[id]/messages"),
        bodyText("4. Each new message triggers an email notification to the other party"),
        bodyText("5. React Query polls /api/conversations/unread every 30 seconds for badge counts"),
        bodyText("6. Opening a conversation marks all messages from the other party as read"),
        spacer(),
        heading2("13.4 Document Download Flow"),
        bodyText("1. Partner browses documents by category or uses global search"),
        bodyText("2. Partner clicks download on a document"),
        bodyText("3. POST /api/documents/[id]/download increments the download counter"),
        bodyText("4. Document opens in a new browser tab via the Vercel Blob CDN URL"),

        // ── 14. SECURITY MODEL ──────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("14. Security Model"),
        heading2("14.1 Authentication Security"),
        bulletItemBold("Password hashing: ", "Handled by Clerk (bcrypt-based, not stored in application database)."),
        bulletItemBold("Session tokens: ", "HTTP-only secure cookies issued by Clerk, validated at the edge."),
        bulletItemBold("Webhook verification: ", "All Clerk webhooks verified via Svix signature to prevent spoofing."),
        spacer(),
        heading2("14.2 Authorization Security"),
        bulletItemBold("Role enforcement: ", "Every API route checks role via Clerk publicMetadata before processing."),
        bulletItemBold("Data isolation: ", "Partners can only access their own orders, conversations, and profile data."),
        bulletItemBold("Admin elevation: ", "Admin role can only be set directly in Clerk dashboard (not via API)."),
        spacer(),
        heading2("14.3 Data Security"),
        bulletItemBold("Database: ", "All connections use TLS encryption. Connection strings stored in environment variables."),
        bulletItemBold("File uploads: ", "Validated by file type and size before upload. MIME type checking on server."),
        bulletItemBold("Input validation: ", "All API inputs validated with Zod schemas."),
        bulletItemBold("Content sanitization: ", "User-generated markdown sanitized with rehype-sanitize before rendering."),
        spacer(),
        heading2("14.4 Infrastructure Security"),
        bulletItemBold("Environment variables: ", "All secrets stored in Vercel environment variables (encrypted at rest)."),
        bulletItemBold("HTTPS: ", "All traffic encrypted via Vercel edge network. No HTTP fallback."),
        bulletItemBold("No self-registration: ", "Partners can only be invited by admins. No public signup form."),

        // ── 15. ENVIRONMENT CONFIG ──────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("15. Environment Configuration"),
        dataTable(
          ["Variable", "Required", "Description"],
          [
            ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "Yes", "Clerk client-side publishable key"],
            ["CLERK_SECRET_KEY", "Yes", "Clerk server-side secret key"],
            ["CLERK_WEBHOOK_SECRET", "Yes", "Svix webhook verification secret"],
            ["NEXT_PUBLIC_CLERK_SIGN_IN_URL", "Yes", "Sign-in page path (/sign-in)"],
            ["NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL", "Yes", "Post-sign-in redirect path (/)"],
            ["DATABASE_URL", "Yes", "Neon PostgreSQL connection string"],
            ["BLOB_READ_WRITE_TOKEN", "Yes", "Vercel Blob store read/write token"],
            ["RESEND_API_KEY", "Yes", "Resend transactional email API key"],
            ["RESEND_FROM_EMAIL", "Yes", "Sender email address for all transactional emails"],
            ["ADMIN_NOTIFICATION_EMAILS", "No", "Comma-separated admin email addresses for notifications"],
            ["NEXT_PUBLIC_APP_URL", "No", "Application URL for email links (defaults to Vercel domain)"],
          ],
          [3800, 900, 4660]
        ),

        // ── 16. LIMITATIONS & ROADMAP ───────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        heading1("16. Known Limitations & Future Roadmap"),
        heading2("16.1 Current Limitations"),
        bulletItemBold("No real-time messaging: ", "Messages rely on 30-second polling via React Query. No WebSocket or Server-Sent Events support."),
        bulletItemBold("No file preview: ", "Documents open in a new browser tab via direct URL. No in-app preview or viewer."),
        bulletItemBold("No pagination: ", "API routes return all results without cursor-based pagination. Acceptable for current data volumes."),
        bulletItemBold("No soft deletes: ", "Partner deletion is permanent. No recycle bin or undo capability."),
        bulletItemBold("Middleware convention: ", "Uses middleware.ts (Next.js 16 prefers proxy.ts for route matching)."),
        spacer(),
        heading2("16.2 Phase 2 Roadmap"),
        bulletItemBold("QA Submission Workflow: ", "Partners submit installation photos and checklists for quality review."),
        bulletItemBold("Partner Directory Map: ", "Geographic visualization of certified partners by service territory."),
        bulletItemBold("Analytics Dashboard: ", "Order trends, download metrics, partner activity tracking."),
        bulletItemBold("Community Feed: ", "Partner-to-partner discussion and knowledge sharing."),
        bulletItemBold("Real-time Messaging: ", "WebSocket integration via Pusher or Ably for instant message delivery."),
        bulletItemBold("Partner Self-Registration: ", "Public signup form with admin approval workflow."),
        bulletItemBold("Multi-language Support: ", "Internationalization for partner-facing pages."),
        bulletItemBold("Domain-verified Email: ", "Verified citrotech.com domain in Resend for production email delivery."),

        // ── END ─────────────────────────────────────────────
        spacer(400),
        divider(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "End of Document", size: 20, font: "Arial", color: TEXT_SECONDARY, italics: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "CitroTech Partner Hub - Architecture Document v1.0 - March 2026", size: 16, font: "Arial", color: TEXT_SECONDARY })],
        }),
      ],
    },
  ],
});

// ── Generate ────────────────────────────────────────────────
const outputPath = path.join(__dirname, "..", "CitroTech_Partner_Hub_Architecture.docx");
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Architecture document saved to: ${outputPath}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
});
