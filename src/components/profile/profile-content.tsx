"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Pencil,
  Save,
  X,
  Loader2,
  Warehouse,
  Check,
  Upload,
  Globe,
  MapPin,
  Wrench,
  Building2,
  Users,
  Calendar,
  FileText,
  ExternalLink,
} from "lucide-react";
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
  warehouseCity: string | null;
  warehouseState: string | null;
  warehouseZip: string | null;
  warehouseSameAsBusiness: boolean;
  tier: PartnerTier;
  certifiedAt: string | null;
  certExpiresAt: string | null;
  insuranceExpiry: string | null;
  logoUrl: string | null;
  preferredContact: string | null;
  serviceTerritory: string | null;
  specializations: string[];
  websiteUrl: string | null;
  yearsInBusiness: number | null;
  crewSize: number | null;
  taxId: string | null;
  insuranceProvider: string | null;
  insurancePolicyNo: string | null;
  createdAt: string;
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
  warehouseCity: string;
  warehouseState: string;
  warehouseZip: string;
  warehouseSameAsBusiness: boolean;
  preferredContact: string;
  serviceTerritory: string;
  specializations: string[];
  websiteUrl: string;
  yearsInBusiness: string;
  crewSize: string;
  taxId: string;
  insuranceProvider: string;
  insurancePolicyNo: string;
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
    warehouseCity: partner.warehouseCity ?? "",
    warehouseState: partner.warehouseState ?? "",
    warehouseZip: partner.warehouseZip ?? "",
    warehouseSameAsBusiness: partner.warehouseSameAsBusiness ?? false,
    preferredContact: partner.preferredContact ?? "",
    serviceTerritory: partner.serviceTerritory ?? "",
    specializations: partner.specializations ?? [],
    websiteUrl: partner.websiteUrl ?? "",
    yearsInBusiness: partner.yearsInBusiness?.toString() ?? "",
    crewSize: partner.crewSize?.toString() ?? "",
    taxId: partner.taxId ?? "",
    insuranceProvider: partner.insuranceProvider ?? "",
    insurancePolicyNo: partner.insurancePolicyNo ?? "",
  };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SPECIALIZATION_OPTIONS = [
  "Residential",
  "Commercial",
  "Industrial",
  "Government",
  "Agricultural",
];

const CONTACT_METHODS = ["Phone", "Email", "Text"];

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

function formatFullAddress(
  street: string | null,
  city: string | null,
  state: string | null,
  zip: string | null,
): string | null {
  const parts = [street, [city, state, zip].filter(Boolean).join(", ")].filter(Boolean);
  return parts.length > 0 ? parts.join("\n") : null;
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
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
        className={cn("h-9", disabled && "opacity-50 cursor-not-allowed")}
        disabled={disabled}
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [fields, setFields] = useState<EditableFields>(
    getEditableDefaults(partner),
  );
  const [currentPartner, setCurrentPartner] = useState<PartnerProfile>(partner);

  const tier = tierConfig[currentPartner.tier];
  const certExpiry = getExpiryStatus(currentPartner.certExpiresAt);
  const insuranceExpiry = getExpiryStatus(currentPartner.insuranceExpiry);

  const displayAddress = [currentPartner.city, currentPartner.state, currentPartner.zip]
    .filter(Boolean)
    .join(", ");

  const warehouseDisplayAddress = currentPartner.warehouseSameAsBusiness
    ? formatFullAddress(currentPartner.address, currentPartner.city, currentPartner.state, currentPartner.zip)
    : formatFullAddress(currentPartner.warehouseAddress, currentPartner.warehouseCity, currentPartner.warehouseState, currentPartner.warehouseZip);

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

  function handleSameAsBusiness(checked: boolean) {
    setFields((prev) => ({
      ...prev,
      warehouseSameAsBusiness: checked,
      ...(checked
        ? {
            warehouseAddress: prev.address,
            warehouseCity: prev.city,
            warehouseState: prev.state,
            warehouseZip: prev.zip,
          }
        : {}),
    }));
  }

  function toggleSpecialization(spec: string) {
    setFields((prev) => {
      const has = prev.specializations.includes(spec);
      return {
        ...prev,
        specializations: has
          ? prev.specializations.filter((s) => s !== spec)
          : [...prev.specializations, spec],
      };
    });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/partner/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to upload logo");
      }

      const data = await res.json();
      setCurrentPartner((prev) => ({ ...prev, logoUrl: data.logoUrl }));
      toast.success("Logo uploaded successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload logo";
      toast.error(message);
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleLogoRemove() {
    setIsUploadingLogo(true);
    try {
      const res = await fetch("/api/partner/logo", {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove logo");
      }

      setCurrentPartner((prev) => ({ ...prev, logoUrl: null }));
      toast.success("Logo removed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove logo";
      toast.error(message);
    } finally {
      setIsUploadingLogo(false);
    }
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
          warehouseAddress: fields.warehouseSameAsBusiness ? fields.address : fields.warehouseAddress,
          warehouseCity: fields.warehouseSameAsBusiness ? fields.city : fields.warehouseCity,
          warehouseState: fields.warehouseSameAsBusiness ? fields.state : fields.warehouseState,
          warehouseZip: fields.warehouseSameAsBusiness ? fields.zip : fields.warehouseZip,
          warehouseSameAsBusiness: fields.warehouseSameAsBusiness,
          preferredContact: fields.preferredContact || null,
          serviceTerritory: fields.serviceTerritory,
          specializations: fields.specializations,
          websiteUrl: fields.websiteUrl,
          yearsInBusiness: fields.yearsInBusiness ? parseInt(fields.yearsInBusiness, 10) : null,
          crewSize: fields.crewSize ? parseInt(fields.crewSize, 10) : null,
          taxId: fields.taxId,
          insuranceProvider: fields.insuranceProvider,
          insurancePolicyNo: fields.insurancePolicyNo,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to update profile");
      }

      const updated = await res.json();

      setCurrentPartner((prev) => ({
        ...prev,
        phone: updated.phone,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        zip: updated.zip,
        contractorLicense: updated.contractorLicense,
        warehouseAddress: updated.warehouseAddress,
        warehouseCity: updated.warehouseCity,
        warehouseState: updated.warehouseState,
        warehouseZip: updated.warehouseZip,
        warehouseSameAsBusiness: updated.warehouseSameAsBusiness,
        logoUrl: prev.logoUrl,
        preferredContact: updated.preferredContact,
        serviceTerritory: updated.serviceTerritory,
        specializations: updated.specializations,
        websiteUrl: updated.websiteUrl,
        yearsInBusiness: updated.yearsInBusiness,
        crewSize: updated.crewSize,
        taxId: updated.taxId,
        insuranceProvider: updated.insuranceProvider,
        insurancePolicyNo: updated.insurancePolicyNo,
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
            {/* Logo section */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-default">
              {currentPartner.logoUrl ? (
                <img
                  src={currentPartner.logoUrl}
                  alt={`${currentPartner.companyName} logo`}
                  className="h-16 w-16 rounded-full object-cover border border-border-default"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-secondary-bg border border-border-default flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-text-muted" aria-hidden="true" />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-primary">
                  {currentPartner.companyName}
                </p>
                <p className="text-xs text-text-muted">Company Logo</p>
                {isEditing && (
                  <div className="flex items-center gap-2 pt-1">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                      />
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-border-default bg-primary-bg hover:bg-secondary-bg transition-colors",
                          isUploadingLogo && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        ) : (
                          <Upload className="h-3 w-3" aria-hidden="true" />
                        )}
                        {isUploadingLogo ? "Uploading..." : "Upload"}
                      </span>
                    </label>
                    {currentPartner.logoUrl && (
                      <button
                        type="button"
                        onClick={handleLogoRemove}
                        disabled={isUploadingLogo}
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={`${currentPartner.firstName} ${currentPartner.lastName}`}
                />
                <Field label="Email" value={currentPartner.email} />
                <Field label="Company" value={currentPartner.companyName} />
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse
                  className="h-5 w-5 text-text-muted"
                  aria-hidden="true"
                />
                <CardTitle>Warehouse / Default Shipping Address</CardTitle>
              </div>
              {!isEditing && !warehouseDisplayAddress && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleEdit}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Set Up Address
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {/* Same as business address checkbox */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={fields.warehouseSameAsBusiness}
                    onClick={() => handleSameAsBusiness(!fields.warehouseSameAsBusiness)}
                    className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                      fields.warehouseSameAsBusiness
                        ? "bg-citro-orange border-citro-orange"
                        : "border-border-default bg-primary-bg group-hover:border-citro-orange/50"
                    )}
                  >
                    {fields.warehouseSameAsBusiness && (
                      <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                    )}
                  </button>
                  <span className="text-sm text-text-primary">
                    Same as business address
                  </span>
                </label>

                {fields.warehouseSameAsBusiness ? (
                  <div className="rounded-lg border border-border-default bg-secondary-bg/50 p-4">
                    <p className="text-sm text-text-secondary">
                      {fields.address
                        ? `${fields.address}, ${[fields.city, fields.state, fields.zip].filter(Boolean).join(", ")}`
                        : "Fill in your business address above — it will be used as your warehouse address."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <EditableField
                        label="Warehouse Street Address"
                        value={fields.warehouseAddress}
                        onChange={(v) => updateField("warehouseAddress", v)}
                        placeholder="456 Warehouse Blvd"
                      />
                    </div>
                    <EditableField
                      label="City"
                      value={fields.warehouseCity}
                      onChange={(v) => updateField("warehouseCity", v)}
                      placeholder="Los Angeles"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <EditableField
                        label="State"
                        value={fields.warehouseState}
                        onChange={(v) => updateField("warehouseState", v)}
                        placeholder="CA"
                      />
                      <EditableField
                        label="ZIP Code"
                        value={fields.warehouseZip}
                        onChange={(v) => updateField("warehouseZip", v)}
                        placeholder="90001"
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-text-muted leading-relaxed">
                  This address will be used as the default shipping destination for your orders. You can override it per order.
                </p>
              </div>
            ) : (
              <div>
                {warehouseDisplayAddress ? (
                  <dl>
                    <div className="space-y-1">
                      <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                        Warehouse Address
                        {currentPartner.warehouseSameAsBusiness && (
                          <span className="ml-2 text-forest-teal font-normal normal-case">
                            (same as business)
                          </span>
                        )}
                      </dt>
                      <dd className="text-sm text-text-primary whitespace-pre-wrap">
                        {warehouseDisplayAddress}
                      </dd>
                      <p className="text-xs text-text-muted leading-relaxed pt-1">
                        This is your default shipping destination for orders.
                      </p>
                    </div>
                  </dl>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 gap-3">
                    <div className="h-12 w-12 rounded-full bg-citro-orange/10 flex items-center justify-center">
                      <Warehouse className="h-6 w-6 text-citro-orange" aria-hidden="true" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-text-primary">
                        No warehouse address set
                      </p>
                      <p className="text-xs text-text-muted max-w-sm">
                        Add your warehouse address to speed up order checkout. This will be your default shipping destination.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Business Details card */}
      <motion.div
        custom={2}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench
                className="h-5 w-5 text-text-muted"
                aria-hidden="true"
              />
              <CardTitle>Business Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <EditableField
                    label="Website URL"
                    value={fields.websiteUrl}
                    onChange={(v) => updateField("websiteUrl", v)}
                    placeholder="https://www.example.com"
                    type="url"
                  />
                  <EditableField
                    label="Service Territory"
                    value={fields.serviceTerritory}
                    onChange={(v) => updateField("serviceTerritory", v)}
                    placeholder="e.g. Southern California, Tri-State Area"
                  />
                  <EditableField
                    label="Years in Business"
                    value={fields.yearsInBusiness}
                    onChange={(v) => updateField("yearsInBusiness", v)}
                    placeholder="e.g. 10"
                    type="number"
                  />
                  <EditableField
                    label="Crew Size"
                    value={fields.crewSize}
                    onChange={(v) => updateField("crewSize", v)}
                    placeholder="e.g. 8"
                    type="number"
                  />
                </div>

                {/* Preferred Contact Method */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Preferred Contact Method
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {CONTACT_METHODS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => updateField("preferredContact", method)}
                        className={cn(
                          "h-9 px-4 rounded-md border-2 text-sm font-medium transition-all",
                          fields.preferredContact === method
                            ? "bg-citro-orange border-citro-orange text-white"
                            : "border-border-default bg-primary-bg text-text-primary hover:border-citro-orange/50"
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specializations */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Specializations
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {SPECIALIZATION_OPTIONS.map((spec) => {
                      const isSelected = fields.specializations.includes(spec);
                      return (
                        <label
                          key={spec}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={isSelected}
                            onClick={() => toggleSpecialization(spec)}
                            className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-citro-orange border-citro-orange"
                                : "border-border-default bg-primary-bg group-hover:border-citro-orange/50"
                            )}
                          >
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                            )}
                          </button>
                          <span className="text-sm text-text-primary">{spec}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Website
                  </dt>
                  <dd className="text-sm text-text-primary">
                    {currentPartner.websiteUrl ? (
                      <a
                        href={currentPartner.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-citro-orange hover:underline"
                      >
                        {currentPartner.websiteUrl.replace(/^https?:\/\//, "")}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-text-muted italic">Not provided</span>
                    )}
                  </dd>
                </div>
                <Field
                  label="Preferred Contact"
                  value={currentPartner.preferredContact}
                />
                <Field
                  label="Service Territory"
                  value={currentPartner.serviceTerritory}
                />
                <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                  <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Specializations
                  </dt>
                  <dd>
                    {currentPartner.specializations && currentPartner.specializations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {currentPartner.specializations.map((spec) => (
                          <Badge
                            key={spec}
                            className="bg-citro-orange/15 text-citro-orange"
                          >
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-text-muted italic">Not provided</span>
                    )}
                  </dd>
                </div>
                <Field
                  label="Years in Business"
                  value={currentPartner.yearsInBusiness?.toString() ?? null}
                />
                <Field
                  label="Crew Size"
                  value={currentPartner.crewSize?.toString() ?? null}
                />
              </dl>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Insurance & Compliance card */}
      <motion.div
        custom={3}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText
                className="h-5 w-5 text-text-muted"
                aria-hidden="true"
              />
              <CardTitle>Insurance &amp; Compliance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <EditableField
                  label="Tax ID / EIN"
                  value={fields.taxId}
                  onChange={(v) => updateField("taxId", v)}
                  placeholder="XX-XXXXXXX"
                />
                <EditableField
                  label="Insurance Provider"
                  value={fields.insuranceProvider}
                  onChange={(v) => updateField("insuranceProvider", v)}
                  placeholder="e.g. State Farm"
                />
                <EditableField
                  label="Policy Number"
                  value={fields.insurancePolicyNo}
                  onChange={(v) => updateField("insurancePolicyNo", v)}
                  placeholder="Policy #"
                />
              </div>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Tax ID / EIN" value={currentPartner.taxId} />
                <Field
                  label="Insurance Provider"
                  value={currentPartner.insuranceProvider}
                />
                <Field
                  label="Policy Number"
                  value={currentPartner.insurancePolicyNo}
                />
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
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Certification card */}
      <motion.div
        custom={4}
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
              <Field
                label="Member Since"
                value={formatDate(currentPartner.createdAt)}
              />
            </dl>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password & Security card */}
      <motion.div
        custom={5}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield
                className="h-5 w-5 text-text-muted"
                aria-hidden="true"
              />
              <CardTitle>Password &amp; Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Field
                label="Member Since"
                value={formatDate(currentPartner.createdAt)}
              />
              <div className="rounded-lg border border-border-default bg-secondary-bg/50 p-4">
                <p className="text-sm text-text-secondary leading-relaxed">
                  To change your password or manage security settings, please contact the CitroTech team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
