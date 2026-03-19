"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Pencil, Save, X, Loader2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PartnerTier = "REGISTERED" | "CERTIFIED" | "PREMIER";

interface PartnerProfile {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  contractorLicense: string | null;
  warehouseAddress: string | null;
  tier: PartnerTier;
  certifiedAt: string | null;
  certExpiresAt: string | null;
  insuranceExpiry: string | null;
}

interface ProfileContentProps {
  partner: PartnerProfile;
}

/* ------------------------------------------------------------------ */
/*  Editable fields definition                                         */
/* ------------------------------------------------------------------ */

interface EditableFields {
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contractorLicense: string;
  warehouseAddress: string;
}

function getEditableDefaults(partner: PartnerProfile): EditableFields {
  return {
    phone: partner.phone ?? "",
    address: partner.address ?? "",
    city: partner.city ?? "",
    state: partner.state ?? "",
    zip: partner.zip ?? "",
    contractorLicense: partner.contractorLicense ?? "",
    warehouseAddress: partner.warehouseAddress ?? "",
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const tierConfig: Record<PartnerTier, { label: string; className: string }> = {
  CERTIFIED: {
    label: "Certified Partner",
    className: "bg-citro-orange/15 text-citro-orange",
  },
  PREMIER: {
    label: "Premier Partner",
    className: "bg-forest-teal/15 text-forest-teal",
  },
  REGISTERED: {
    label: "Registered Partner",
    className: "bg-secondary-bg text-text-secondary",
  },
};

function getExpiryStatus(dateStr: string | null): {
  label: string;
  className: string;
} {
  if (!dateStr) return { label: "N/A", className: "text-text-muted" };

  const expiry = new Date(dateStr);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Expired (${formatDate(dateStr)})`, className: "text-red-600" };
  }
  if (diffDays <= 30) {
    return {
      label: `${formatDate(dateStr)} (${diffDays} days remaining)`,
      className: "text-amber-600",
    };
  }
  return { label: formatDate(dateStr), className: "text-green-600" };
}

/* ------------------------------------------------------------------ */
/*  Read-only field component                                          */
/* ------------------------------------------------------------------ */

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
        {label}
      </dt>
      <dd className={cn("text-sm text-text-primary", className)}>
        {value || <span className="text-text-muted italic">Not provided</span>}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editable field component                                           */
/* ------------------------------------------------------------------ */

function EditableField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-text-muted uppercase tracking-wider">
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.3, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProfileContent({ partner }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fields, setFields] = useState<EditableFields>(
    getEditableDefaults(partner),
  );
  // Live partner data that updates after a successful save
  const [currentPartner, setCurrentPartner] = useState<PartnerProfile>(partner);

  const tier = tierConfig[currentPartner.tier];
  const certExpiry = getExpiryStatus(currentPartner.certExpiresAt);
  const insuranceExpiry = getExpiryStatus(currentPartner.insuranceExpiry);

  const displayAddress = [currentPartner.city, currentPartner.state, currentPartner.zip]
    .filter(Boolean)
    .join(", ");

  function handleEdit() {
    setFields(getEditableDefaults(currentPartner));
    setIsEditing(true);
  }

  function handleCancel() {
    setFields(getEditableDefaults(currentPartner));
    setIsEditing(false);
  }

  function updateField<K extends keyof EditableFields>(
    key: K,
    value: EditableFields[K],
  ) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/partner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fields.phone,
          address: fields.address,
          city: fields.city,
          state: fields.state,
          zip: fields.zip,
          contractorLicense: fields.contractorLicense,
          warehouseAddress: fields.warehouseAddress,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to update profile");
      }

      const updated = await res.json();

      // Update local state with server response
      setCurrentPartner((prev) => ({
        ...prev,
        phone: updated.phone,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        zip: updated.zip,
        contractorLicense: updated.contractorLicense,
        warehouseAddress: updated.warehouseAddress,
      }));

      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Your partner account information"
      />

      {/* Partner info card */}
      <motion.div
        custom={0}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Partner Information</CardTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Read-only fields shown as static text */}
                <Field
                  label="Name"
                  value={`${currentPartner.firstName} ${currentPartner.lastName}`}
                />
                <Field label="Email" value={currentPartner.email} />
                <Field label="Company" value={currentPartner.companyName} />

                {/* Editable fields */}
                <EditableField
                  label="Phone"
                  value={fields.phone}
                  onChange={(v) => updateField("phone", v)}
                  placeholder="(555) 123-4567"
                  type="tel"
                />
                <EditableField
                  label="Street Address"
                  value={fields.address}
                  onChange={(v) => updateField("address", v)}
                  placeholder="123 Main St"
                />
                <EditableField
                  label="City"
                  value={fields.city}
                  onChange={(v) => updateField("city", v)}
                  placeholder="Los Angeles"
                />
                <EditableField
                  label="State"
                  value={fields.state}
                  onChange={(v) => updateField("state", v)}
                  placeholder="CA"
                />
                <EditableField
                  label="ZIP Code"
                  value={fields.zip}
                  onChange={(v) => updateField("zip", v)}
                  placeholder="90001"
                />
                <EditableField
                  label="Contractor License"
                  value={fields.contractorLicense}
                  onChange={(v) => updateField("contractorLicense", v)}
                  placeholder="License #"
                />
              </div>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={`${currentPartner.firstName} ${currentPartner.lastName}`}
                />
                <Field label="Email" value={currentPartner.email} />
                <Field label="Company" value={currentPartner.companyName} />
                <Field label="Phone" value={currentPartner.phone} />
                <Field
                  label="Street Address"
                  value={currentPartner.address}
                />
                <Field
                  label="City / State / ZIP"
                  value={displayAddress || null}
                />
                <Field
                  label="Contractor License"
                  value={currentPartner.contractorLicense}
                />
              </dl>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Warehouse / Default Shipping Address card */}
      <motion.div
        custom={1}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Warehouse
                className="h-5 w-5 text-text-muted"
                aria-hidden="true"
              />
              <CardTitle>Warehouse / Default Shipping Address</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Warehouse Address
                </Label>
                <Textarea
                  value={fields.warehouseAddress}
                  onChange={(e) => updateField("warehouseAddress", e.target.value)}
                  placeholder="Enter your full warehouse or default shipping address..."
                  rows={3}
                />
                <p className="text-xs text-text-muted leading-relaxed">
                  This address will be used as the default shipping destination for your orders. You can override it per order.
                </p>
              </div>
            ) : (
              <dl>
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Warehouse Address
                  </dt>
                  <dd className="text-sm text-text-primary whitespace-pre-wrap">
                    {currentPartner.warehouseAddress || (
                      <span className="text-text-muted italic">
                        Not provided &mdash; set up your warehouse address to speed up order checkout.
                      </span>
                    )}
                  </dd>
                  <p className="text-xs text-text-muted leading-relaxed pt-1">
                    This address will be used as the default shipping destination for your orders. You can override it per order.
                  </p>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Certification card */}
      <motion.div
        custom={2}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Shield
                  className="h-5 w-5 text-text-muted"
                  aria-hidden="true"
                />
                <CardTitle>Certification</CardTitle>
              </div>
              <Badge className={tier.className}>{tier.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Certified Date"
                value={
                  currentPartner.certifiedAt
                    ? formatDate(currentPartner.certifiedAt)
                    : null
                }
              />
              <div className="space-y-1">
                <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Certification Expires
                </dt>
                <dd className={cn("text-sm font-medium", certExpiry.className)}>
                  {certExpiry.label}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Insurance Expires
                </dt>
                <dd
                  className={cn(
                    "text-sm font-medium",
                    insuranceExpiry.className,
                  )}
                >
                  {insuranceExpiry.label}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
