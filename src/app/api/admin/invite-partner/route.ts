import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    // ── Auth check ────────────────────────────────────────────────
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (user.publicMetadata as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Parse body ────────────────────────────────────────────────
    const body = await req.json();
    const { firstName, lastName, email, companyName, phone } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      companyName?: string;
      phone?: string;
    };

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !companyName?.trim()) {
      return NextResponse.json(
        { error: "First name, last name, email, and company name are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // ── Check for existing partner ────────────────────────────────
    const existingPartner = await db.partner.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingPartner) {
      return NextResponse.json(
        { error: "A partner with this email address already exists." },
        { status: 409 }
      );
    }

    // ── Create Clerk invitation ───────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://citrotech-partner-hub.vercel.app";
    const client = await clerkClient();

    let invitation;
    try {
      invitation = await client.invitations.createInvitation({
        emailAddress: trimmedEmail,
        redirectUrl: `${appUrl}/sign-in`,
        publicMetadata: { role: "partner" },
      });
    } catch (clerkErr: unknown) {
      console.error("Clerk invitation error:", clerkErr);

      // Surface specific Clerk errors
      const errMessage =
        clerkErr instanceof Error ? clerkErr.message : "Failed to send invitation via Clerk.";

      // Check for duplicate invitation
      if (errMessage.toLowerCase().includes("already") || errMessage.toLowerCase().includes("duplicate")) {
        return NextResponse.json(
          { error: "An invitation has already been sent to this email address." },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: errMessage }, { status: 500 });
    }

    // ── Pre-create Partner record ─────────────────────────────────
    // Use a placeholder clerkUserId that will be replaced when the
    // webhook fires on user.created. The placeholder is prefixed so
    // we can identify un-linked records.
    const placeholderClerkId = `pending_${invitation.id}`;

    const partner = await db.partner.create({
      data: {
        clerkUserId: placeholderClerkId,
        email: trimmedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName.trim(),
        phone: phone?.trim() || null,
        tier: "REGISTERED",
        status: "ACTIVE",
      },
    });

    // ── Send branded welcome email ────────────────────────────────
    await sendWelcomeEmail({
      firstName: partner.firstName,
      lastName: partner.lastName,
      email: partner.email,
      companyName: partner.companyName,
    });

    return NextResponse.json(
      {
        success: true,
        partner: {
          id: partner.id,
          firstName: partner.firstName,
          lastName: partner.lastName,
          email: partner.email,
          companyName: partner.companyName,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Invite partner error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
