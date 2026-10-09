import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { expect, test } from "@playwright/test";

/**
 * Full checkout against the real Supabase project and Razorpay TEST keys:
 * address → coupon → Razorpay order → signed success callback → paid order,
 * stock decremented once, webhook replay is a no-op. Everything is cleaned up.
 */
config({ path: ".env.local", quiet: true });
const env = process.env;
const ready =
  env.NEXT_PUBLIC_SUPABASE_URL &&
  env.SUPABASE_SERVICE_ROLE_KEY &&
  env.RAZORPAY_KEY_SECRET &&
  env.RAZORPAY_WEBHOOK_SECRET;
const admin = ready
  ? createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  : null;
const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("hex");

test.skip(!ready, "Needs Supabase + Razorpay test keys in .env.local");

const email = `e2e-checkout-${Date.now()}@dreamneedles.test`;
const COUPON = `E2E${Date.now().toString().slice(-6)}`;
const SLUG = "tomato-keychain-red";
let userId: string | undefined;
let product: { id: string; stock: number; price: number };

test.beforeAll(async () => {
  const { data } = await admin!
    .from("products")
    .select("id, stock, price")
    .eq("slug", SLUG)
    .single();
  product = data!;
  await admin!
    .from("coupons")
    .insert({
      code: COUPON,
      discount_type: "percent",
      value: 10,
      description: "e2e",
    });
});

test.afterAll(async () => {
  await admin!
    .from("products")
    .update({ stock: product.stock })
    .eq("id", product.id);
  await admin!.from("coupons").delete().eq("code", COUPON);
  if (userId) {
    await admin!.from("orders").delete().eq("user_id", userId);
    await admin!.auth.admin.deleteUser(userId);
  }
});

test("pay for an order with Razorpay (test mode)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "runs once");
  test.setTimeout(120_000);
  const { data: link } = await admin!.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  userId = link.user!.id;

  // Sign in, then add an item.
  await page.goto(
    `/login/verify?email=${encodeURIComponent(email)}&next=/products/${SLUG}`,
    { waitUntil: "networkidle" },
  );
  await page.getByLabel("Digit 1").fill(link.properties!.email_otp);
  await page.waitForURL(`**/products/${SLUG}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: /Add to Cart/ }).click();
  await expect(
    page.getByRole("button", { name: "Cart, 2 items" }),
  ).toBeVisible();

  // Checkout: add an address.
  await page.goto("/checkout", { waitUntil: "networkidle" });
  await expect(page.getByText(email)).toBeVisible();
  await page.getByLabel("Full name").fill("Test Maker");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel(/Flat \/ house no/).fill("12 Main Road");
  await page.getByLabel("Pincode").fill("600017");
  await expect(page.getByLabel("City / district")).toHaveValue(/Chennai/);
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByRole("radio", { checked: true })).toBeVisible();

  // Coupon: wrong code, then the real one.
  const summary = page.getByRole("complementary", { name: "Order summary" });
  await summary.getByPlaceholder("Discount code or gift card").fill("NOPE123");
  await summary.getByRole("button", { name: "Apply" }).click();
  await expect(summary.getByText("That code isn't valid.")).toBeVisible();
  await summary.getByPlaceholder("Discount code or gift card").fill(COUPON);
  await summary.getByRole("button", { name: "Apply" }).click();
  await expect(summary.getByText(`${COUPON} applied`)).toBeVisible();

  // Pay Now → server creates the Razorpay order and the payment window opens.
  const [createRes] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/checkout/create-order")),
    page.getByRole("button", { name: /Pay Now/ }).click(),
  ]);
  expect(createRes.status()).toBe(200);
  const order = await createRes.json();
  const subtotal = product.price * 2;
  const discount = Math.round(subtotal * 0.1 * 100) / 100;
  const shipping = subtotal - discount >= 999 ? 0 : 79;
  expect(order.amount).toBe(Math.round((subtotal - discount + shipping) * 100)); // paise, computed on the server
  await expect(page.locator("iframe.razorpay-checkout-frame")).toBeVisible({
    timeout: 20_000,
  });

  // A tampered signature is rejected.
  const paymentId = `pay_e2e${Date.now()}`;
  const bad = await page.request.post("/api/checkout/verify", {
    data: {
      razorpay_order_id: order.razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: "0".repeat(64),
    },
  });
  expect(bad.status()).toBe(400);

  // Razorpay's success callback (signed with the test key secret).
  const ok = await page.request.post("/api/checkout/verify", {
    data: {
      razorpay_order_id: order.razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sign(
        `${order.razorpayOrderId}|${paymentId}`,
        env.RAZORPAY_KEY_SECRET!,
      ),
    },
  });
  expect(ok.status()).toBe(200);
  expect((await ok.json()).orderNumber).toBe(order.orderNumber);

  const { data: paid } = await admin!
    .from("orders")
    .select("id, status, coupon_code, discount_total")
    .eq("order_number", order.orderNumber)
    .single();
  expect(paid).toMatchObject({
    status: "paid",
    coupon_code: COUPON,
    discount_total: discount,
  });
  const stockAfter = (
    await admin!.from("products").select("stock").eq("id", product.id).single()
  ).data!.stock;
  expect(stockAfter).toBe(product.stock - 2);
  expect(
    (await admin!.from("cart_items").select("id").eq("user_id", userId!)).data,
  ).toEqual([]);
  expect(
    (
      await admin!
        .from("coupons")
        .select("used_count")
        .eq("code", COUPON)
        .single()
    ).data!.used_count,
  ).toBe(1);

  // Webhook replay of the same payment changes nothing.
  const body = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: order.razorpayOrderId,
          amount: order.amount,
          method: "upi",
        },
      },
    },
  });
  const hook = await page.request.post("/api/webhooks/razorpay", {
    data: body,
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": sign(body, env.RAZORPAY_WEBHOOK_SECRET!),
    },
  });
  expect(hook.status()).toBe(200);
  const forged = await page.request.post("/api/webhooks/razorpay", {
    data: body,
    headers: { "x-razorpay-signature": "bad" },
  });
  expect(forged.status()).toBe(401);
  expect(
    (
      await admin!
        .from("products")
        .select("stock")
        .eq("id", product.id)
        .single()
    ).data!.stock,
  ).toBe(product.stock - 2);
  const { data: payments } = await admin!
    .from("payments")
    .select("status")
    .eq("order_id", paid!.id)
    .eq("status", "captured");
  expect(payments).toHaveLength(1);

  // Customer pages.
  await page.goto(`/checkout/success/${order.orderNumber}`, {
    waitUntil: "networkidle",
  });
  await expect(
    page.getByRole("heading", { name: "Thank you for your order!" }),
  ).toBeVisible();
  await page.goto("/account/orders", { waitUntil: "networkidle" });
  await expect(page.getByText(`#${order.orderNumber}`)).toBeVisible();
  await page.getByRole("link", { name: /View Order Details/ }).click();
  await expect(
    page.getByRole("heading", { name: `Order #${order.orderNumber}` }),
  ).toBeVisible();
  await expect(page.getByText(`Discount (${COUPON})`)).toBeVisible();
});
