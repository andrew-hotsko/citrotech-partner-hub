import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getRole, getPartnerByClerkId } from "@/lib/auth";

// ---------------------------------------------------------------------------
// GET /api/conversations/unread — Count conversations with unread messages
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();

    let count: number;

    if (role === "admin") {
      // Count conversations that have at least one unread message sent by a partner
      count = await db.conversation.count({
        where: {
          messages: {
            some: {
              senderType: "PARTNER",
              isReadByAdmin: false,
            },
          },
        },
      });
    } else {
      const partner = await getPartnerByClerkId(user.id);
      if (!partner) {
        return NextResponse.json({ error: "Partner not found" }, { status: 404 });
      }

      // Count partner's conversations that have at least one unread message sent by admin
      count = await db.conversation.count({
        where: {
          partnerId: partner.id,
          messages: {
            some: {
              senderType: "ADMIN",
              isReadByPartner: false,
            },
          },
        },
      });
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error("[CONVERSATIONS_UNREAD]", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 },
    );
  }
}
