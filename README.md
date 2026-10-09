# Dream Needles

Online store for crochet & knitting tools and handmade crochet products, with
an admin panel. Live (test mode): <https://dream-needles.vercel.app>

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 ·
Supabase (Postgres, Auth, Storage, RLS) · Razorpay · Gmail SMTP (Nodemailer) ·
Google Sheets (Apps Script)

## Features

- **Storefront** (Figma design): home, hierarchical collections with filters and
  "View all", product pages with gallery, colour options, pincode check and
  reviews, quick view, What's New (automatic + pinned), retail store, Our Story,
  FAQ and policy pages
- **Live search**: typo-tolerant full-text + trigram search, keyboard navigation,
  `/search` results page
- **Accounts**: email OTP sign-in, profile, address book, order history
- **Cart & wishlist**: guest (browser) and signed-in (database) with merge on sign-in
- **Checkout**: server-calculated totals, coupons, gift note, Razorpay payments
  verified on the server, idempotent webhook, order emails
- **Contact Us**: saved to Supabase and appended to a Google Sheet
- **Admin** (`/admin`): dashboard, products (images, options, collections),
  collections, orders, coupons, reviews, messages, home page, navigation,
  pages and settings

## Getting started

Follow **[SETUP.md](SETUP.md)** (written for beginners). In short:

```bash
nvm use                       # Node 22
cp .env.example .env.local    # fill in the values
npm install
npm run dev                   # http://localhost:3000
```

## Scripts

| Command                 | What it does                                                      |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Start the dev server                                              |
| `npm run build`         | Production build                                                  |
| `npm run check`         | Lint + type-check + unit/database tests (run before every commit) |
| `npm run e2e`           | Browser tests against a running dev server (see SETUP.md Part 9)  |
| `npm run screenshots`   | Playwright screenshots at 1280 / 768 / 390 px                     |
| `npm run seed:generate` | Regenerate `supabase/seed/*.sql` from `images/products-old`       |
| `npm run upload-images` | Upload product images to Supabase Storage                         |
| `npm run db:types`      | Regenerate `src/types/database.ts` from the migrations            |
| `npm run email:test`    | Send a test email with the SMTP settings                          |

## Project layout

```
src/app/(store)      storefront pages      src/app/admin     admin panel
src/app/(checkout)   checkout + success    src/app/(auth)    sign-in
src/app/api          search, pincode, checkout, Razorpay webhook
src/lib              data access, pricing, checkout, email, validation
supabase/migrations  schema, RLS, functions, search (run in order)
supabase/seed        collections, products, content
tests/               unit + database tests (PGlite runs the real SQL)
e2e/                 Playwright browser tests and screenshots
```
