import { currentUser } from "@clerk/nextjs/server";
import { requireAuth, getRole, getPartnerByClerkId } from "@/lib/auth";
import { db } from "@/lib/db";
import { PortalShell } from "@/components/layout/portal-shell";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const [role, user] = await Promise.all([getRole(), currentUser()]);

  let unreadCount = 0;

  if (user) {
    const partner = await getPartnerByClerkId(user.id);
    if (partner) {
      unreadCount = await db.message.count({
        where: {
          senderType: "ADMIN",
          isReadByPartner: false,
          conversation: {
            partnerId: partner.id,
          },
        },
      });
    }
  }

  return (
    <PortalShell role={role} unreadCount={unreadCount}>
      {children}
    </PortalShell>
  );
}
