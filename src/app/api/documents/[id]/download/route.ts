import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// POST /api/documents/[id]/download — Increment download count
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Only allow access if document is public or user is admin
    const role = (user.publicMetadata as { role?: string })?.role;
    if (!document.isPublic && role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    await db.document.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DOCUMENT_DOWNLOAD]", error);
    return NextResponse.json(
      { error: "Failed to record download" },
      { status: 500 },
    );
  }
}
