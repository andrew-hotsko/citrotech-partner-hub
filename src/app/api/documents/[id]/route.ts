import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRole } from "@/lib/auth";

// ---------------------------------------------------------------------------
// PATCH /api/documents/[id] — Update a document (admin only)
// ---------------------------------------------------------------------------

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  fileName: z.string().min(1).optional(),
  fileUrl: z.string().url().optional(),
  fileSize: z.number().int().positive().optional(),
  fileType: z.string().min(1).optional(),
  version: z.string().optional(),
  isPublic: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().min(1).optional(),
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

    const existing = await db.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const document = await db.document.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("[DOCUMENT_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/documents/[id] — Delete a document (admin only)
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

    const existing = await db.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    await db.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DOCUMENT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
