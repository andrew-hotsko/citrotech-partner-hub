import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRole, getPartnerByClerkId } from "@/lib/auth";

// ---------------------------------------------------------------------------
// GET /api/conversations/[id] — Get conversation with messages
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const role = await getRole();

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        partner: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Partners can only view their own conversations
    if (role !== "admin") {
      const partner = await getPartnerByClerkId(user.id);
      if (!partner || conversation.partnerId !== partner.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Mark messages as read based on viewer role
    if (role === "admin") {
      await db.message.updateMany({
        where: {
          conversationId: id,
          isReadByAdmin: false,
        },
        data: { isReadByAdmin: true },
      });
    } else {
      await db.message.updateMany({
        where: {
          conversationId: id,
          isReadByPartner: false,
        },
        data: { isReadByPartner: true },
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("[CONVERSATION_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/conversations/[id] — Update conversation status (admin only)
// ---------------------------------------------------------------------------

const updateConversationSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED", "ARCHIVED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.conversation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const conversation = await db.conversation.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { partner: true, messages: true },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("[CONVERSATION_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 },
    );
  }
}
