"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, FolderOpen, ArrowLeft, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/library/document-card";
import type { SerializedDocument } from "@/app/(portal)/library/[slug]/page";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DocumentSearchProps {
  documents: SerializedDocument[];
  categoryName: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DocumentSearch({ documents, categoryName }: DocumentSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 250);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return documents;
    const lowerQuery = debouncedQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(lowerQuery) ||
        (doc.description && doc.description.toLowerCase().includes(lowerQuery))
    );
  }, [documents, debouncedQuery]);

  // Separate pinned and unpinned
  const pinned = filtered.filter((d) => d.isPinned);
  const unpinned = filtered.filter((d) => !d.isPinned);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
        <Link
          href="/library"
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          Library
        </Link>
        <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
        <span className="text-text-primary font-medium truncate">{categoryName}</span>
      </nav>

      {/* Back link + search row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link href="/library">
          <Button variant="ghost" size="sm" className="gap-1.5 text-text-secondary -ml-3">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>

        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <Input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder="Search by title or description..."
            className="pl-9 pr-8"
            aria-label={`Search documents in ${categoryName}`}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Document grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-12 w-12 text-text-muted mb-4" />
          {debouncedQuery.trim() ? (
            <>
              <p className="text-text-muted mb-1">
                No documents match your search for &ldquo;{debouncedQuery.trim()}&rdquo;
              </p>
              <p className="text-xs text-text-muted mb-4">
                Try adjusting your search terms or browse all documents in this category.
              </p>
              <Button variant="outline" size="sm" onClick={clearSearch} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Clear search
              </Button>
            </>
          ) : (
            <p className="text-text-muted">No documents in this category yet</p>
          )}
        </div>
      ) : (
        <>
          {debouncedQuery.trim() && (
            <p className="text-sm text-text-muted">
              {filtered.length} {filtered.length === 1 ? "result" : "results"} for &ldquo;{debouncedQuery.trim()}&rdquo;
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinned.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
            {unpinned.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
