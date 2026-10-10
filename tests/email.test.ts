import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));
vi.mock("nodemailer", () => ({ default: { createTransport } }));

const SMTP = {
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "465",
  SMTP_USER: "store@gmail.com",
  SMTP_PASS: "abcd efgh ijkl mnop",
  EMAIL_FROM: "Dream Needles <store@gmail.com>",
};

const order = {
  order_number: "DN-261008-ABCDE",
  email: "customer@example.com",
  subtotal: 1199,
  discount_total: 100,
  shipping_total: 0,
  gst_total: 117.75,
  total: 1099,
  coupon_code: "WELCOME10",
  shipping_address: {
    full_name: "Asha <b>K</b>",
    line1: "12 Main Rd",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600017",
  },
  gift_note: null,
  tracking_number: "BD123456",
  tracking_url: "https://track.example.com/BD123456",
};
const items = [
  {
    product_name: "Tomato Keychain Red",
    variant_label: null,
    quantity: 2,
    unit_price: 200,
    line_total: 400,
    image_path: null,
  },
];

beforeEach(() => {
  vi.resetModules();
  sendMail.mockReset();
  createTransport.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dream-needles.vercel.app");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key-anon-key-anon-key");
  for (const key of Object.keys(SMTP)) vi.stubEnv(key, "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const configure = () => {
  for (const [key, value] of Object.entries(SMTP)) vi.stubEnv(key, value);
};

describe("emailEnv", () => {
  it("is null when SMTP isn't set up", async () => {
    const { emailEnv } = await import("@/lib/env");
    expect(emailEnv()).toBeNull();
  });

  it("is null with a warning when only partly set up", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { emailEnv } = await import("@/lib/env");
    expect(emailEnv()).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("SMTP_PASS"));
  });

  it("parses a complete setup", async () => {
    configure();
    const { emailEnv } = await import("@/lib/env");
    expect(emailEnv()).toMatchObject({
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: 465,
    });
  });
});

describe("sendEmail", () => {
  it("skips without throwing when SMTP isn't configured", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendOrderEmail } = await import("@/lib/email/order-emails");
    const result = await sendOrderEmail("confirmation", order, items);
    expect(result).toEqual({
      status: "skipped",
      reason: "SMTP not configured",
    });
    expect(createTransport).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it("sends over TLS on port 465 from EMAIL_FROM", async () => {
    configure();
    sendMail.mockResolvedValue({ messageId: "<1@gmail.com>" });
    const { sendOrderEmail } = await import("@/lib/email/order-emails");
    const result = await sendOrderEmail("confirmation", order, items);
    expect(result).toEqual({ status: "sent", messageId: "<1@gmail.com>" });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: SMTP.EMAIL_FROM,
        to: "customer@example.com",
        subject: "Order confirmed: DN-261008-ABCDE",
      }),
    );
  });

  it("never emails reserved test domains", async () => {
    configure();
    const { sendEmail } = await import("@/lib/email/mailer");
    const result = await sendEmail({
      to: "e2e-1@dreamneedles.test",
      subject: "s",
      html: "h",
      text: "t",
    });
    expect(result).toEqual({
      status: "skipped",
      reason: "reserved test domain",
    });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("uses STARTTLS on port 587 (e.g. Brevo)", async () => {
    configure();
    vi.stubEnv("SMTP_PORT", "587");
    sendMail.mockResolvedValue({ messageId: "x" });
    const { sendEmail } = await import("@/lib/email/mailer");
    await sendEmail({ to: "a@b.co", subject: "s", html: "h", text: "t" });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false }),
    );
  });

  it("reports SMTP failures instead of throwing", async () => {
    configure();
    sendMail.mockRejectedValue(new Error("Invalid login"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendEmail } = await import("@/lib/email/mailer");
    const result = await sendEmail({
      to: "a@b.co",
      subject: "s",
      html: "h",
      text: "t",
    });
    expect(result).toEqual({ status: "failed", error: "Invalid login" });
  });
});

describe("order email content", () => {
  it("escapes customer-entered text and shows totals", async () => {
    const { buildOrderEmail } = await import("@/lib/email/order-emails");
    const email = buildOrderEmail("confirmation", order, items);
    expect(email.html).toContain("Asha &lt;b&gt;K&lt;/b&gt;");
    expect(email.html).not.toContain("<b>K</b>");
    expect(email.text).toContain("Discount (WELCOME10): −₹100");
    expect(email.text).toContain("Shipping: Free");
    expect(email.text).toContain(
      "https://dream-needles.vercel.app/account/orders/DN-261008-ABCDE",
    );
  });

  it("includes tracking details only in the shipped email", async () => {
    const { buildOrderEmail } = await import("@/lib/email/order-emails");
    expect(buildOrderEmail("shipped", order, items).text).toContain(
      "Tracking number: BD123456",
    );
    expect(buildOrderEmail("delivered", order, items).text).not.toContain(
      "Tracking number",
    );
  });
});

describe("contact notification email", () => {
  it("goes to the support inbox with Reply-To set to the customer, escaped", async () => {
    const { buildContactEmail } = await import("@/lib/email/contact-email");
    const email = buildContactEmail(
      {
        name: "Asha <K>",
        email: "asha@example.com",
        phone: null,
        subject: "Custom order",
        message: "Blue <b>elephant</b> please",
      },
      "dreamneedles.store@gmail.com",
    );
    expect(email.to).toBe("dreamneedles.store@gmail.com");
    expect(email.replyTo).toBe("Asha K <asha@example.com>");
    expect(email.subject).toBe("Contact Us: Custom order (from Asha <K>)");
    expect(email.html).toContain("Blue &lt;b&gt;elephant&lt;/b&gt; please");
    expect(email.html).not.toContain("<b>elephant</b>");
    expect(email.text).toContain("Topic: Custom order");
  });
});
