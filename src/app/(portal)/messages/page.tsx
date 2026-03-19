import { requirePartner } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConversationList } from "@/components/messages/conversation-list";

export default async function MessagesPage() {
  const partner = await requirePartner();

  const conversations = await db.conversation.findMany({
    where: { partnerId: partner.id },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: {
              senderType: "ADMIN",
              isReadByPartner: false,
            },
          },
        },
      },
    },
  });

  return (
    <ConversationList
      conversations={conversations.map((c: typeof conversations[number]) => ({
        id: c.id,
        subject: c.subject,
        status: c.status,
        lastMessageAt: c.lastMessageAt.toISOString(),
        lastMessage: c.messages[0]
          ? {
              body: c.messages[0].body,
              senderType: c.messages[0].senderType,
              senderName: c.messages[0].senderName,
            }
          : null,
        unreadCount: c._count.messages,
      }))}
    />
  );
}
