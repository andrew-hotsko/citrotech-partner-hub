import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPartnerByClerkId } from "@/lib/auth";

// ---------------------------------------------------------------------------
// GET /api/partner/profile — Return the current partner's profile
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partner = await getPartnerByClerkId(user.id);
    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("[PARTNER_PROFILE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/partner/profile — Update editable partner fields
// ---------------------------------------------------------------------------

const updateProfileSchema = z.object({
  phone: z
    .string()
    .max(30, "Phone number is too long")
    .optional()
    .nullable(),
  address: z
    .string()
    .max(200, "Address is too long")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "City name is too long")
    .optional()
    .nullable(),
  state: z
    .string()
    .max(50, "State name is too long")
    .optional()
    .nullable(),
  zip: z
    .string()
    .max(20, "ZIP code is too long")
    .optional()
    .nullable(),
  contractorLicense: z
    .string()
    .max(100, "License number is too long")
    .optional()
    .nullable(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partner = await getPartnerByClerkId(user.id);
    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Build update data — only include fields that were actually sent
    const updateData: Record<string, string | null> = {};
    const allowedFields = [
      "phone",
      "address",
      "city",
      "state",
      "zip",
      "contractorLicense",
    ] as const;

    for (const field of allowedFields) {
      if (field in body) {
        const value = parsed.data[field];
        // Normalize empty strings to null
        updateData[field] = value?.trim() || null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const updatedPartner = await db.partner.update({
      where: { id: partner.id },
      data: updateData,
    });

    return NextResponse.json(updatedPartner);
  } catch (error) {
    console.error("[PARTNER_PROFILE_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
