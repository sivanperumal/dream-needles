# Dream Needles — Setup Guide

Step-by-step instructions for everything you need to do yourself. No prior
Supabase experience needed. Do the parts in order.

> This guide grows as the project is built. Parts marked _(coming soon)_ will
> be filled in by the end of the project: email setup, Razorpay, Google Sheets
> and deployment.

---

## Part 1 · Create the Supabase project and database

Supabase is the database, login system and image storage for the store.

### 1.1 Create the project

1. Go to <https://supabase.com> and sign up (the free plan is fine).
2. Click **New project**.
3. Fill in:
   - **Name:** `dream-needles`
   - **Database password:** click **Generate a password** and save it in your
     password manager. You won't need it day to day.
   - **Region:** **South Asia (Mumbai)**, closest to your customers.
4. Click **Create new project** and wait about 2 minutes until it's ready.

### 1.2 Copy your keys into `.env.local`

1. In the project, open **Project Settings** (gear icon) → **API Keys**.
2. In the project root, copy `.env.example` to a new file named `.env.local`
   (if you already created `.env.local` for the Figma token, add to it).
3. Fill in these three lines:

   | `.env.local` variable           | Where to find it                                                                          |
   | ------------------------------- | ----------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | **Project Settings → Data API → Project URL** (looks like `https://abcd1234.supabase.co`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **API Keys → `anon` `public`** key                                                        |
   | `SUPABASE_SERVICE_ROLE_KEY`     | **API Keys → `service_role` `secret`** key: click **Reveal**                              |

> ⚠️ The **service_role** key can read and change everything in your
> database. Keep it only in `.env.local` (which is never committed) and in
> your hosting provider's environment settings. Never paste it into chat,
> email or front-end code.

### 1.3 Run the database files, in this exact order

1. In Supabase, open **SQL Editor** (left sidebar) → **New query**.
2. For **each file below, one at a time, in order**:
   1. Open the file in VS Code and copy **all** of it (Cmd+A, Cmd+C).
   2. Paste it into the SQL editor (replacing anything already there).
   3. Click **Run** (or press Cmd+Enter).
   4. Check it says **Success. No rows returned**, then move to the next file.

| #   | File                                                | What it does                                            |
| --- | --------------------------------------------------- | ------------------------------------------------------- |
| 1   | `supabase/migrations/0001_extensions.sql`           | Turns on `pg_trgm` and `unaccent` (needed for search)   |
| 2   | `supabase/migrations/0002_core_tables.sql`          | Customer profiles and addresses                         |
| 3   | `supabase/migrations/0003_catalog.sql`              | Collections, products, images, variants                 |
| 4   | `supabase/migrations/0004_commerce.sql`             | Wishlist, cart, coupons, orders, payments               |
| 5   | `supabase/migrations/0005_content.sql`              | Reviews, contact form, settings, banners, menus, pages  |
| 6   | `supabase/migrations/0006_functions_triggers.sql`   | Business logic (What's New, collection pages, payments) |
| 7   | `supabase/migrations/0007_search.sql`               | Search indexes and search functions                     |
| 8   | `supabase/migrations/0008_rls_policies.sql`         | Security rules: who can read or change what             |
| 9   | `supabase/migrations/0009_storage_and_settings.sql` | Image storage buckets and default settings              |
| 10  | `supabase/seed/01_collections.sql`                  | Your collection tree, header and footer menus           |
| 11  | `supabase/seed/02_products.sql`                     | The 31 products from the `images/` folder               |
| 12  | `supabase/seed/03_content.sql`                      | Home page content, settings and policy pages            |

**If a file fails:** don't skip ahead. Copy the red error message and send it
to me. The migrations are meant to run once on a fresh project, so re-running
an already-successful migration will show "already exists" errors. That's
expected; just carry on from the next file. The seed files (10–12) are safe
to run again.

**Check it worked:** open **Table Editor → products**. You should see 31
rows.

### 1.4 Upload the product images

In the VS Code terminal, from the project folder:

```bash
npm install          # only needed the first time
npm run upload-images
```

You should see `Uploaded 113/113` and then `All 113 images are in the
"product-images" bucket.` Check in **Storage → product-images → products**.

---

## Part 2 · Email OTP login _(coming soon)_

## Part 3 · Make yourself an admin _(coming soon)_

## Part 4 · Razorpay payments _(coming soon)_

## Part 5 · Google Sheets for Contact Us _(coming soon)_

## Part 6 · Run locally _(coming soon)_

## Part 7 · Deploy to Vercel _(coming soon)_

## Part 8 · End-to-end test checklist _(coming soon)_
