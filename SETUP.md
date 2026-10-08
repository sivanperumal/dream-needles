# Dream Needles — Setup Guide

Step-by-step instructions for everything you need to do yourself. No prior
Supabase experience needed. Do the parts in order.

> **Status:** Part 1 is done ✅. Parts marked 🕒 depend on features that are
> still being built; you'll be told when each one is ready to do.

---

## Before you start · Use Node.js 22

The project needs **Node.js 22 or newer**. The Supabase library refuses to
run on Node 20 ("native WebSocket not found").

You already have Node 22 installed through nvm. In the VS Code terminal, inside
the project folder, run:

```bash
nvm use            # reads .nvmrc and switches to Node 22
node -v            # should print v22.x
```

To make Node 22 your default for every new terminal, run this once:

```bash
nvm alias default 22
```

> If `nvm use` complains about a `prefix` setting in `~/.npmrc`, run the
> command it suggests (`nvm use --delete-prefix v22.23.3`), or open `~/.npmrc`
> and delete the `prefix=` line.

---

## Part 1 · Create the Supabase project and database ✅

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

In the VS Code terminal, from the project folder (using Node 22, see above):

```bash
npm install          # only needed the first time
npm run upload-images
```

You should see `Uploaded 113/113` and then `All 113 images are in the
"product-images" bucket.` Check in **Storage → product-images → products**.

---

## Part 2 · Email login codes (OTP)

Customers sign in by typing their email and then a 6-digit code that arrives
by email. No passwords, no SMS.

**You can do this part now.**

### 2.1 Turn on email codes

1. Supabase → **Authentication** → **Sign In / Providers** → **Email**.
2. Make sure **Enable Email provider** is **on**.
3. Set **Email OTP Length** to `6` and **Email OTP Expiration** to `600`
   (10 minutes).
4. Click **Save**.

### 2.2 Make the email show the code

By default Supabase emails a magic link, not a code. Change both templates:

1. Supabase → **Authentication** → **Emails** → **Templates**.
2. Open **Magic Link**:
   - **Subject:** `Your Dream Needles login code: {{ .Token }}`
   - **Body:** delete everything, then paste the whole contents of
     `supabase/templates/otp-email.html` from this project.
   - Click **Save**.
3. Open **Confirm signup** and do exactly the same (same subject, same body).
   New customers get this one the first time they sign in.

> The body must contain `{{ .Token }}`, which is where the 6-digit code
> appears.

### 2.3 Tell Supabase where the site lives

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL:** `http://localhost:3000` for now (you'll change it to your
   real domain in Part 7).
3. Under **Redirect URLs** click **Add URL** and add `http://localhost:3000/**`.
4. Save.

### 2.4 ⚠️ Important: email limits, and connecting Resend

Supabase's built-in email sender only allows **a few emails per hour** and
only to your own team's addresses. That's fine for testing, but customers
won't get their codes on a live store. Connect **Resend** (free: 3,000
emails/month, 100/day) before going live. You already have a Resend account
and API key.

**Step A: verify your domain in Resend** (needed to email customers)

1. You need a domain you own (for example `dreamneedles.in`), bought from
   GoDaddy, Hostinger, Namecheap or similar.
2. Resend → **Domains** → **Add Domain** → enter your domain → Region
   **Tokyo (ap-northeast-1)**, the closest to India.
3. Resend shows 3–4 DNS records (TXT/MX). Log in to where you bought the
   domain → **DNS settings** → add each record exactly as shown.
4. Back in Resend click **Verify**. It can take from a few minutes to a few
   hours. Wait until the status is **Verified**.

> Until the domain is verified, Resend only delivers to the email address
> you signed up to Resend with. Good for testing, not for customers.

**Step B: plug Resend into Supabase**

1. Resend → **API Keys** → **Create API Key** → name `supabase-auth`,
   permission **Sending access** → copy the key (starts with `re_`).
2. Supabase → **Authentication** → **Emails** → **SMTP Settings** → turn on
   **Enable Custom SMTP** and fill in:

   | Field        | Value                                                       |
   | ------------ | ----------------------------------------------------------- |
   | Sender email | `login@yourdomain.in` (any address at your verified domain) |
   | Sender name  | `Dream Needles`                                             |
   | Host         | `smtp.resend.com`                                           |
   | Port         | `465`                                                       |
   | Username     | `resend`                                                    |
   | Password     | the `re_…` API key from step 1                              |

3. Click **Save**.
4. Supabase → **Authentication** → **Rate Limits** → raise **Rate limit for
   sending emails** to `100` per hour, then save.

**Alternative: Brevo** (free: 300 emails/day). Brevo → **SMTP & API** →
**SMTP** tab. Use host `smtp-relay.brevo.com`, port `587`, the **Login**
shown there as username, and an **SMTP key** you generate as password.
Verify your sender domain under **Senders, Domains & Dedicated IPs**.

### 2.5 Order emails (sent by the website)

The website also sends order confirmation, "shipped" and
"delivered/cancelled" emails through Resend, using the two lines already in
your `.env.local`:

```bash
RESEND_API_KEY=re_...         # can be the same key as above, or a separate one
EMAIL_FROM=Dream Needles <orders@yourdomain.in>
```

While your domain isn't verified yet, keep
`EMAIL_FROM=Dream Needles <onboarding@resend.dev>`. Test orders will then only
email the address you used to sign up to Resend.

---

## Part 3 · Make yourself an admin 🕒

_Ready once the login page is built. You'll be told._

1. Run the site (Part 6) and sign in at <http://localhost:3000/login> with
   your own email. This creates your customer profile.
2. Supabase → **SQL Editor** → **New query** → paste, replacing the email
   with yours:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'you@example.com';
   ```

3. Click **Run**. It should say **1 row affected**. If it says 0, check the
   email spelling and that you signed in at least once.
4. Sign out and back in, then open <http://localhost:3000/admin>.

To remove someone's admin access later, run the same query with `'customer'`
instead of `'admin'`.

> Only the SQL editor (or another admin) can change roles. A customer can
> never make themselves admin; the database blocks it.

---

## Part 4 · Razorpay payments

Your Razorpay **test** keys are already in `.env.local` ✅.

### 4.1 Settings to check now

1. Razorpay Dashboard → make sure the toggle at the top says **Test Mode**.
2. **Account & Settings** → **Payment Capture** → set to **Automatic
   capture** (so successful payments don't need manual capturing).

### 4.2 Test payments 🕒

_Ready once checkout is built._

In test mode no real money moves. At the Razorpay payment window use:

- **UPI:** `success@razorpay` (payment succeeds) or `failure@razorpay`
  (payment fails).
- **Cards / net banking:** the test details on Razorpay's
  [Test Card Details](https://razorpay.com/docs/payments/payments/test-card-details/)
  page. Any future expiry date and any CVV work.

### 4.3 Webhook 🕒

_Do this after deploying (Part 7). Razorpay can't reach `localhost`._

The webhook is a backup: if a customer closes the browser right after
paying, Razorpay still tells the store the payment succeeded.

1. Create a secret: in the VS Code terminal run `openssl rand -hex 32` and
   copy the output.
2. Razorpay → **Account & Settings** → **Webhooks** → **Add New Webhook**:
   - **Webhook URL:** `https://YOUR-DOMAIN/api/webhooks/razorpay`
   - **Secret:** the value from step 1
   - **Active events:** tick `payment.captured` and `payment.failed`
3. Click **Create Webhook**.
4. Put the same secret in `RAZORPAY_WEBHOOK_SECRET`, both in `.env.local` and
   in Vercel's environment variables (Part 7).

### 4.4 Going live (later)

1. Razorpay → complete **Account Activation** (business and bank KYC).
   Approval can take a few days.
2. Switch the dashboard toggle to **Live Mode** → **API Keys** → **Generate
   Live Key**.
3. In Vercel, replace `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
   with the live keys.
4. Live mode has its own webhooks list, so repeat 4.3 in Live Mode with a new
   secret and update `RAZORPAY_WEBHOOK_SECRET`.
5. Redeploy (Vercel → **Deployments** → **⋯** → **Redeploy**).

---

## Part 5 · Google Sheets for Contact Us

Every Contact Us message is saved in Supabase **and** added as a row to a
Google Sheet. **You can do this part now.**

1. Go to <https://sheets.new> and name the sheet **Dream Needles – Contact Us**.
2. **Extensions** → **Apps Script**. A code editor opens.
3. Delete everything in `Code.gs` and paste the whole contents of
   `google-apps-script/contact.gs` from this project. Click **Save** (💾).
4. Create a secret: in the VS Code terminal run `openssl rand -hex 32` and
   copy the output.
5. In Apps Script, click **Project Settings** (⚙️ on the left) → scroll to
   **Script Properties** → **Add script property**:
   - **Property:** `SHARED_SECRET`
   - **Value:** the secret from step 4
   - Click **Save script properties**.
6. Click **Deploy** (top right) → **New deployment** → click ⚙️ next to
   "Select type" → **Web app**, then:
   - **Description:** `Contact form`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
   - Click **Deploy**.
7. Google asks for permission: **Authorize access** → choose your account →
   if you see "Google hasn't verified this app", click **Advanced** → **Go to
   … (unsafe)** → **Allow**. (It's your own script, so this is expected.)
8. Copy the **Web app URL** (ends with `/exec`).
9. In `.env.local` fill in:

   ```bash
   GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
   GOOGLE_SHEETS_SECRET=the-secret-from-step-4
   ```

A **Submissions** tab with a header row is created automatically when the
first message arrives.

> "Anyone" means anyone with the URL can call the script, but it rejects
> every request that doesn't include your secret. The secret lives only in
> `.env.local`, Vercel and Script Properties, never in the browser.

**If you edit the script later:** **Deploy** → **Manage deployments** → ✏️
**Edit** → **Version: New version** → **Deploy**. This keeps the same URL.

---

## Part 6 · Run the site on your computer

```bash
nvm use              # Node 22 (see "Before you start")
npm install          # after pulling new changes
npm run dev
```

Open <http://localhost:3000>. Stop the server with **Ctrl+C**.

Useful commands:

| Command                 | What it does                                         |
| ----------------------- | ---------------------------------------------------- |
| `npm run check`         | Lint, type-check and automated tests (all must pass) |
| `npm run build`         | Production build, the same as Vercel runs            |
| `npm run upload-images` | Re-upload product images from `images/products`      |

---

## Part 7 · Deploy to Vercel 🕒

_Best done once checkout works, but you can deploy any time to see progress._

### 7.1 Create the Vercel project

1. Go to <https://vercel.com> → **Sign Up** → **Continue with GitHub**.
2. **Add New…** → **Project** → find `dream-needles` → **Import**.
3. Leave **Framework Preset: Next.js** and the build settings as they are.
4. Open **Environment Variables** and add every line from your
   `.env.local` **except `FIGMA_TOKEN`**:

   | Name                            | Value                                                                        |
   | ------------------------------- | ---------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL`          | your live address, e.g. `https://dream-needles.vercel.app` (no trailing `/`) |
   | `NEXT_PUBLIC_SUPABASE_URL`      | same as `.env.local`                                                         |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as `.env.local`                                                         |
   | `SUPABASE_SERVICE_ROLE_KEY`     | same as `.env.local`                                                         |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID`   | same as `.env.local`                                                         |
   | `RAZORPAY_KEY_SECRET`           | same as `.env.local`                                                         |
   | `RAZORPAY_WEBHOOK_SECRET`       | from Part 4.3                                                                |
   | `GOOGLE_SHEETS_WEBHOOK_URL`     | same as `.env.local`                                                         |
   | `GOOGLE_SHEETS_SECRET`          | same as `.env.local`                                                         |
   | `RESEND_API_KEY`                | same as `.env.local`                                                         |
   | `EMAIL_FROM`                    | same as `.env.local`                                                         |

   Tip: you can paste the whole `.env.local` contents into the first **Key**
   box and Vercel splits it into rows; then delete the `FIGMA_TOKEN` row.

5. Click **Deploy** and wait for "Congratulations!".
6. Project → **Settings** → **Build and Deployment** → **Node.js Version** →
   **22.x** (or newer) → **Save**.

Every push to `main` on GitHub now redeploys automatically.

### 7.2 Point everything at the live site

1. **Supabase** → **Authentication** → **URL Configuration**:
   - **Site URL:** `https://YOUR-DOMAIN`
   - **Redirect URLs:** add `https://YOUR-DOMAIN/**` (keep the localhost one
     for local testing).
2. **Razorpay:** create the webhook from Part 4.3 with your live address.
3. **Custom domain (optional):** Vercel → project → **Settings** →
   **Domains** → add `dreamneedles.in` and add the DNS records Vercel shows
   at your domain registrar. Then update `NEXT_PUBLIC_SITE_URL` and the
   Supabase URLs above, and redeploy.

---

## Part 8 · End-to-end test checklist 🕒

_This list is used for the final check when everything is built._ Tick each
item on the live site (Razorpay in test mode).

**Storefront**

- [ ] Home page: slider, tiles, categories, stats and footer all show; links work
- [ ] Header menu: Tools and Handmade open the mega-menu; "View all" links work
- [ ] Mobile: menu drawer, bottom tab bar and WhatsApp button work
- [ ] Collection page: products show; filters (price, sub-collection, in stock) and sort change the list; pagination works
- [ ] "View all" on Accessories / Home Decor shows each product once
- [ ] What's New shows recent products with a "New" badge
- [ ] Product card hover: Add to Cart, Wishlist and Quick View work
- [ ] Product page: gallery, colour swatches (if any), quantity, stock status, pincode check, reviews, related products
- [ ] Retail Store, Our Story, FAQ, Privacy, Shipping, Refund, Terms pages open

**Search**

- [ ] Typing 2+ letters shows live results; "crochte" still finds crochet
- [ ] Results show collections (with parent) and products (image, price, highlight)
- [ ] Arrow keys + Enter open a result; Esc and clicking outside close it
- [ ] Enter on the text opens `/search?q=…` with filters
- [ ] Nonsense text shows "No results" with a What's New link; mobile opens full-screen

**Account, cart and wishlist**

- [ ] Sign in with email → code arrives → code works; wrong code shows an error
- [ ] Guest wishlist and cart items are kept after signing in
- [ ] Cart drawer and cart page: change quantity, remove, free-shipping bar updates
- [ ] Profile, addresses (add/edit/default) and order list work

**Checkout and payments**

- [ ] Checkout totals match the cart; a valid coupon applies, an invalid one is rejected
- [ ] Pay with `success@razorpay` → success page → order shows as **Paid**, stock goes down, cart empties, confirmation email arrives
- [ ] Pay with `failure@razorpay` → error message, order stays **Pending**, you can retry
- [ ] Razorpay → Webhooks shows successful deliveries

**Contact Us**

- [ ] Submitting the form shows a success message
- [ ] The message appears in the Google Sheet and in Admin → Contact submissions

**Admin** (signed in as admin)

- [ ] `/admin` is blocked for customers and signed-out visitors
- [ ] Dashboard shows orders, revenue, recent orders and low stock
- [ ] Products: search, create, edit, upload and reorder images, assign several collections, pin to What's New, hide/delete
- [ ] Collections: create a sub-collection; it appears in the header menu without code changes
- [ ] Orders: change status paid → shipped (customer gets the "shipped" email) → delivered
- [ ] Coupons, reviews (hide), home page content, navigation, pages and settings save and show on the site
