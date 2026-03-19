"use server";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const updatePartnerSchema = z.object({
  id: z.string().min(1),
  tier: z.enum(["REGISTERED", "CERTIFIED", "PREMIER"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
  certificationNotes: z.string().optional(),
});

export async function updatePartner(formData: z.infer<typeof updatePartnerSchema>) {
  await requireAdmin();

  const parsed = updatePartnerSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed" };
  }

  const { id, tier, status, certificationNotes } = parsed.data;

  try {
    const existing = await db.partner.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Partner not found" };
    }

    const data: Record<string, unknown> = {};
    if (tier !== undefined) data.tier = tier;
    if (status !== undefined) data.status = status;
    if (certificationNotes !== undefined) data.certificationNotes = certificationNotes;

    // If upgrading to CERTIFIED or PREMIER and no certifiedAt, set it
    if (tier && tier !== "REGISTERED" && !existing.certifiedAt) {
      data.certifiedAt = new Date();
    }

    await db.partner.update({ where: { id }, data });

    revalidatePath(`/admin/partners/${id}`);
    revalidatePath("/admin/partners");
    return { success: true };
  } catch {
    return { error: "Failed to update partner" };
  }
}
