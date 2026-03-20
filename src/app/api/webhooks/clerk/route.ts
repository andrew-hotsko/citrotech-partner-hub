import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return new Response("Server misconfiguration", { status: 500 });
  }

  // Retrieve the svix headers for verification
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Read and verify the webhook payload
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const eventType = event.type;

  try {
    switch (eventType) {
      case "user.created": {
        const { id, email_addresses, first_name, last_name } = event.data;
        const primaryEmail = email_addresses?.[0]?.email_address;

        if (!primaryEmail) {
          console.error("user.created webhook missing email for user:", id);
          return new Response("Missing email", { status: 400 });
        }

        // Check if a partner was pre-created by admin (matching by email)
        const preCreated = await db.partner.findUnique({
          where: { email: primaryEmail },
        });

        if (preCreated) {
          // Link the existing partner record to this Clerk user
          const linkedPartner = await db.partner.update({
            where: { email: primaryEmail },
            data: {
              clerkUserId: id,
              firstName: first_name || preCreated.firstName,
              lastName: last_name || preCreated.lastName,
            },
          });
          console.log(`Linked pre-created partner to Clerk user: ${id}`);

          // For partners pre-created via the invite flow (clerkUserId starts
          // with "pending_"), a welcome email was already attempted during
          // invitation. We skip here to avoid duplicates. For partners
          // pre-created by other means, we send the welcome email now.
          if (preCreated.clerkUserId.startsWith("pending_")) {
            console.log(
              `[WEBHOOK] Skipping welcome email for ${primaryEmail} — already sent during invite flow`
            );
          } else {
            console.log(`[WEBHOOK] Sending welcome email for pre-created partner ${primaryEmail}`);
            await sendWelcomeEmail({
              firstName: linkedPartner.firstName,
              lastName: linkedPartner.lastName,
              email: linkedPartner.email,
              companyName: linkedPartner.companyName,
            });
          }
        } else {
          // Create a new partner record
          const newPartner = await db.partner.create({
            data: {
              clerkUserId: id,
              email: primaryEmail,
              firstName: first_name ?? "",
              lastName: last_name ?? "",
              companyName: "", // To be completed by partner during onboarding
            },
          });
          console.log(`Partner created for Clerk user: ${id}`);

          // Send welcome email for directly-created users
          await sendWelcomeEmail({
            firstName: newPartner.firstName,
            lastName: newPartner.lastName,
            email: newPartner.email,
            companyName: newPartner.companyName,
          });
        }

        break;
      }

      case "user.updated": {
        const { id, email_addresses } = event.data;
        const primaryEmail = email_addresses?.[0]?.email_address;

        if (!primaryEmail) break;

        const existingPartner = await db.partner.findUnique({
          where: { clerkUserId: id },
        });

        if (existingPartner && existingPartner.email !== primaryEmail) {
          await db.partner.update({
            where: { clerkUserId: id },
            data: { email: primaryEmail },
          });
          console.log(`Partner email updated for Clerk user: ${id}`);
        }

        break;
      }

      case "user.deleted": {
        const { id } = event.data;

        if (!id) break;

        const partner = await db.partner.findUnique({
          where: { clerkUserId: id },
        });

        if (partner) {
          await db.partner.update({
            where: { clerkUserId: id },
            data: { status: "INACTIVE" },
          });
          console.log(`Partner set to INACTIVE for Clerk user: ${id}`);
        }

        break;
      }

      default:
        // Unhandled event type - acknowledge receipt
        break;
    }
  } catch (err) {
    console.error(`Error processing webhook event ${eventType}:`, err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
