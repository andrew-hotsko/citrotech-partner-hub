import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// POST /api/partners — Admin creates a new partner record
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (user.publicMetadata as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { firstName, lastName, email, companyName, tier } = body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !companyName?.trim()) {
      return NextResponse.json(
        { error: "First name, last name, email, and company name are required" },
        { status: 400 }
      );
    }

    // Check if a partner with this email already exists
    const existing = await db.partner.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A partner with this email already exists" },
        { status: 409 }
      );
    }

    // Create partner with a pending clerkUserId placeholder.
    // When the Clerk user is created (via webhook), we'll match by email and link them.
    const partner = await db.partner.create({
      data: {
        clerkUserId: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName.trim(),
        tier: tier || "CERTIFIED",
        status: "ACTIVE",
        certifiedAt: new Date(),
        certExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error("Error creating partner:", error);
    return NextResponse.json(
      { error: "Failed to create partner" },
      { status: 500 }
    );
  }
}
