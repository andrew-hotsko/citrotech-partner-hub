"use client";

import React, { useState, useCallback } from "react";
import {
  Download,
  Pin,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileArchive,
  File,
  Presentation,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize, formatDate } from "@/lib/format";
import type { SerializedDocument } from "@/app/(portal)/library/[slug]/page";

/* ------------------------------------------------------------------ */
/*  File type badge colors                                             */
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
  JPEG: "bg-purple-500/15 text-purple-600",
  SVG: "bg-purple-500/15 text-purple-600",
  ZIP: "bg-yellow-500/15 text-yellow-700",
  CSV: "bg-green-500/15 text-green-600",
  TXT: "bg-gray-500/15 text-gray-600",
  MP4: "bg-pink-500/15 text-pink-600",
};

function getFileTypeBadgeClass(fileType: string): string {
  const upper = fileType.toUpperCase().replace(/^\./, "");
  return fileTypeBadge[upper] ?? "bg-gray-500/15 text-gray-600";
}

/* ------------------------------------------------------------------ */
/*  File type icon mapping                                             */
/* ------------------------------------------------------------------ */

function getFileTypeIcon(fileType: string) {
  const upper = fileType.toUpperCase().replace(/^\./, "");
  switch (upper) {
    case "PDF":
      return FileText;
    case "DOC":
    case "DOCX":
    case "TXT":
      return FileText;
    case "XLS":
    case "XLSX":
    case "CSV":
      return FileSpreadsheet;
    case "PPT":
    case "PPTX":
      return Presentation;
    case "PNG":
    case "JPG":
    case "JPEG":
    case "SVG":
    case "WEBP":
      return FileImage;
    case "MP4":
    case "MOV":
    case "AVI":
      return FileVideo;
    case "ZIP":
    case "RAR":
    case "7Z":
      return FileArchive;
    default:
      return File;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface DocumentCardProps {
  document: SerializedDocument;
}

export function DocumentCard({ document: doc }: DocumentCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [trackingError, setTrackingError] = useState(false);
  const fileTypeLabel = doc.fileType.toUpperCase().replace(/^\./, "");
  const FileIcon = getFileTypeIcon(fileTypeLabel);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    setTrackingError(false);

    try {
      const res = await fetch(`/api/documents/${doc.id}/download`, { method: "POST" });
      if (!res.ok) {
        setTrackingError(true);
      }
    } catch {
      setTrackingError(true);
    }

    window.open(doc.fileUrl, "_blank", "noopener");
    setDownloading(false);
  }, [doc.id, doc.fileUrl, downloading]);

  return (
    <Card className="h-full flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      <CardContent className="p-5 flex flex-col flex-1">
        {/* Main content row: icon | text | download */}
        <div className="flex gap-4">
          {/* Large file type icon in colored circle */}
          <div
            className={cn(
              "shrink-0 self-start mt-0.5 rounded-full p-3 ring-1 ring-current/10 transition-transform duration-200 group-hover:scale-110",
              getFileTypeBadgeClass(fileTypeLabel)
            )}
          >
            <FileIcon className="h-6 w-6" />
          </div>

          {/* Title, description, badges */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-text-primary font-display line-clamp-1 group-hover:text-citro-orange transition-colors">
                {doc.title}
              </h3>
              {doc.isPinned && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-citro-orange font-medium">
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              )}
            </div>

            {doc.description && (
              <p className="text-xs text-text-muted line-clamp-2 mt-1">
                {doc.description}
              </p>
            )}

            {/* Inline badges */}
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                  getFileTypeBadgeClass(fileTypeLabel)
                )}
              >
                {fileTypeLabel}
              </span>
              {doc.version && (
                <Badge variant="outline" className="text-[10px]">
                  v{doc.version}
                </Badge>
              )}
            </div>
          </div>

          {/* Download button -- desktop visible */}
          <div className="shrink-0 hidden sm:flex sm:items-start sm:pt-0.5">
            <Button
              size="sm"
              variant="default"
              onClick={handleDownload}
              loading={downloading}
              aria-label={`Download ${doc.title}`}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Tracking warning */}
        {trackingError && (
          <div className="flex items-center gap-1.5 text-xs text-yellow-600 mt-3">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Download tracking unavailable</span>
          </div>
        )}

        {/* Bottom row: meta + mobile download */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-4">
          <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
            <span>{formatFileSize(doc.fileSize)}</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {formatDate(doc.createdAt)}
            </span>
            <span
              className="inline-flex items-center gap-1"
              title={`Downloaded ${doc.downloadCount} ${doc.downloadCount === 1 ? "time" : "times"}`}
            >
              <Download className="h-3 w-3 shrink-0" />
              {doc.downloadCount}
            </span>
          </div>

          {/* Mobile download button */}
          <div className="sm:hidden">
            <Button
              size="sm"
              variant="default"
              onClick={handleDownload}
              loading={downloading}
              aria-label={`Download ${doc.title}`}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
