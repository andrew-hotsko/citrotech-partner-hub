import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── Document Categories ──────────────────────────────────────

  const categories = [
    {
      name: "Marketing Collateral",
      slug: "marketing-collateral",
      icon: "Megaphone",
      sortOrder: 1,
    },
    {
      name: "Technical Documentation",
      slug: "technical-docs",
      icon: "FileText",
      sortOrder: 2,
    },
    {
      name: "Installation Resources",
      slug: "installation-resources",
      icon: "Wrench",
      sortOrder: 3,
    },
    {
      name: "Sales Tools",
      slug: "sales-tools",
      icon: "BarChart3",
      sortOrder: 4,
    },
    {
      name: "Brand Assets",
      slug: "brand-assets",
      icon: "Palette",
      sortOrder: 5,
    },
    {
      name: "Training Materials",
      slug: "training-materials",
      icon: "GraduationCap",
      sortOrder: 6,
    },
  ] as const;

  for (const category of categories) {
    await prisma.documentCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        icon: category.icon,
        sortOrder: category.sortOrder,
      },
      create: category,
    });
    console.log(`  Category: ${category.name}`);
  }

  // ── Announcements ────────────────────────────────────────────

  // Announcements lack a natural unique field, so we query by title
  // and create only if missing – achieving idempotency without upsert.

  const announcements = [
    {
      title: "Welcome to the CitroTech Partner Hub",
      body: "We are excited to launch our new Partner Hub. Here you can access marketing materials, place orders, and communicate directly with the CitroTech team. Explore the resources available and reach out if you have any questions.",
      type: "INFO" as const,
      isPinned: true,
      authorName: "CitroTech Team",
    },
    {
      title: "MFB-34 Technical Data Sheet Updated to v2.1",
      body: "The MFB-34 technical data sheet has been updated to version 2.1 with revised fire-resistance ratings and updated installation specifications. Please download the latest version from the Technical Documentation section.",
      type: "PRODUCT" as const,
      isPinned: false,
      authorName: "CitroTech Engineering",
    },
    {
      title: "Q2 2026 Training Schedule Now Available",
      body: "Our Q2 2026 training schedule is now available. Sessions cover MFB-31 and MFB-34 installation best practices, code compliance updates, and sales enablement. Check the Training Materials section to register.",
      type: "TRAINING" as const,
      isPinned: false,
      authorName: "CitroTech Training",
    },
  ];

  for (const announcement of announcements) {
    const existing = await prisma.announcement.findFirst({
      where: { title: announcement.title },
    });

    if (!existing) {
      await prisma.announcement.create({ data: announcement });
    } else {
      await prisma.announcement.update({
        where: { id: existing.id },
        data: announcement,
      });
    }
    console.log(`  Announcement: ${announcement.title}`);
  }

  // ── Sample Partner ───────────────────────────────────────────

  await prisma.partner.upsert({
    where: { clerkUserId: "seed_jacob" },
    update: {
      email: "jacob@riverafiredefense.com",
      firstName: "Jacob",
      lastName: "Rivera",
      companyName: "Rivera Fire Defense",
      tier: "CERTIFIED",
      certifiedAt: new Date("2026-03-31"),
      status: "ACTIVE",
    },
    create: {
      clerkUserId: "seed_jacob",
      email: "jacob@riverafiredefense.com",
      firstName: "Jacob",
      lastName: "Rivera",
      companyName: "Rivera Fire Defense",
      tier: "CERTIFIED",
      certifiedAt: new Date("2026-03-31"),
      status: "ACTIVE",
    },
  });
  console.log("  Partner: Jacob Rivera (Rivera Fire Defense)");

  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
