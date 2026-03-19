import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@citrotech.com";

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
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${item.notes ?? "—"}</td>
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

  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: partner.email,
      subject: `Order ${order.orderNumber} — Confirmation`,
      html,
    });
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
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

  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: partner.email,
      subject: `Order ${order.orderNumber} — ${statusLabel}`,
      html,
    });
  } catch (err) {
    console.error("Failed to send order status update email:", err);
  }
}

/**
 * Sends an email notification when a new message is received in a conversation.
 */
export async function sendNewMessageNotification(
  conversation: ConversationEmailData,
  message: MessageEmailData,
  recipientEmail: string,
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

  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `New message in "${subjectLine}"`,
      html,
    });
  } catch (err) {
    console.error("Failed to send new message notification email:", err);
  }
}
