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
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      { error: `Failed to fetch profile: ${message}` },
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
  warehouseAddress: z
    .string()
    .max(500, "Warehouse address is too long")
    .optional()
    .nullable(),
  warehouseCity: z
    .string()
    .max(100, "City name is too long")
    .optional()
    .nullable(),
  warehouseState: z
    .string()
    .max(50, "State name is too long")
    .optional()
    .nullable(),
  warehouseZip: z
    .string()
    .max(20, "ZIP code is too long")
    .optional()
    .nullable(),
  warehouseSameAsBusiness: z
    .boolean()
    .optional(),
  preferredContact: z.enum(["phone", "email", "text", "Phone", "Email", "Text"]).optional().nullable(),
  serviceTerritory: z.string().max(500, "Service territory is too long").optional().nullable(),
  specializations: z.array(z.string()).optional(),
  websiteUrl: z.string().max(200, "Website URL is too long").optional().nullable(),
  yearsInBusiness: z.number().int().min(0).max(200).optional().nullable(),
  crewSize: z.number().int().min(0).max(10000).optional().nullable(),
  taxId: z.string().max(50, "Tax ID is too long").optional().nullable(),
  insuranceProvider: z.string().max(200, "Insurance provider name is too long").optional().nullable(),
  insurancePolicyNo: z.string().max(100, "Policy number is too long").optional().nullable(),
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
    const updateData: Record<string, string | boolean | number | string[] | null> = {};
    const allowedFields = [
      "phone",
      "address",
      "city",
      "state",
      "zip",
      "contractorLicense",
      "warehouseAddress",
      "warehouseCity",
      "warehouseState",
      "warehouseZip",
      "warehouseSameAsBusiness",
      "preferredContact",
      "serviceTerritory",
      "specializations",
      "websiteUrl",
      "yearsInBusiness",
      "crewSize",
      "taxId",
      "insuranceProvider",
      "insurancePolicyNo",
    ] as const;

    for (const field of allowedFields) {
      if (field in body) {
        const value = parsed.data[field];
        if (typeof value === "boolean") {
          updateData[field] = value;
        } else if (typeof value === "number") {
          updateData[field] = value;
        } else if (Array.isArray(value)) {
          updateData[field] = value;
        } else {
          // Normalize empty strings to null
          updateData[field] = value?.trim() || null;
        }
      }
    }

    // If "same as business" is toggled on, copy business address to warehouse
    if (parsed.data.warehouseSameAsBusiness === true) {
      const current = await db.partner.findUnique({ where: { id: partner.id } });
      if (current) {
        updateData.warehouseAddress = current.address;
        updateData.warehouseCity = current.city;
        updateData.warehouseState = current.state;
        updateData.warehouseZip = current.zip;
      }
    }

    // Normalize preferredContact to lowercase for consistency
    if (updateData.preferredContact && typeof updateData.preferredContact === "string") {
      updateData.preferredContact = updateData.preferredContact.toLowerCase();
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
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      { error: `Failed to update profile: ${message}` },
      { status: 500 },
    );
  }
}
