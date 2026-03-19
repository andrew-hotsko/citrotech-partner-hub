import Link from "next/link";
import {
  Megaphone,
  FileText,
  Wrench,
  BarChart3,
  Palette,
  GraduationCap,
  FolderOpen,
  Pin,
  type LucideIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { requirePartner } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/layout/page-transition";
import { LibraryGlobalSearch } from "@/components/library/library-global-search";
import { formatRelativeTime } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Icon Mapping                                                       */
/* ------------------------------------------------------------------ */

const iconMap: Record<string, LucideIcon> = {
  Megaphone,
  FileText,
  Wrench,
  BarChart3,
  Palette,
  GraduationCap,
};

function getCategoryIcon(iconName: string | null): LucideIcon {
  if (!iconName) return FolderOpen;
  return iconMap[iconName] ?? FolderOpen;
}

/* ------------------------------------------------------------------ */
/*  Category color mapping                                             */
/* ------------------------------------------------------------------ */

const categoryColors: Record<string, { bg: string; text: string; ring: string }> = {
  Megaphone:     { bg: "bg-orange-500/15", text: "text-orange-500", ring: "ring-orange-500/20" },
  FileText:      { bg: "bg-blue-500/15",   text: "text-blue-500",   ring: "ring-blue-500/20" },
  Wrench:        { bg: "bg-slate-500/15",  text: "text-slate-500",  ring: "ring-slate-500/20" },
  BarChart3:     { bg: "bg-emerald-500/15", text: "text-emerald-500", ring: "ring-emerald-500/20" },
  Palette:       { bg: "bg-purple-500/15", text: "text-purple-500", ring: "ring-purple-500/20" },
  GraduationCap: { bg: "bg-amber-500/15",  text: "text-amber-500",  ring: "ring-amber-500/20" },
};

function getCategoryColor(iconName: string | null) {
  if (!iconName) return { bg: "bg-forest-teal/15", text: "text-forest-teal", ring: "ring-forest-teal/20" };
  return categoryColors[iconName] ?? { bg: "bg-forest-teal/15", text: "text-forest-teal", ring: "ring-forest-teal/20" };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function LibraryPage() {
  await requirePartner();

  // Fetch categories with document count and most recent document
  const categories = await db.documentCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { documents: { where: { isPublic: true } } } },
      documents: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { title: true, createdAt: true },
      },
    },
  });

  // Fetch pinned documents across all categories
  const pinnedDocuments = await db.document.findMany({
    where: { isPublic: true, isPinned: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      category: { select: { name: true, slug: true } },
    },
  });

  // Fetch all public documents for global search
  const allDocuments = await db.document.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      fileType: true,
      fileSize: true,
      fileUrl: true,
      isPinned: true,
      version: true,
      downloadCount: true,
      createdAt: true,
      fileName: true,
      category: { select: { name: true, slug: true } },
    },
  });

  const serializedDocuments = allDocuments.map((doc) => ({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
  }));

  return (
    <PageTransition>
      <div className="space-y-8">
        <PageHeader
          title="Document Library"
          description="Browse resources, guides, and product documentation."
        />

        {/* Global search */}
        <LibraryGlobalSearch documents={serializedDocuments} />

        {/* Pinned / Featured Documents */}
        {pinnedDocuments.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Pin className="h-4 w-4 text-citro-orange" />
              <h2 className="text-base font-semibold font-display text-text-primary">
                Featured Documents
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pinnedDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/library/${doc.category.slug}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-citro-orange/20 bg-citro-orange/[0.03]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 rounded-full bg-citro-orange/15 p-2 ring-1 ring-citro-orange/20">
                          <FileText className="h-4 w-4 text-citro-orange" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-text-primary font-display line-clamp-1 group-hover:text-citro-orange transition-colors">
                            {doc.title}
                          </h3>
                          <p className="text-xs text-text-muted mt-0.5">
                            {doc.category.name}
                          </p>
                          {doc.description && (
                            <p className="text-xs text-text-muted mt-1 line-clamp-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Category grid */}
        <section>
          <h2 className="text-base font-semibold font-display text-text-primary mb-4">
            Categories
          </h2>

          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="h-12 w-12 text-text-muted mb-4" />
              <p className="text-text-muted">No categories available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category: typeof categories[number]) => {
                const Icon = getCategoryIcon(category.icon);
                const colors = getCategoryColor(category.icon);
                const latestDoc = category.documents[0];
                return (
                  <Link key={category.id} href={`/library/${category.slug}`}>
                    <Card className="h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-5">
                        <div className="flex gap-4">
                          <div
                            className={`shrink-0 self-start mt-0.5 rounded-full p-3 ring-1 transition-all duration-200 group-hover:scale-110 ${colors.bg} ${colors.ring}`}
                          >
                            <Icon className={`h-5 w-5 ${colors.text}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-text-primary font-display group-hover:text-citro-orange transition-colors">
                                {category.name}
                              </h3>
                              <Badge variant="outline" className="text-[10px] tabular-nums">
                                {category._count.documents} {category._count.documents === 1 ? "doc" : "docs"}
                              </Badge>
                            </div>
                            {category.description && (
                              <p className="text-xs text-text-muted mt-1 line-clamp-2">
                                {category.description}
                              </p>
                            )}
                            {latestDoc && (
                              <p className="text-[11px] text-text-muted mt-2 flex items-center gap-1.5 opacity-70">
                                <FileText className="h-3 w-3 shrink-0" />
                                <span className="truncate">{latestDoc.title}</span>
                                <span className="shrink-0">&middot;</span>
                                <span className="shrink-0 whitespace-nowrap">
                                  {formatRelativeTime(latestDoc.createdAt)}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
