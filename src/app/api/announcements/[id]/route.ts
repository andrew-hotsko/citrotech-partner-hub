import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRole } from "@/lib/auth";

// ---------------------------------------------------------------------------
// PATCH /api/announcements/[id] — Update an announcement (admin only)
// ---------------------------------------------------------------------------

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  type: z.enum(["INFO", "PRODUCT", "TRAINING", "URGENT"]).optional(),
  isPinned: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateAnnouncementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { expiresAt, ...rest } = parsed.data;

    const announcement = await db.announcement.update({
      where: { id },
      data: {
        ...rest,
        ...(expiresAt !== undefined
          ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
          : {}),
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("[ANNOUNCEMENT_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/announcements/[id] — Delete an announcement (admin only)
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 },
      );
    }

    await db.announcement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ANNOUNCEMENT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 },
    );
  }
}
