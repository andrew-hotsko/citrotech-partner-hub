import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

type Role = "partner" | "admin" | null;

/**
 * Reads the user's role from Clerk publicMetadata.
 * Returns "partner", "admin", or null if unauthenticated.
 */
export async function getRole(): Promise<Role> {
  const user = await currentUser();
  if (!user) return null;

  const role = (user.publicMetadata as { role?: string })?.role;
  if (role === "admin" || role === "partner") return role;
  return "partner"; // default role for authenticated users without explicit metadata
}

/**
 * Ensures the request is authenticated.
 * Returns the userId and role, or redirects to sign-in.
 */
export async function requireAuth(): Promise<{ userId: string; role: Role }> {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const role = await getRole();
  return { userId: user.id, role };
}

/**
 * Ensures the current user is an admin.
 * Redirects to / if not authenticated or not an admin.
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const { userId, role } = await requireAuth();
  if (role !== "admin") {
    redirect("/");
  }
  return { userId };
}

/**
 * Ensures the current user is a partner and returns their Partner record.
 * Redirects to sign-in if unauthenticated, or to / if not a partner.
 */
export async function requirePartner() {
  const { userId, role } = await requireAuth();
  if (role !== "partner" && role !== "admin") {
    redirect("/");
  }

  let partner = await getPartnerByClerkId(userId);

  // If no partner found by Clerk ID, try to find by email and link them.
  // This handles the race condition where a partner was invited (pending_ prefix)
  // but the webhook hasn't fired yet to update the clerkUserId.
  if (!partner) {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (email) {
      const pendingPartner = await db.partner.findUnique({
        where: { email },
      });

      if (pendingPartner && pendingPartner.clerkUserId.startsWith("pending_")) {
        // Link the pre-created partner to this Clerk user
        partner = await db.partner.update({
          where: { email },
          data: { clerkUserId: userId },
        });
      }
    }
  }

  if (!partner) {
    // Admin users without a Partner record should go to the admin dashboard
    if (role === "admin") {
      redirect("/admin");
    }
    redirect("/sign-in");
  }

  return partner;
}

/**
 * Queries the database for a Partner record by their Clerk user ID.
 */
export async function getPartnerByClerkId(clerkUserId: string) {
  return db.partner.findUnique({
    where: { clerkUserId },
  });
}
