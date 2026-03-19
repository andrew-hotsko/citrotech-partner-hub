import { requirePartner } from "@/lib/auth";
import { SupportContent } from "@/components/support/support-content";

export default async function SupportPage() {
  await requirePartner();

  return <SupportContent />;
}
