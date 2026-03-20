import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requirePartner } from "@/lib/auth";
import { PageTransition } from "@/components/layout/page-transition";
import { DocumentSearch } from "@/components/library/document-search";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SerializedDocument {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  version: string | null;
  isPinned: boolean;
  downloadCount: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requirePartner();
  const { slug } = await params;

  const category = await db.documentCategory.findUnique({
    where: { slug },
    include: {
      documents: {
        where: { isPublic: true },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!category) {
    notFound();
  }

  const documents: SerializedDocument[] = category.documents.map((doc: typeof category.documents[number]) => ({
    id: doc.id,
    title: doc.title,
    description: doc.description,
    fileName: doc.fileName,
    fileUrl: doc.fileUrl,
    fileSize: doc.fileSize,
    fileType: doc.fileType,
    version: doc.version,
    isPinned: doc.isPinned,
    downloadCount: doc.downloadCount,
    createdAt: doc.createdAt.toISOString(),
  }));

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header with breadcrumb */}
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-1 text-sm text-text-secondary">
              {category.description}
            </p>
          )}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mt-2">
            <Link
              href="/library"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Library
            </Link>
            <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
            <span className="text-text-primary font-medium truncate">{category.name}</span>
          </nav>
        </div>

        {/* Search & Document List */}
        <DocumentSearch documents={documents} categoryName={category.name} />
      </div>
    </PageTransition>
  );
}
