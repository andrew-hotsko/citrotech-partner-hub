import { notFound } from "next/navigation";
import { requirePartner } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConversationDetail } from "@/components/messages/conversation-detail";

interface ConversationDetailPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const partner = await requirePartner();
  const { conversationId } = await params;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation || conversation.partnerId !== partner.id) {
    notFound();
  }

  // Mark unread admin messages as read
  await db.message.updateMany({
    where: {
      conversationId,
      senderType: "ADMIN",
      isReadByPartner: false,
    },
    data: { isReadByPartner: true },
  });

  return (
    <ConversationDetail
      conversation={{
        id: conversation.id,
        subject: conversation.subject,
        status: conversation.status,
        createdAt: conversation.createdAt.toISOString(),
        messages: conversation.messages.map(
          (m: (typeof conversation.messages)[number]) => ({
            id: m.id,
            senderType: m.senderType,
            senderName: m.senderName,
            body: m.body,
            createdAt: m.createdAt.toISOString(),
          })
        ),
      }}
    />
  );
}
