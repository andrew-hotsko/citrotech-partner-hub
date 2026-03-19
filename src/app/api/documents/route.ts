import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRole } from "@/lib/auth";

// ---------------------------------------------------------------------------
// GET /api/documents — List documents
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    // Partners can only see public documents
    if (role !== "admin") {
      where.isPublic = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const documents = await db.document.findMany({
      where,
      include: { category: true },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("[DOCUMENTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/documents — Create a document (admin only)
// ---------------------------------------------------------------------------

const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().url("Invalid file URL"),
  fileSize: z.number().int().positive("File size must be positive"),
  fileType: z.string().min(1, "File type is required"),
  version: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
  isPinned: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  categoryId: z.string().min(1, "Category is required"),
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
    const parsed = createDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const document = await db.document.create({
      data: parsed.data,
      include: { category: true },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("[DOCUMENTS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 },
    );
  }
}
