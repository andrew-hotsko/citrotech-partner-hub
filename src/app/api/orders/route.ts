import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRole, getPartnerByClerkId } from "@/lib/auth";
import { sendOrderConfirmation } from "@/lib/email";

// ---------------------------------------------------------------------------
// GET /api/orders — List orders
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (role !== "admin") {
      const partner = await getPartnerByClerkId(user.id);
      if (!partner) {
        return NextResponse.json({ error: "Partner not found" }, { status: 404 });
      }
      where.partnerId = partner.id;
    }

    if (status) {
      where.status = status;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        items: true,
        ...(role === "admin" ? { partner: true } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/orders — Create an order (partner only)
// ---------------------------------------------------------------------------

const orderItemSchema = z.object({
  product: z.enum(["MFB_31", "MFB_34"]),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  notes: z.string().optional(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  projectName: z.string().optional(),
  projectAddress: z.string().optional(),
  estimatedInstallDate: z.string().optional(),
  partnerNotes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getRole();
    if (role !== "partner") {
      return NextResponse.json(
        { error: "Only partners can create orders" },
        { status: 403 },
      );
    }

    const partner = await getPartnerByClerkId(user.id);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { items, projectName, projectAddress, estimatedInstallDate, partnerNotes } =
      parsed.data;

    // Generate order number inside a transaction to prevent race conditions
    const year = new Date().getFullYear();
    const orderNumberPrefix = `CPP-${year}-`;

    const order = await db.$transaction(async (tx) => {
      const lastOrder = await tx.order.findFirst({
        where: { orderNumber: { startsWith: orderNumberPrefix } },
        orderBy: { orderNumber: "desc" },
      });
      const nextNum = lastOrder
        ? parseInt(lastOrder.orderNumber.split("-")[2]) + 1
        : 1;
      const orderNumber = `${orderNumberPrefix}${String(nextNum).padStart(4, "0")}`;

      return tx.order.create({
        data: {
          orderNumber,
          partnerId: partner.id,
          projectName,
          projectAddress,
          estimatedInstallDate: estimatedInstallDate
            ? new Date(estimatedInstallDate)
            : undefined,
          partnerNotes,
          items: {
            create: items.map((item) => ({
              product: item.product,
              quantity: item.quantity,
              notes: item.notes,
            })),
          },
        },
        include: { items: true, partner: true },
      });
    });

    // Send confirmation email (non-blocking)
    sendOrderConfirmation(
      {
        orderNumber: order.orderNumber,
        projectName: order.projectName,
        status: order.status,
        items: order.items.map((i) => ({
          product: i.product,
          quantity: i.quantity,
          notes: i.notes,
        })),
      },
      {
        firstName: partner.firstName,
        lastName: partner.lastName,
        email: partner.email,
      },
    ).catch((err) => console.error("Order confirmation email failed:", err));

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[ORDERS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
