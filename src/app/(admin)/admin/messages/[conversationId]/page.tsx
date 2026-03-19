import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConversationDetailAdmin } from "@/components/admin/conversation-detail-admin";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function AdminConversationPage({ params }: ConversationPageProps) {
  await requireAdmin();
  const { conversationId } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      partner: true,
      messages: { orderBy: { createdAt: "asc" } },
      order: {
        select: { id: true, orderNumber: true },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  // Mark all partner messages as read by admin
  await db.message.updateMany({
    where: {
      conversationId,
      senderType: "PARTNER",
      isReadByAdmin: false,
    },
    data: { isReadByAdmin: true },
  });

  // Serialize with orderId and order reference
  const serialized = {
    ...JSON.parse(JSON.stringify(conversation)),
    orderId: (conversation as any).orderId ?? null,
    order: (conversation as any).order ?? null,
  };

  return <ConversationDetailAdmin conversation={serialized} />;
}
