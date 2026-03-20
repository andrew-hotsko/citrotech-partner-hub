import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (!resend) {
  console.warn(
    "[EMAIL] RESEND_API_KEY is not set — all outbound emails will be skipped. " +
    "Set this environment variable in your .env / Vercel dashboard to enable email delivery."
  );
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@citrotech.com";

if (FROM_EMAIL === "onboarding@resend.dev") {
  console.warn(
    "[EMAIL] RESEND_FROM_EMAIL is set to the Resend sandbox domain (onboarding@resend.dev). " +
    "Emails will ONLY be delivered to the Resend account owner's verified email. " +
    "Add and verify a custom domain in Resend to send to real partners."
  );
}

// ---------------------------------------------------------------------------
// Shared HTML template wrapper
// ---------------------------------------------------------------------------

function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#F97316;padding:24px 32px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                <span style="color:#ffffff;">Citro</span><span style="color:#0D0D0D;">Tech</span>
              </span>
              <span style="font-size:12px;color:rgba(255,255,255,0.85);margin-left:12px;letter-spacing:1px;text-transform:uppercase;">
                Partner Hub
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#fafaf8;border-top:1px solid #e5e5e5;font-size:12px;color:#a3a3a3;text-align:center;">
              &copy; ${new Date().getFullYear()} CitroTech. All rights reserved.<br />
              This is an automated notification from the CitroTech Partner Hub.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse ADMIN_NOTIFICATION_EMAILS env var (comma-separated) into an array.
 * Falls back to RESEND_FROM_EMAIL if not set.
 */
function getAdminNotificationEmails(): string[] {
  const envVal = process.env.ADMIN_NOTIFICATION_EMAILS;
  if (envVal && envVal.trim()) {
    return envVal.split(",").map((e) => e.trim()).filter(Boolean);
  }
  return [FROM_EMAIL];
}

/**
 * Extract and log detailed error information from Resend API errors.
 */
function logResendError(err: unknown) {
  if (err && typeof err === "object") {
    const resendErr = err as Record<string, unknown>;
    if (resendErr.statusCode || resendErr.name || resendErr.message) {
      console.error("[EMAIL] Resend API error details:", {
        statusCode: resendErr.statusCode,
        name: resendErr.name,
        message: resendErr.message,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Type definitions matching Prisma models (avoid heavy import)
// ---------------------------------------------------------------------------

interface OrderEmailData {
  orderNumber: string;
  projectName?: string | null;
  status: string;
  items?: Array<{ product: string; quantity: number; notes?: string | null }>;
}

interface PartnerEmailData {
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  tier?: string;
}

interface ConversationEmailData {
  subject?: string | null;
}

interface MessageEmailData {
  senderName: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Email senders
// ---------------------------------------------------------------------------

/**
 * Sends an order confirmation email to the partner after submission.
 */
export async function sendOrderConfirmation(
  order: OrderEmailData,
  partner: PartnerEmailData
) {
  const itemRows =
    order.items
      ?.map(
        (item) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${item.product}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${item.notes ?? "\u2014"}</td>
          </tr>`
      )
      .join("") ?? "";

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#171717;">Order Confirmed</h2>
    <p style="margin:0 0 24px;color:#525252;font-size:14px;line-height:1.6;">
      Hi ${partner.firstName}, your order <strong>${order.orderNumber}</strong> has been received
      ${order.projectName ? ` for project <strong>${order.projectName}</strong>` : ""}.
    </p>

    ${
      itemRows
        ? `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#404040;margin-bottom:24px;">
            <thead>
              <tr style="background:#fafaf8;">
                <th style="padding:8px 12px;text-align:left;font-weight:600;">Product</th>
                <th style="padding:8px 12px;text-align:center;font-weight:600;">Qty</th>
                <th style="padding:8px 12px;text-align:left;font-weight:600;">Notes</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>`
        : ""
    }

    <p style="margin:0;color:#525252;font-size:14px;line-height:1.6;">
      We'll notify you when the status of your order changes. You can also track it from your Partner Hub dashboard.
    </p>
  `);

  if (!resend) {
    console.warn("[EMAIL] Skipping order confirmation email — Resend client not initialized (missing RESEND_API_KEY)");
    return;
  }
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: partner.email,
      subject: `Order ${order.orderNumber} \u2014 Confirmation`,
      html,
    });
    console.log(`[EMAIL] Order confirmation sent to ${partner.email} for ${order.orderNumber}`, result);
  } catch (err: unknown) {
    console.error("Failed to send order confirmation email:", err);
    logResendError(err);
  }
}

/**
 * Sends an email when an order status changes.
 */
export async function sendOrderStatusUpdate(
  order: OrderEmailData,
  partner: PartnerEmailData,
  newStatus: string
) {
  const statusLabel = newStatus.charAt(0) + newStatus.slice(1).toLowerCase();

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#171717;">Order Status Update</h2>
    <p style="margin:0 0 16px;color:#525252;font-size:14px;line-height:1.6;">
      Hi ${partner.firstName}, your order <strong>${order.orderNumber}</strong> has been updated.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 20px;background:#fafaf8;border-radius:6px;font-size:14px;color:#171717;">
          New Status: <strong style="color:#F97316;">${statusLabel}</strong>
        </td>
      </tr>
    </table>

    ${order.projectName ? `<p style="margin:0 0 16px;color:#737373;font-size:13px;">Project: ${order.projectName}</p>` : ""}

    <p style="margin:0;color:#525252;font-size:14px;line-height:1.6;">
      Log in to your Partner Hub dashboard for full details.
    </p>
  `);

  if (!resend) {
    console.warn("[EMAIL] Skipping order status update email — Resend client not initialized (missing RESEND_API_KEY)");
    return;
  }
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: partner.email,
      subject: `Order ${order.orderNumber} \u2014 ${statusLabel}`,
      html,
    });
    console.log(`[EMAIL] Order status update sent to ${partner.email} for ${order.orderNumber}`, result);
  } catch (err: unknown) {
    console.error("Failed to send order status update email:", err);
    logResendError(err);
  }
}

/**
 * Sends an email notification when a new message is received in a conversation.
 * Supports multiple admin recipients via ADMIN_NOTIFICATION_EMAILS env var.
 */
export async function sendNewMessageNotification(
  conversation: ConversationEmailData,
  message: MessageEmailData,
  recipientEmail: string | string[],
  recipientName: string
) {
  const subjectLine = conversation.subject ?? "your conversation";

  // Truncate long messages for the email preview
  const previewBody =
    message.body.length > 300
      ? message.body.substring(0, 300) + "..."
      : message.body;

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#171717;">New Message</h2>
    <p style="margin:0 0 16px;color:#525252;font-size:14px;line-height:1.6;">
      Hi ${recipientName}, you have a new message in <strong>${subjectLine}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;background:#fafaf8;border-left:3px solid #F97316;border-radius:4px;">
          <p style="margin:0 0 6px;font-size:12px;color:#a3a3a3;font-weight:600;">${message.senderName}</p>
          <p style="margin:0;font-size:14px;color:#404040;line-height:1.6;white-space:pre-wrap;">${previewBody}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#525252;font-size:14px;line-height:1.6;">
      Log in to your Partner Hub to view and reply.
    </p>
  `);

  if (!resend) {
    console.warn("[EMAIL] Skipping new message notification email — Resend client not initialized (missing RESEND_API_KEY)");
    return;
  }

  // Support sending to multiple recipients
  const recipients = Array.isArray(recipientEmail) ? recipientEmail : [recipientEmail];

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: `New message in "${subjectLine}"`,
      html,
    });
    console.log(`[EMAIL] Message notification sent to ${recipients.join(", ")}`, result);
  } catch (err: unknown) {
    console.error("Failed to send new message notification email:", err);
    logResendError(err);
  }
}

// ---------------------------------------------------------------------------
// New email functions
// ---------------------------------------------------------------------------

/**
 * Sends a welcome email to a newly created partner.
 */
export async function sendWelcomeEmail(
  partner: PartnerEmailData
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://citrotech-partner-hub.vercel.app";

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#171717;">Welcome to the CitroTech Partner Hub!</h2>
    <p style="margin:0 0 20px;color:#525252;font-size:14px;line-height:1.6;">
      Hi ${partner.firstName}, congratulations! You've been invited to join the
      <strong>CitroTech Certified Partner Program</strong>.
    </p>

    <p style="margin:0 0 8px;color:#525252;font-size:14px;line-height:1.6;">
      ${partner.companyName ? `We're thrilled to have <strong>${partner.companyName}</strong> on board. ` : ""}As a certified partner, you now have access to:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;font-size:14px;color:#404040;">
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;">
          <strong style="color:#F97316;">Marketing Materials</strong> &mdash; Download brochures, spec sheets, and sales collateral
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;">
          <strong style="color:#F97316;">Product Orders</strong> &mdash; Place and track orders for MFB-31 and MFB-34 fire barriers
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;">
          <strong style="color:#F97316;">Direct Messaging</strong> &mdash; Communicate directly with the CitroTech team
        </td>
      </tr>
      <tr>
        <td style="padding:10px 16px;">
          <strong style="color:#F97316;">Announcements</strong> &mdash; Stay up to date with product news, training, and field notes
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="border-radius:6px;background:#F97316;">
          <a href="${appUrl}/sign-in" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
            Sign In to Your Partner Hub
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#737373;font-size:13px;line-height:1.6;">
      If you have any questions getting started, simply reply to this email or reach out through the messaging feature in the Partner Hub. We're here to help!
    </p>
  `);

  if (!resend) {
    console.warn("[EMAIL] Skipping welcome email — Resend client not initialized (missing RESEND_API_KEY)");
    return;
  }
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: partner.email,
      subject: "Welcome to the CitroTech Partner Hub!",
      html,
    });
    console.log(`[EMAIL] Welcome email sent to ${partner.email}`, result);
  } catch (err: unknown) {
    console.error("Failed to send welcome email:", err);
    logResendError(err);
  }
}

/**
 * Sends a notification to the ops/admin team when a new order is submitted.
 */
export async function sendOrderSubmittedNotification(
  order: {
    id: string;
    orderNumber: string;
    projectName?: string | null;
    projectAddress?: string | null;
    shippingAddress?: string | null;
    estimatedInstallDate?: Date | null;
    partnerNotes?: string | null;
    items: Array<{ product: string; quantity: number; notes?: string | null }>;
  },
  partner: PartnerEmailData
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://citrotech-partner-hub.vercel.app";
  const recipients = getAdminNotificationEmails();

  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${item.product}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${item.notes ?? "\u2014"}</td>
        </tr>`
    )
    .join("");

  const detailRows = [
    { label: "Order Number", value: order.orderNumber },
    { label: "Partner", value: `${partner.firstName} ${partner.lastName}` },
    { label: "Company", value: partner.companyName ?? "\u2014" },
    { label: "Tier", value: partner.tier ?? "\u2014" },
    { label: "Project Name", value: order.projectName ?? "\u2014" },
    { label: "Project Address", value: order.projectAddress ?? "\u2014" },
    { label: "Shipping Address", value: order.shippingAddress ?? "\u2014" },
    {
      label: "Est. Install Date",
      value: order.estimatedInstallDate
        ? new Date(order.estimatedInstallDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "\u2014",
    },
    { label: "Partner Notes", value: order.partnerNotes ?? "\u2014" },
  ]
    .map(
      (row) =>
        `<tr>
          <td style="padding:6px 12px;font-weight:600;color:#737373;font-size:13px;white-space:nowrap;vertical-align:top;">${row.label}</td>
          <td style="padding:6px 12px;font-size:13px;color:#171717;">${row.value}</td>
        </tr>`
    )
    .join("");

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#171717;">New Order Submitted</h2>
    <p style="margin:0 0 20px;color:#525252;font-size:14px;line-height:1.6;">
      A new order has been submitted and is awaiting confirmation.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;font-size:13px;">
      ${detailRows}
    </table>

    <h3 style="margin:0 0 8px;font-size:15px;color:#171717;">Order Items</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#404040;margin-bottom:24px;">
      <thead>
        <tr style="background:#fafaf8;">
          <th style="padding:8px 12px;text-align:left;font-weight:600;">Product</th>
          <th style="padding:8px 12px;text-align:center;font-weight:600;">Qty</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;">Notes</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td style="border-radius:6px;background:#F97316;">
          <a href="${appUrl}/admin/orders/${order.id}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
            View Order in Admin
          </a>
        </td>
      </tr>
    </table>
  `);

  if (!resend) {
    console.warn("[EMAIL] Skipping order submitted notification — Resend client not initialized (missing RESEND_API_KEY)");
    return;
  }
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: `[New Order] ${order.orderNumber} from ${partner.companyName ?? `${partner.firstName} ${partner.lastName}`}`,
      html,
    });
    console.log(`[EMAIL] Order submitted notification sent to ${recipients.join(", ")} for ${order.orderNumber}`, result);
  } catch (err: unknown) {
    console.error("Failed to send order submitted notification email:", err);
    logResendError(err);
  }
}

/**
 * Sends a shipping notification to the partner when their order has shipped.
 */
export async function sendOrderShippedNotification(
  order: {
    orderNumber: string;
    items?: Array<{ product: string; quantity: number }>;
  },
  partner: PartnerEmailData,
  trackingNumber?: string | null
) {
  const itemsSummary = order.items
    ?.map((item) => `${item.product} x ${item.quantity}`)
    .join(", ") ?? "";

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#171717;">Your Order Has Shipped!</h2>
    <p style="margin:0 0 20px;color:#525252;font-size:14px;line-height:1.6;">
      Hi ${partner.firstName}, great news! Your order <strong>${order.orderNumber}</strong> is on its way.
    </p>

    ${
      trackingNumber
        ? `<table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr>
              <td style="padding:14px 20px;background:#fafaf8;border-left:3px solid #F97316;border-radius:4px;">
                <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;font-weight:600;">Tracking Number</p>
                <p style="margin:0;font-size:16px;color:#171717;font-weight:600;font-family:monospace;">${trackingNumber}</p>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 20px;color:#737373;font-size:13px;line-height:1.6;">
            Use this tracking number with your carrier to follow your shipment's progress.
          </p>`
        : ""
    }

    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:12px 20px;background:#fafaf8;border-radius:6px;font-size:14px;color:#171717;">
          Estimated delivery: <strong>5\u20137 business days</strong>
        </td>
      </tr>
    </table>

    ${
      itemsSummary
        ? `<p style="margin:0 0 20px;color:#737373;font-size:13px;">Items: ${itemsSummary}</p>`
        : ""
    }

    <p style="margin:0;color:#525252;font-size:14px;line-height:1.6;">
      Log in to your Partner Hub dashboard to view full order details.
    </p>
  `);

  if (!resend) {
    console.warn("[EMAIL] Skipping order shipped notification — Resend client not initialized (missing RESEND_API_KEY)");
    return;
  }
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: partner.email,
      subject: `Your Order ${order.orderNumber} Has Shipped!`,
      html,
    });
    console.log(`[EMAIL] Order shipped notification sent to ${partner.email} for ${order.orderNumber}`, result);
  } catch (err: unknown) {
    console.error("Failed to send order shipped notification email:", err);
    logResendError(err);
  }
}

/**
 * Sends a certification expiry reminder to a partner.
 * Subject urgency varies based on days until expiry.
 */
export async function sendCertExpiryReminder(
  partner: PartnerEmailData & { certExpiresAt?: Date | null },
  daysUntilExpiry: number
) {
  let subject: string;
  let urgencyColor: string;

  if (daysUntilExpiry <= 7) {
    subject = "URGENT: Certification Expires in 7 Days";
    urgencyColor = "#DC2626"; // red
  } else if (daysUntilExpiry <= 14) {
    subject = "Certification Expiring Soon";
    urgencyColor = "#F97316"; // orange
  } else {
    subject = "Certification Renewal Reminder";
    urgencyColor = "#EAB308"; // yellow
  }

  const expiryDateStr = partner.certExpiresAt
    ? new Date(partner.certExpiresAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "soon";

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#171717;">${subject}</h2>
    <p style="margin:0 0 20px;color:#525252;font-size:14px;line-height:1.6;">
      Hi ${partner.firstName}, this is a reminder that your CitroTech Certified Partner certification
      is set to expire on <strong style="color:${urgencyColor};">${expiryDateStr}</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:14px 20px;background:#fafaf8;border-left:3px solid ${urgencyColor};border-radius:4px;">
          <p style="margin:0;font-size:14px;color:#171717;line-height:1.6;">
            <strong>${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}</strong> remaining until your certification expires.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;color:#525252;font-size:14px;line-height:1.6;">
      To renew your certification, please contact the CitroTech team:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#525252;font-size:14px;line-height:1.8;">
      <li>Send a message through the Partner Hub</li>
      <li>Email us at <a href="mailto:${FROM_EMAIL}" style="color:#F97316;">${FROM_EMAIL}</a></li>
      <li>Call the partner support line</li>
    </ul>

    <p style="margin:0;color:#737373;font-size:13px;line-height:1.6;">
      An expired certification may affect your ability to place orders and access partner resources.
      Please renew as soon as possible to avoid any interruption.
    </p>
  `);

  if (!resend) {
    console.warn("[EMAIL] Skipping cert expiry reminder — Resend client not initialized (missing RESEND_API_KEY)");
    return;
  }
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: partner.email,
      subject,
      html,
    });
    console.log(`[EMAIL] Cert expiry reminder sent to ${partner.email}`, result);
  } catch (err: unknown) {
    console.error("Failed to send cert expiry reminder email:", err);
    logResendError(err);
  }
}
