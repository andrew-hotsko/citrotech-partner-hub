"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Building2, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InvitePartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  phone: string;
}

const emptyForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  companyName: "",
  phone: "",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function InvitePartnerDialog({ open, onOpenChange }: InvitePartnerDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setErrors({});
  }, []);

  const validate = useCallback((): boolean => {
    const next: Partial<Record<keyof FormData, string>> = {};

    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
    if (!form.email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (!form.companyName.trim()) next.companyName = "Company name is required";

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setSubmitting(true);
      try {
        const res = await fetch("/api/admin/invite-partner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            companyName: form.companyName.trim(),
            phone: form.phone.trim() || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to invite partner");
        }

        toast.success(
          `Invitation sent to ${data.partner.firstName} ${data.partner.lastName}`,
          {
            description: `${data.partner.email} will receive a welcome email with sign-in instructions.`,
          }
        );

        onOpenChange(false);
        resetForm();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [form, validate, onOpenChange, resetForm, router]
  );

  const updateField = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear field error on change
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-citro-orange" />
            Invite Partner
          </DialogTitle>
          <DialogDescription>
            Send a white-glove invitation to join the CitroTech Certified Partner Program.
            They will receive a branded welcome email with sign-in instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 pt-4 space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="invite-first" className="text-xs text-text-secondary">
                  First Name *
                </Label>
                <Input
                  id="invite-first"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={updateField("firstName")}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-last" className="text-xs text-text-secondary">
                  Last Name *
                </Label>
                <Input
                  id="invite-last"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={updateField("lastName")}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-xs text-text-secondary flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email Address *
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="partner@company.com"
                value={form.email}
                onChange={updateField("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="invite-company" className="text-xs text-text-secondary flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Company Name *
              </Label>
              <Input
                id="invite-company"
                placeholder="Company name"
                value={form.companyName}
                onChange={updateField("companyName")}
                aria-invalid={!!errors.companyName}
              />
              {errors.companyName && (
                <p className="text-xs text-red-500">{errors.companyName}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div className="space-y-2">
              <Label htmlFor="invite-phone" className="text-xs text-text-secondary flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone
                <span className="text-text-muted font-normal">(optional)</span>
              </Label>
              <Input
                id="invite-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={updateField("phone")}
              />
            </div>

            {/* Info banner */}
            <div className="rounded-lg border border-citro-orange/20 bg-citro-orange/5 p-3">
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong className="text-citro-orange">What happens next:</strong> The partner
                will receive a Clerk invitation email to set up their password, plus a branded
                CitroTech welcome email with an overview of the Partner Hub features.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-border p-6 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              <Send className="h-4 w-4" />
              {submitting ? "Sending Invitation..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
