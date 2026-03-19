"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Pencil,
  Trash2,
  Pin,
  Eye,
  EyeOff,
  Download,
  Loader2,
  CloudUpload,
  X,
  Search,
  Image as ImageIcon,
  FileSpreadsheet,
  FileType,
  File,
  FileVideo,
  FileArchive,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate, formatFileSize } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface DocumentData {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  version: string | null;
  isPublic: boolean;
  isPinned: boolean;
  tags: string[];
  categoryId: string;
  downloadCount: number;
  createdAt: string;
  category: Category;
}

interface DocumentsManagerProps {
  documents: DocumentData[];
  categories: Category[];
}

/* ------------------------------------------------------------------ */
/*  File type icon helper                                              */
/* ------------------------------------------------------------------ */

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return ImageIcon;
  if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv"))
    return FileSpreadsheet;
  if (fileType.includes("pdf")) return FileType;
  if (fileType.startsWith("video/")) return FileVideo;
  if (
    fileType.includes("zip") ||
    fileType.includes("tar") ||
    fileType.includes("rar") ||
    fileType.includes("gzip")
  )
    return FileArchive;
  if (
    fileType.includes("document") ||
    fileType.includes("word") ||
    fileType.includes("text")
  )
    return FileText;
  return File;
}

function getFileTypeLabel(fileType: string): string {
  const ext = fileType.split("/").pop()?.toUpperCase();
  if (!ext) return fileType;
  // Clean up common MIME sub-types
  if (ext.includes("PDF")) return "PDF";
  if (ext.includes("PNG")) return "PNG";
  if (ext.includes("JPEG") || ext.includes("JPG")) return "JPG";
  if (ext.includes("SVG")) return "SVG";
  if (ext.includes("ZIP")) return "ZIP";
  if (ext.includes("SPREADSHEET") || ext.includes("EXCEL")) return "XLS";
  if (ext.includes("DOCUMENT") || ext.includes("WORD")) return "DOC";
  if (ext.includes("CSV")) return "CSV";
  return ext.length > 6 ? ext.slice(0, 6) : ext;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DocumentsManager({
  documents: initialDocuments,
  categories,
}: DocumentsManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [documents] = useState(initialDocuments);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [version, setVersion] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editTags, setEditTags] = useState("");

  const [dragOver, setDragOver] = useState(false);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    let result = documents;

    if (categoryFilter !== "ALL") {
      result = result.filter((d) => d.categoryId === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [documents, categoryFilter, searchQuery]);

  const hasActiveFilters = searchQuery.trim() || categoryFilter !== "ALL";

  const resetUploadForm = useCallback(() => {
    setUploadFile(null);
    setUploadedUrl("");
    setUploadProgress(0);
    setTitle("");
    setDescription("");
    setCategoryId("");
    setVersion("");
    setIsPublic(true);
    setIsPinned(false);
    setTags("");
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Upload failed (${res.status})`);
        }
        const data = await res.json();
        setUploadedUrl(data.url);
        setUploadProgress(100);
        toast.success("File uploaded");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to upload file";
        toast.error(message);
        setUploadFile(null);
        setUploadProgress(0);
      } finally {
        clearInterval(progressInterval);
        setUploading(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleUploadSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!uploadFile || !uploadedUrl || !categoryId) {
        toast.error("Please upload a file and fill required fields");
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            fileName: uploadFile.name,
            fileUrl: uploadedUrl,
            fileSize: uploadFile.size,
            fileType: uploadFile.type || "application/octet-stream",
            version: version.trim() || undefined,
            isPublic,
            isPinned,
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            categoryId,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create document");
        }

        toast.success("Document created successfully");
        setUploadSheetOpen(false);
        resetUploadForm();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [uploadFile, uploadedUrl, categoryId, title, description, version, isPublic, isPinned, tags, resetUploadForm, router]
  );

  const openEditDialog = useCallback((doc: DocumentData) => {
    setSelectedDoc(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description ?? "");
    setEditCategoryId(doc.categoryId);
    setEditVersion(doc.version ?? "");
    setEditIsPublic(doc.isPublic);
    setEditIsPinned(doc.isPinned);
    setEditTags(doc.tags.join(", "));
    setEditDialogOpen(true);
  }, []);

  const handleEditSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDoc) return;

      setSubmitting(true);
      try {
        const res = await fetch(`/api/documents/${selectedDoc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription.trim() || undefined,
            categoryId: editCategoryId,
            version: editVersion.trim() || undefined,
            isPublic: editIsPublic,
            isPinned: editIsPinned,
            tags: editTags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update document");
        }

        toast.success("Document updated");
        setEditDialogOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [selectedDoc, editTitle, editDescription, editCategoryId, editVersion, editIsPublic, editIsPinned, editTags, router]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedDoc) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete document");
      toast.success("Document deleted");
      setDeleteDialogOpen(false);
      setSelectedDoc(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setSubmitting(false);
    }
  }, [selectedDoc, router]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Documents"
          description={`${documents.length} documents`}
        >
          <Button onClick={() => setUploadSheetOpen(true)}>
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </PageHeader>

        {/* Search and Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-[180px] h-10 shrink-0"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("ALL");
              }}
              className="text-xs text-citro-orange hover:text-citro-orange-dark font-medium transition-colors shrink-0 self-center"
            >
              Clear filters
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <p className="text-xs text-text-muted">
            Showing {filteredDocuments.length} of {documents.length} documents
          </p>
        )}

        {/* Documents Table - Desktop */}
        <div className="hidden md:block">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-text-secondary px-4 py-3">Title</th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">Category</th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">Type</th>
                    <th className="text-right font-medium text-text-secondary px-4 py-3">Size</th>
                    <th className="text-right font-medium text-text-secondary px-4 py-3">Downloads</th>
                    <th className="text-center font-medium text-text-secondary px-4 py-3">Public</th>
                    <th className="text-center font-medium text-text-secondary px-4 py-3">Pinned</th>
                    <th className="text-right font-medium text-text-secondary px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => {
                    const FileIcon = getFileIcon(doc.fileType);
                    return (
                      <tr
                        key={doc.id}
                        className="border-b border-border last:border-b-0 hover:bg-secondary-bg transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-secondary-bg flex items-center justify-center shrink-0">
                              <FileIcon className="h-4 w-4 text-text-muted" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-text-primary truncate">{doc.title}</p>
                              {doc.version && (
                                <p className="text-xs text-text-muted">v{doc.version}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{doc.category.name}</Badge>
                        </td>
                        <td className="px-4 py-3 text-text-muted font-mono text-xs">
                          {getFileTypeLabel(doc.fileType)}
                        </td>
                        <td className="px-4 py-3 text-right text-text-muted tabular-nums">
                          {formatFileSize(doc.fileSize)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                          <span className="flex items-center justify-end gap-1">
                            <Download className="h-3 w-3" />
                            {doc.downloadCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {doc.isPublic ? (
                            <Eye className="h-4 w-4 text-forest-teal mx-auto" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-text-muted mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {doc.isPinned && <Pin className="h-4 w-4 text-citro-orange mx-auto" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditDialog(doc)}
                              className="p-1.5 rounded-md hover:bg-card text-text-muted hover:text-text-primary transition-colors"
                              aria-label={`Edit ${doc.title}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setDeleteDialogOpen(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors"
                              aria-label={`Delete ${doc.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDocuments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                        {hasActiveFilters
                          ? "No documents match your search or filter."
                          : "No documents yet. Upload your first document."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Documents Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.fileType);
            return (
              <Card key={doc.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-secondary-bg flex items-center justify-center shrink-0">
                        <FileIcon className="h-4 w-4 text-text-muted" />
                      </div>
                      <p className="font-medium text-text-primary text-sm truncate">{doc.title}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {doc.isPinned && <Pin className="h-3.5 w-3.5 text-citro-orange" />}
                      {doc.isPublic ? (
                        <Eye className="h-3.5 w-3.5 text-forest-teal" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-text-muted" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                    <Badge variant="outline" className="text-xs">{doc.category.name}</Badge>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span className="flex items-center gap-0.5">
                      <Download className="h-3 w-3" /> {doc.downloadCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(doc)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDoc(doc);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          {filteredDocuments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-secondary-bg p-4 mb-4">
                <FileText className="h-8 w-8 text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">
                {hasActiveFilters
                  ? "No documents match your search or filter."
                  : "No documents yet"}
              </p>
            </div>
          )}
        </div>

        {/* Upload Sheet */}
        <Sheet
          open={uploadSheetOpen}
          onOpenChange={(open) => {
            setUploadSheetOpen(open);
            if (!open) resetUploadForm();
          }}
        >
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Upload Document</SheetTitle>
              <SheetDescription>
                Upload a file and configure its metadata.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleUploadSubmit} className="flex flex-col flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                {/* Drag & Drop Area */}
                <div
                  className={cn(
                    "relative rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer",
                    dragOver
                      ? "border-citro-orange bg-citro-orange-light scale-[1.02] shadow-lg shadow-citro-orange/10"
                      : uploadFile
                      ? "border-forest-teal bg-forest-teal-muted"
                      : "border-border hover:border-text-muted hover:bg-secondary-bg/50"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    // Only set false if leaving the container (not entering a child)
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOver(false);
                    }
                  }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload file"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />

                  {/* Drag over animation overlay */}
                  {dragOver && (
                    <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-citro-orange-light/80 pointer-events-none">
                      <div className="flex flex-col items-center gap-2">
                        <CloudUpload className="h-10 w-10 text-citro-orange animate-bounce" />
                        <p className="text-sm font-medium text-citro-orange">
                          Drop your file here
                        </p>
                      </div>
                    </div>
                  )}

                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-citro-orange animate-spin" />
                      <p className="text-sm text-text-secondary">Uploading...</p>
                      {/* Upload progress bar */}
                      <div className="w-full max-w-xs mx-auto">
                        <div className="h-2 w-full bg-secondary-bg rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-citro-orange rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(uploadProgress, 100)}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          />
                        </div>
                        <p className="text-[10px] text-text-muted text-center mt-1 tabular-nums">
                          {Math.round(uploadProgress)}%
                        </p>
                      </div>
                    </div>
                  ) : uploadFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-forest-teal" />
                      <p className="text-sm font-medium text-text-primary">{uploadFile.name}</p>
                      <p className="text-xs text-text-muted">{formatFileSize(uploadFile.size)}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          setUploadedUrl("");
                          setUploadProgress(0);
                        }}
                        className="text-xs text-red-500 hover:underline mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <CloudUpload className="h-8 w-8 text-text-muted" />
                      <p className="text-sm text-text-secondary">
                        Drag and drop a file here, or click to browse
                      </p>
                      <p className="text-[10px] text-text-muted">
                        PDF, DOC, XLS, images, and more
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-title" className="text-xs text-text-secondary">
                    Title *
                  </Label>
                  <Input
                    id="doc-title"
                    placeholder="Document title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-desc" className="text-xs text-text-secondary">
                    Description
                  </Label>
                  <Textarea
                    id="doc-desc"
                    placeholder="Brief description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-category" className="text-xs text-text-secondary">
                    Category *
                  </Label>
                  <Select
                    id="doc-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-version" className="text-xs text-text-secondary">
                    Version
                  </Label>
                  <Input
                    id="doc-version"
                    placeholder="e.g., 1.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-tags" className="text-xs text-text-secondary">
                    Tags (comma-separated)
                  </Label>
                  <Input
                    id="doc-tags"
                    placeholder="e.g., installation, manual, guide"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-citro-orange focus:ring-citro-orange accent-[var(--citro-orange)]"
                    />
                    <span className="text-sm text-text-primary">Public</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-citro-orange focus:ring-citro-orange accent-[var(--citro-orange)]"
                    />
                    <span className="text-sm text-text-primary">Pinned</span>
                  </label>
                </div>
              </div>

              <SheetFooter className="border-t border-border p-6">
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={!uploadedUrl || !title.trim() || !categoryId || submitting}
                  fullWidth
                >
                  {submitting ? "Creating..." : "Create Document"}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>
                Update the document metadata.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-xs text-text-secondary">
                  Title
                </Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc" className="text-xs text-text-secondary">
                  Description
                </Label>
                <Textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-xs text-text-secondary">
                  Category
                </Label>
                <Select
                  id="edit-category"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-version" className="text-xs text-text-secondary">
                  Version
                </Label>
                <Input
                  id="edit-version"
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags" className="text-xs text-text-secondary">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="edit-tags"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsPublic}
                    onChange={(e) => setEditIsPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-citro-orange focus:ring-citro-orange accent-[var(--citro-orange)]"
                  />
                  <span className="text-sm text-text-primary">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsPinned}
                    onChange={(e) => setEditIsPinned(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-citro-orange focus:ring-citro-orange accent-[var(--citro-orange)]"
                  />
                  <span className="text-sm text-text-primary">Pinned</span>
                </label>
              </div>
              <DialogFooter>
                <Button type="submit" loading={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Document</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;{selectedDoc?.title}&rdquo;? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} loading={submitting}>
                {submitting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
