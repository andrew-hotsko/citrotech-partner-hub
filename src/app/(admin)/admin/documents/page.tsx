import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DocumentsManager } from "@/components/admin/documents-manager";

export default async function AdminDocumentsPage() {
  await requireAdmin();

  const [documents, categories] = await Promise.all([
    db.document.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: { category: true },
    }),
    db.documentCategory.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <DocumentsManager
      documents={JSON.parse(JSON.stringify(documents))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
