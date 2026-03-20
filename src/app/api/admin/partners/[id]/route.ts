import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function requireAdminApi() {
  const user = await currentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = (user.publicMetadata as { role?: string })?.role;
  if (role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

/* ------------------------------------------------------------------ */
/*  PATCH – Deactivate / Reactivate a partner                         */
/* ------------------------------------------------------------------ */

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;

    const { id } = await params;
    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status || (status !== "ACTIVE" && status !== "INACTIVE")) {
      return NextResponse.json(
        { error: "Status must be ACTIVE or INACTIVE." },
        { status: 400 }
      );
    }

    // Find the partner
    const partner = await db.partner.findUnique({ where: { id } });
    if (!partner) {
      return NextResponse.json({ error: "Partner not found." }, { status: 404 });
    }

    // Update Clerk user ban status (skip for pending invitations)
    if (!partner.clerkUserId.startsWith("pending_")) {
      const client = await clerkClient();
      try {
        if (status === "INACTIVE") {
          await client.users.banUser(partner.clerkUserId);
        } else {
          await client.users.unbanUser(partner.clerkUserId);
        }
      } catch (clerkErr) {
        console.error("Clerk ban/unban error:", clerkErr);
        return NextResponse.json(
          { error: "Failed to update user access in Clerk." },
          { status: 500 }
        );
      }
    }

    // Update partner status in database
    const updated = await db.partner.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ partner: updated });
  } catch (err) {
    console.error("PATCH /api/admin/partners/[id] error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE – Permanently delete a partner and all related data         */
/* ------------------------------------------------------------------ */

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth && auth.error) return auth.error;

    const { id } = await params;

    // Find the partner
    const partner = await db.partner.findUnique({ where: { id } });
    if (!partner) {
      return NextResponse.json({ error: "Partner not found." }, { status: 404 });
    }

    // Delete user from Clerk (skip for pending invitations)
    if (!partner.clerkUserId.startsWith("pending_")) {
      const client = await clerkClient();
      try {
        await client.users.deleteUser(partner.clerkUserId);
      } catch (clerkErr) {
        console.error("Clerk delete user error:", clerkErr);
        // Continue with database cleanup even if Clerk deletion fails
        // (user may have already been removed from Clerk)
      }
    }

    // Delete all related data in a transaction
    await db.$transaction(async (tx) => {
      // Get conversation IDs for this partner
      const conversations = await tx.conversation.findMany({
        where: { partnerId: id },
        select: { id: true },
      });
      const conversationIds = conversations.map((c) => c.id);

      // Delete messages for all partner conversations
      if (conversationIds.length > 0) {
        await tx.message.deleteMany({
          where: { conversationId: { in: conversationIds } },
        });
      }

      // Delete conversations
      await tx.conversation.deleteMany({ where: { partnerId: id } });

      // Get order IDs for this partner
      const orders = await tx.order.findMany({
        where: { partnerId: id },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);

      // Delete order items
      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: { orderId: { in: orderIds } },
        });
      }

      // Delete orders
      await tx.order.deleteMany({ where: { partnerId: id } });

      // Delete the partner record
      await tx.partner.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/partners/[id] error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
