import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser } from "./harness";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
const ADMIN = "33333333-3333-4333-8333-333333333333";

let db: PGlite;
let productId: string;

beforeAll(async () => {
  db = await createDb();
  await createUser(db, ALICE, "alice@example.com");
  await createUser(db, BOB, "bob@example.com");
  await createUser(db, ADMIN, "admin@example.com", true);
  const { rows } = await db.query<{ id: string }>(
    "select id from products where slug = 'tomato-keychain-red'",
  );
  productId = rows[0].id;
  await db.query(
    "insert into cart_items (user_id, product_id, quantity) values ($1, $2, 2)",
    [BOB, productId],
  );
});
afterAll(async () => {
  await db.close();
});

describe("profiles", () => {
  it("are created automatically on sign-up", async () => {
    const { rows } = await db.query("select role from profiles where id = $1", [
      ALICE,
    ]);
    expect(rows).toEqual([{ role: "customer" }]);
  });

  it("users cannot make themselves admin", async () => {
    await expect(
      as(db, "authenticated", ALICE, (tx) =>
        tx.query("update profiles set role = 'admin' where id = $1", [ALICE]),
      ),
    ).rejects.toThrow(/Only an admin/);
  });

  it("users can update their own name but not someone else's", async () => {
    const result = await as(db, "authenticated", ALICE, async (tx) => {
      await tx.query("update profiles set full_name = 'Alice' where id = $1", [
        ALICE,
      ]);
      const other = await tx.query(
        "update profiles set full_name = 'X' where id = $1",
        [BOB],
      );
      const mine = await tx.query<{ full_name: string }>(
        "select full_name from profiles where id = $1",
        [ALICE],
      );
      return { otherUpdated: other.affectedRows, name: mine.rows[0].full_name };
    });
    expect(result).toEqual({ otherUpdated: 0, name: "Alice" });
  });
});

describe("cart and wishlist", () => {
  it("users only see their own cart", async () => {
    const rows = await as(db, "authenticated", ALICE, async (tx) => {
      return (await tx.query("select * from cart_items")).rows;
    });
    expect(rows).toEqual([]);
  });

  it("users cannot add items to someone else's cart", async () => {
    await expect(
      as(db, "authenticated", ALICE, (tx) =>
        tx.query(
          "insert into cart_items (user_id, product_id, quantity) values ($1, $2, 1)",
          [BOB, productId],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("anonymous visitors see no carts", async () => {
    const rows = await as(
      db,
      "anon",
      null,
      async (tx) => (await tx.query("select * from cart_items")).rows,
    );
    expect(rows).toEqual([]);
  });
});

describe("catalog writes", () => {
  it("customers cannot change products", async () => {
    const affected = await as(db, "authenticated", ALICE, async (tx) => {
      return (
        await tx.query("update products set price = 1 where id = $1", [
          productId,
        ])
      ).affectedRows;
    });
    expect(affected).toBe(0);
  });

  it("admins can change products and see drafts", async () => {
    await db.exec(
      "update products set status = 'draft' where slug = 'tote-bag-by-hobby-store'",
    );
    const customerSees = await as(db, "authenticated", ALICE, async (tx) => {
      return (await tx.query("select 1 from products where status = 'draft'"))
        .rows.length;
    });
    expect(customerSees).toBe(0);
    const result = await as(db, "authenticated", ADMIN, async (tx) => {
      const updated = await tx.query(
        "update products set price = 199 where id = $1",
        [productId],
      );
      const drafts = await tx.query(
        "select 1 from products where status = 'draft'",
      );
      return { updated: updated.affectedRows, drafts: drafts.rows.length };
    });
    expect(result).toEqual({ updated: 1, drafts: 1 });
  });

  it("anonymous visitors cannot read coupons or contact submissions", async () => {
    await db.exec(`
      insert into coupons (code, discount_type, value) values ('WELCOME10', 'percent', 10);
      insert into contact_submissions (name, email, message) values ('Test', 't@example.com', 'Hello there');
    `);
    const rows = await as(db, "anon", null, async (tx) => ({
      coupons: (await tx.query("select * from coupons")).rows.length,
      contact: (await tx.query("select * from contact_submissions")).rows
        .length,
    }));
    expect(rows).toEqual({ coupons: 0, contact: 0 });
  });
});

describe("collections", () => {
  it("cannot be made their own ancestor", async () => {
    await expect(
      db.query(
        `update collections set parent_id = (select id from collections where slug = 'craft-rings')
         where slug = 'tools'`,
      ),
    ).rejects.toThrow(/own ancestor/);
  });
});

describe("reviews", () => {
  it("update the product rating and can't be unhidden by their author", async () => {
    // `as` rolls back, so commit this write as the signed-in user.
    await db.transaction(async (tx) => {
      await tx.exec("set local role authenticated");
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [
        ALICE,
      ]);
      await tx.query(
        "insert into reviews (product_id, user_id, rating, is_hidden) values ($1, $2, 4, true)",
        [productId, ALICE],
      );
    });
    const { rows } = await db.query<{
      rating_avg: string;
      rating_count: number;
      is_hidden: boolean;
    }>(
      `select p.rating_avg::text, p.rating_count, r.is_hidden
       from products p join reviews r on r.product_id = p.id where p.id = $1`,
      [productId],
    );
    expect(rows[0]).toEqual({
      rating_avg: "4.00",
      rating_count: 1,
      is_hidden: false,
    });
  });
});

describe("orders and payments", () => {
  async function createOrder(userId: string, quantity: number) {
    const { rows } = await db.query<{ id: string }>(
      `insert into orders (user_id, email, subtotal, total, shipping_address, razorpay_order_id)
       values ($1, 'bob@example.com', 400, 400, '{}', 'order_' || gen_random_uuid())
       returning id`,
      [userId],
    );
    await db.query(
      `insert into order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
       values ($1, $2, 'Tomato Keychain Red', 200, $3, 400)`,
      [rows[0].id, productId, quantity],
    );
    return rows[0].id;
  }
  const stock = async () =>
    (
      await db.query<{ stock: number }>(
        "select stock from products where id = $1",
        [productId],
      )
    ).rows[0].stock;

  it("customers can't call place_order_paid", async () => {
    const orderId = await createOrder(BOB, 2);
    await expect(
      as(db, "authenticated", BOB, (tx) =>
        tx.query(
          "select public.place_order_paid($1, 'pay_x', 'upi', 400, 'checkout')",
          [orderId],
        ),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it("marks paid once, decrements stock once, and clears the cart lines", async () => {
    const orderId = await createOrder(BOB, 2);
    const before = await stock();
    const pay = (source: string) =>
      db.query<{ r: { already_paid: boolean } }>(
        "select public.place_order_paid($1, 'pay_twice', 'upi', 400, $2) as r",
        [orderId, source],
      );
    expect((await pay("checkout")).rows[0].r.already_paid).toBe(false);
    expect((await pay("webhook")).rows[0].r.already_paid).toBe(true);
    expect(await stock()).toBe(before - 2);
    const { rows } = await db.query(
      "select * from cart_items where user_id = $1",
      [BOB],
    );
    expect(rows).toEqual([]);
    const payments = await db.query(
      "select * from payments where razorpay_payment_id = 'pay_twice'",
    );
    expect(payments.rows.length).toBe(1);
  });

  it("rejects a payment amount that doesn't match the order total", async () => {
    const orderId = await createOrder(BOB, 1);
    await expect(
      db.query(
        "select public.place_order_paid($1, 'pay_bad', 'upi', 1, 'webhook')",
        [orderId],
      ),
    ).rejects.toThrow(/Amount mismatch/);
  });

  it("flags a stock issue instead of overselling", async () => {
    const orderId = await createOrder(BOB, 99);
    const { rows } = await db.query<{ r: { stock_issue: boolean } }>(
      "select public.place_order_paid($1, 'pay_big', 'upi', 400, 'checkout') as r",
      [orderId],
    );
    expect(rows[0].r.stock_issue).toBe(true);
    expect(await stock()).toBeGreaterThanOrEqual(0);
  });

  it("customers only see their own orders", async () => {
    const counts = await as(db, "authenticated", ALICE, async (tx) => ({
      orders: (await tx.query("select * from orders")).rows.length,
      items: (await tx.query("select * from order_items")).rows.length,
    }));
    expect(counts).toEqual({ orders: 0, items: 0 });
    const bob = await as(
      db,
      "authenticated",
      BOB,
      async (tx) => (await tx.query("select * from orders")).rows,
    );
    expect(bob.length).toBeGreaterThan(0);
  });
});
