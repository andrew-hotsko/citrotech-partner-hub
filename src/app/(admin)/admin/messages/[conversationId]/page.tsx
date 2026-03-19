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

  return <ConversationDetailAdmin conversation={JSON.parse(JSON.stringify(conversation))} />;
}
