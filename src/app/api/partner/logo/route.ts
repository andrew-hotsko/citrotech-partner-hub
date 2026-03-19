import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { getPartnerByClerkId } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partner = await getPartnerByClerkId(user.id);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5 MB limit" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PNG, JPG, WebP, SVG" },
        { status: 400 },
      );
    }

    // Delete old logo if exists
    if (partner.logoUrl) {
      try {
        await del(partner.logoUrl);
      } catch {
        // Ignore deletion errors for old logos
      }
    }

    const blob = await put(`logos/${partner.id}-${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    await db.partner.update({
      where: { id: partner.id },
      data: { logoUrl: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[PARTNER_LOGO_POST]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to upload logo: ${message}` },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partner = await getPartnerByClerkId(user.id);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    if (partner.logoUrl) {
      try {
        await del(partner.logoUrl);
      } catch {
        // Ignore deletion errors
      }
    }

    await db.partner.update({
      where: { id: partner.id },
      data: { logoUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PARTNER_LOGO_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to remove logo" },
      { status: 500 },
    );
  }
}
