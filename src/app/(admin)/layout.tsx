import { requireAdmin, getRole } from "@/lib/auth";
import { PortalShell } from "@/components/layout/portal-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const role = await getRole();

  return (
    <PortalShell role={role} unreadCount={0} isAdmin>
      {children}
    </PortalShell>
  );
}
