import "server-only";
import { publicEnv } from "@/lib/env";
import { imageUrl } from "@/lib/images";
import { formatINR } from "@/lib/utils";
import type { Tables } from "@/types/database";
import { type EmailMessage, sendEmail, type SendResult } from "./mailer";

/**
 * Customer emails for order events. Templates are plain inline-styled HTML
 * (email clients ignore stylesheets) plus a text version.
 */

export type OrderEmailKind =
  "confirmation" | "shipped" | "delivered" | "cancelled";

type Order = Pick<
  Tables<"orders">,
  | "order_number"
  | "email"
  | "subtotal"
  | "discount_total"
  | "shipping_total"
  | "gst_total"
  | "total"
  | "coupon_code"
  | "shipping_address"
  | "gift_note"
  | "tracking_number"
  | "tracking_url"
>;
type OrderItem = Pick<
  Tables<"order_items">,
  | "product_name"
  | "variant_label"
  | "quantity"
  | "unit_price"
  | "line_total"
  | "image_path"
>;

type Address = {
  full_name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

const COPY: Record<
  OrderEmailKind,
  { subject: (n: string) => string; heading: string; intro: string }
> = {
  confirmation: {
    subject: (n) => `Order confirmed: ${n}`,
    heading: "Thank you for your order!",
    intro:
      "We've received your payment and our makers are getting your order ready.",
  },
  shipped: {
    subject: (n) => `Your order ${n} has shipped`,
    heading: "Your order is on its way",
    intro: "Good news: your parcel has left our studio.",
  },
  delivered: {
    subject: (n) => `Your order ${n} was delivered`,
    heading: "Your order has been delivered",
    intro:
      "We hope you love it! If anything isn't right, just reply to this email.",
  },
  cancelled: {
    subject: (n) => `Your order ${n} was cancelled`,
    heading: "Your order has been cancelled",
    intro:
      "If you've already paid, your refund will reach your original payment method within 5–7 business days.",
  },
};

export function buildOrderEmail(
  kind: OrderEmailKind,
  order: Order,
  items: OrderItem[],
): EmailMessage {
  const site = publicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const orderUrl = `${site}/account/orders/${encodeURIComponent(order.order_number)}`;
  const copy = COPY[kind];
  const address = (order.shipping_address ?? {}) as Address;
  const addressLines = [
    address.full_name,
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    address.pincode,
  ].filter((line): line is string => Boolean(line));

  const totals: [string, string][] = [
    ["Subtotal", formatINR(order.subtotal)],
    ...(order.discount_total > 0
      ? [
          [
            `Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`,
            `−${formatINR(order.discount_total)}`,
          ] as [string, string],
        ]
      : []),
    [
      "Shipping",
      order.shipping_total > 0 ? formatINR(order.shipping_total) : "Free",
    ],
    ["Total", formatINR(order.total)],
  ];

  const trackingHtml =
    kind === "shipped" && order.tracking_number
      ? `<p style="margin:16px 0 0;font-size:14px;">Tracking number: <strong>${escapeHtml(order.tracking_number)}</strong>${
          order.tracking_url
            ? ` · <a href="${escapeHtml(order.tracking_url)}" style="color:#4d0851;">Track your parcel</a>`
            : ""
        }</p>`
      : "";

  const itemRows = items
    .map((item) => {
      const img = imageUrl(item.image_path);
      return `<tr>
        <td style="padding:8px 0;width:56px;">${
          img
            ? `<img src="${escapeHtml(img)}" width="48" height="48" alt="" style="border-radius:8px;object-fit:cover;display:block;">`
            : ""
        }</td>
        <td style="padding:8px;font-size:14px;color:#111827;">${escapeHtml(item.product_name)}${
          item.variant_label
            ? `<br><span style="color:#6b7280;font-size:12px;">${escapeHtml(item.variant_label)}</span>`
            : ""
        }<br><span style="color:#6b7280;font-size:12px;">Qty ${item.quantity} × ${formatINR(item.unit_price)}</span></td>
        <td style="padding:8px 0;font-size:14px;text-align:right;white-space:nowrap;">${formatINR(item.line_total)}</td>
      </tr>`;
    })
    .join("");

  const totalRows = totals
    .map(
      ([label, value], i) => `<tr>
        <td style="padding:4px 0;font-size:${i === totals.length - 1 ? "16px;font-weight:bold;color:#111827" : "14px"};">${escapeHtml(label)}</td>
        <td style="padding:4px 0;text-align:right;font-size:${i === totals.length - 1 ? "16px;font-weight:bold;color:#4d0851" : "14px"};">${value}</td>
      </tr>`,
    )
    .join("");

  const html = `<div style="margin:0;padding:32px 16px;background:#f8ebf9;font-family:Arial,Helvetica,sans-serif;color:#374151;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
    <p style="margin:0 0 24px;font-size:20px;font-weight:bold;color:#4d0851;">Dream Needles</p>
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">${copy.heading}</h1>
    <p style="margin:0;font-size:15px;">${copy.intro}</p>
    <p style="margin:16px 0 0;font-size:14px;">Order <strong>${escapeHtml(order.order_number)}</strong></p>
    ${trackingHtml}
    <table role="presentation" width="100%" style="margin-top:24px;border-collapse:collapse;border-top:1px solid #f3e8ff;">${itemRows}</table>
    <table role="presentation" width="100%" style="margin-top:8px;border-collapse:collapse;border-top:1px solid #f3e8ff;">${totalRows}</table>
    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Includes ${formatINR(order.gst_total)} GST</p>
    ${
      addressLines.length
        ? `<p style="margin:24px 0 4px;font-size:13px;font-weight:bold;color:#111827;">Shipping to</p>
    <p style="margin:0;font-size:13px;line-height:20px;">${addressLines.map(escapeHtml).join("<br>")}</p>`
        : ""
    }
    ${order.gift_note ? `<p style="margin:16px 0 0;font-size:13px;"><strong>Gift note:</strong> ${escapeHtml(order.gift_note)}</p>` : ""}
    <p style="margin:28px 0 0;"><a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#4d0851;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 20px;border-radius:8px;">View your order</a></p>
  </div>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#6b7280;text-align:center;">Handmade with love · Dream Needles</p>
</div>`;

  const text = [
    "Dream Needles",
    "",
    copy.heading,
    copy.intro,
    "",
    `Order ${order.order_number}`,
    ...(kind === "shipped" && order.tracking_number
      ? [
          `Tracking number: ${order.tracking_number}${order.tracking_url ? ` (${order.tracking_url})` : ""}`,
        ]
      : []),
    "",
    ...items.map(
      (i) =>
        `${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ""} × ${i.quantity}: ${formatINR(i.line_total)}`,
    ),
    "",
    ...totals.map(([label, value]) => `${label}: ${value}`),
    `Includes ${formatINR(order.gst_total)} GST`,
    ...(addressLines.length ? ["", "Shipping to:", ...addressLines] : []),
    "",
    `View your order: ${orderUrl}`,
  ].join("\n");

  return {
    to: order.email,
    subject: copy.subject(order.order_number),
    html,
    text,
  };
}

/** Builds and sends an order email. Skips (with a warning) if SMTP isn't set up. */
export function sendOrderEmail(
  kind: OrderEmailKind,
  order: Order,
  items: OrderItem[],
): Promise<SendResult> {
  return sendEmail(buildOrderEmail(kind, order, items));
}
