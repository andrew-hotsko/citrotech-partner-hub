import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRole, getPartnerByClerkId } from "@/lib/auth";
import { sendNewMessageNotification } from "@/lib/email";

// ---------------------------------------------------------------------------
// GET /api/conversations — List conversations
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (role !== "admin") {
      const partner = await getPartnerByClerkId(user.id);
      if (!partner) {
        return NextResponse.json({ error: "Partner not found" }, { status: 404 });
      }
      where.partnerId = partner.id;
    }

    if (status) {
      where.status = status;
    }

    const conversations = await db.conversation.findMany({
      where,
      include: {
        ...(role === "admin" ? { partner: true } : {}),
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: role === "admin"
                ? { senderType: "PARTNER", isReadByAdmin: false }
                : { senderType: "ADMIN", isReadByPartner: false },
            },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[CONVERSATIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/conversations — Create a conversation with first message
// ---------------------------------------------------------------------------

const createConversationSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
  orderId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();

    const body = await req.json();
    const parsed = createConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { subject, body: messageBody, orderId } = parsed.data;

    // Determine sender identity
    const senderType = role === "admin" ? "ADMIN" : "PARTNER";
    const senderName =
      role === "admin"
        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Admin"
        : `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Partner";

    // Partners must have a partner record
    let partnerId: string;
    let partnerEmail: string | undefined;
    let partnerFirstName: string | undefined;

    if (role !== "admin") {
      const partner = await getPartnerByClerkId(user.id);
      if (!partner) {
        return NextResponse.json({ error: "Partner not found" }, { status: 404 });
      }
      partnerId = partner.id;
    } else {
      // Admin creating a conversation still needs a partnerId — reject if not provided
      // For admin-initiated conversations, the partner context must come from client
      return NextResponse.json(
        { error: "Admin cannot create conversations without a partner context. Use the partner's conversation endpoint." },
        { status: 400 },
      );
    }

    const conversation = await db.conversation.create({
      data: {
        partnerId,
        subject,
        orderId,
        messages: {
          create: {
            senderType,
            senderName,
            senderClerkId: user.id,
            body: messageBody,
            isReadByPartner: senderType === "PARTNER",
            isReadByAdmin: senderType === "ADMIN",
          },
        },
      },
      include: { messages: true, partner: true },
    });

    // Send email notification to admin(s) (non-blocking)
    const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS || process.env.ADMIN_EMAIL;
    if (senderType === "PARTNER" && adminEmails) {
      const recipients = adminEmails.split(",").map((e: string) => e.trim()).filter(Boolean);
      if (recipients.length > 0) {
        sendNewMessageNotification(
          { subject },
          { senderName, body: messageBody },
          recipients,
          "Admin",
        ).catch((err) => console.error("New conversation email failed:", err));
      }
    }

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("[CONVERSATIONS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}
