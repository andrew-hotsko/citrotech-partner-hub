import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRole, getPartnerByClerkId } from "@/lib/auth";
import { sendNewMessageNotification } from "@/lib/email";

// ---------------------------------------------------------------------------
// POST /api/conversations/[id]/messages — Add message to conversation
// ---------------------------------------------------------------------------

const createMessageSchema = z.object({
  body: z.string().min(1, "Message body is required"),
});

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
    const role = await getRole();

    // Verify conversation exists and user has access
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: { partner: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Partners can only post to their own conversations
    if (role !== "admin") {
      const partner = await getPartnerByClerkId(user.id);
      if (!partner || conversation.partnerId !== partner.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await req.json();
    const parsed = createMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const senderType = role === "admin" ? "ADMIN" : "PARTNER";
    const senderName =
      role === "admin"
        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Admin"
        : `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Partner";

    // Create message and update conversation timestamp in a transaction
    const [message] = await db.$transaction([
      db.message.create({
        data: {
          conversationId: id,
          senderType,
          senderName,
          senderClerkId: user.id,
          body: parsed.data.body,
          isReadByPartner: senderType === "PARTNER",
          isReadByAdmin: senderType === "ADMIN",
        },
      }),
      db.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    // Send email notification to the other party (non-blocking)
    const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS || process.env.ADMIN_EMAIL;
    if (senderType === "PARTNER" && adminEmails) {
      const recipients = adminEmails.split(",").map((e: string) => e.trim()).filter(Boolean);
      if (recipients.length > 0) {
        sendNewMessageNotification(
          { subject: conversation.subject },
          { senderName, body: parsed.data.body },
          recipients,
          "Admin",
        ).catch((err) => console.error("Message notification email failed:", err));
      }
    } else if (senderType === "ADMIN") {
      sendNewMessageNotification(
        { subject: conversation.subject },
        { senderName, body: parsed.data.body },
        conversation.partner.email,
        conversation.partner.firstName,
      ).catch((err) => console.error("Message notification email failed:", err));
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
