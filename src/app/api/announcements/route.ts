import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRole } from "@/lib/auth";

// ---------------------------------------------------------------------------
// GET /api/announcements — List active announcements
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcements = await db.announcement.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("[ANNOUNCEMENTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/announcements — Create an announcement (admin only)
// ---------------------------------------------------------------------------

const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  type: z.enum(["INFO", "PRODUCT", "TRAINING", "URGENT"]).optional().default("INFO"),
  isPinned: z.boolean().optional().default(false),
  expiresAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createAnnouncementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { title, body: announcementBody, type, isPinned, expiresAt } = parsed.data;

    const authorName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Admin";

    const announcement = await db.announcement.create({
      data: {
        title,
        body: announcementBody,
        type,
        isPinned,
        authorName,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("[ANNOUNCEMENTS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 },
    );
  }
}
