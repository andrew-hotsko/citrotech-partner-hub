"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, FileText, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GlobalSearchDocument {
  id: string;
  title: string;
  description: string | null;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  isPinned: boolean;
  version: string | null;
  downloadCount: number;
  createdAt: string;
  fileName: string;
  category: { name: string; slug: string };
}

interface LibraryGlobalSearchProps {
  documents: GlobalSearchDocument[];
}

/* ------------------------------------------------------------------ */
/*  File type badge colors (reused from document-card)                 */
/* ------------------------------------------------------------------ */

const fileTypeBadge: Record<string, string> = {
  PDF: "bg-red-500/15 text-red-600",
  DOCX: "bg-blue-500/15 text-blue-600",
  DOC: "bg-blue-500/15 text-blue-600",
  XLSX: "bg-green-500/15 text-green-600",
  XLS: "bg-green-500/15 text-green-600",
  PPTX: "bg-orange-500/15 text-orange-600",
  PPT: "bg-orange-500/15 text-orange-600",
  PNG: "bg-purple-500/15 text-purple-600",
  JPG: "bg-purple-500/15 text-purple-600",
  ZIP: "bg-yellow-500/15 text-yellow-700",
  CSV: "bg-green-500/15 text-green-600",
};

function getFileTypeBadgeClass(fileType: string): string {
  const upper = fileType.toUpperCase().replace(/^\./, "");
  return fileTypeBadge[upper] ?? "bg-gray-500/15 text-gray-600";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LibraryGlobalSearch({ documents }: LibraryGlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(value), 200);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const lowerQuery = debouncedQuery.toLowerCase();
    return documents
      .filter(
        (doc) =>
          doc.title.toLowerCase().includes(lowerQuery) ||
          (doc.description && doc.description.toLowerCase().includes(lowerQuery)) ||
          doc.category.name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8);
  }, [documents, debouncedQuery]);

  const showDropdown = isFocused && debouncedQuery.trim().length > 0;

  return (
    <div ref={containerRef} className="relative max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          placeholder="Search all documents across categories..."
          className="pl-11 pr-9 h-11 text-sm"
          aria-label="Search all documents"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-30"
          >
            <Card className="shadow-lg border-border overflow-hidden">
              <CardContent className="p-0">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center px-4">
                    <Search className="h-8 w-8 text-text-muted mb-2" />
                    <p className="text-sm text-text-muted">
                      No documents found for &ldquo;{debouncedQuery.trim()}&rdquo;
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {results.map((doc) => {
                      const fileTypeLabel = doc.fileType.toUpperCase().replace(/^\./, "");
                      return (
                        <li key={doc.id}>
                          <Link
                            href={`/library/${doc.category.slug}`}
                            onClick={() => setIsFocused(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary-bg transition-colors group min-h-[44px]"
                          >
                            <div
                              className={cn(
                                "shrink-0 rounded-full p-2",
                                getFileTypeBadgeClass(fileTypeLabel)
                              )}
                            >
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-text-primary line-clamp-1 group-hover:text-citro-orange transition-colors">
                                {doc.title}
                              </p>
                              <p className="text-xs text-text-muted mt-0.5">
                                {doc.category.name} &middot; {formatFileSize(doc.fileSize)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase shrink-0",
                                getFileTypeBadgeClass(fileTypeLabel)
                              )}
                            >
                              {fileTypeLabel}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {results.length > 0 && (
                  <div className="px-4 py-2.5 bg-secondary-bg/50 border-t border-border">
                    <p className="text-xs text-text-muted text-center">
                      Showing {results.length} of {documents.filter((d) => {
                        const lq = debouncedQuery.toLowerCase();
                        return d.title.toLowerCase().includes(lq) ||
                          (d.description && d.description.toLowerCase().includes(lq)) ||
                          d.category.name.toLowerCase().includes(lq);
                      }).length} results
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
