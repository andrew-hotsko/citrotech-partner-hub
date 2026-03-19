import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRole, getPartnerByClerkId } from "@/lib/auth";
import { sendOrderStatusUpdate, sendOrderShippedNotification } from "@/lib/email";

// ---------------------------------------------------------------------------
// GET /api/orders/[id] — Get order detail
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const role = await getRole();

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true, partner: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Partners can only view their own orders
    if (role !== "admin") {
      const partner = await getPartnerByClerkId(user.id);
      if (!partner || order.partnerId !== partner.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/orders/[id] — Update order (admin only)
// ---------------------------------------------------------------------------

const updateOrderSchema = z.object({
  status: z
    .enum(["SUBMITTED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    .optional(),
  adminNotes: z.string().optional(),
  trackingNumber: z.string().optional(),
  paymentStatus: z.enum(["PENDING", "INVOICED", "PAID"]).optional(),
  invoiceNumber: z.string().optional(),
  estimatedShipDate: z.string().optional(),
  shippingAddress: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await db.order.findUnique({
      where: { id },
      include: { partner: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { status, adminNotes, trackingNumber, paymentStatus, invoiceNumber, estimatedShipDate, shippingAddress } = parsed.data;

    // Validate status transition
    if (status && status !== existing.status) {
      const validTransitions: Record<string, string[]> = {
        SUBMITTED: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["PROCESSING", "CANCELLED"],
        PROCESSING: ["SHIPPED", "CANCELLED"],
        SHIPPED: ["DELIVERED", "CANCELLED"],
        DELIVERED: ["CANCELLED"],
        CANCELLED: [],
      };

      const allowed = validTransitions[existing.status] ?? [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${existing.status} to ${status}`,
          },
          { status: 400 },
        );
      }
    }

    // Build timestamp updates based on status transitions
    const timestamps: Record<string, Date> = {};
    if (status && status !== existing.status) {
      const now = new Date();
      if (status === "CONFIRMED" && !existing.confirmedAt) {
        timestamps.confirmedAt = now;
      }
      if (status === "SHIPPED" && !existing.shippedAt) {
        timestamps.shippedAt = now;
      }
      if (status === "DELIVERED" && !existing.deliveredAt) {
        timestamps.deliveredAt = now;
      }
    }

    const order = await db.order.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(trackingNumber !== undefined ? { trackingNumber } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(invoiceNumber !== undefined ? { invoiceNumber } : {}),
        ...(estimatedShipDate !== undefined
          ? { estimatedShipDate: estimatedShipDate ? new Date(estimatedShipDate) : null }
          : {}),
        ...(shippingAddress !== undefined ? { shippingAddress } : {}),
        ...timestamps,
      },
      include: { items: true, partner: true },
    });

    // Send status update email if status changed
    if (status && status !== existing.status) {
      sendOrderStatusUpdate(
        {
          orderNumber: order.orderNumber,
          projectName: order.projectName,
          status: order.status,
        },
        {
          firstName: existing.partner.firstName,
          lastName: existing.partner.lastName,
          email: existing.partner.email,
        },
        status,
      ).catch((err) => console.error("Order status email failed:", err));

      // Send shipped notification with tracking info when status changes to SHIPPED
      if (status === "SHIPPED") {
        sendOrderShippedNotification(
          {
            orderNumber: order.orderNumber,
            items: order.items.map((i) => ({
              product: i.product,
              quantity: i.quantity,
            })),
          },
          {
            firstName: existing.partner.firstName,
            lastName: existing.partner.lastName,
            email: existing.partner.email,
          },
          order.trackingNumber,
        ).catch((err) => console.error("Order shipped notification email failed:", err));
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}
