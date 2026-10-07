# Dream Needles

Online store for crochet & knitting tools and handmade crochet products, with an admin panel.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Razorpay · Google Sheets (Contact Us)

## Getting started

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev                  # http://localhost:3000
```

Full beginner setup (Supabase, Razorpay, Google Sheets, deployment) is in `SETUP.md`.

## Scripts

| Command                 | What it does                                               |
| ----------------------- | ---------------------------------------------------------- |
| `npm run dev`           | Start the dev server                                       |
| `npm run check`         | Lint + type-check + unit tests (run before every commit)   |
| `npm run seed:generate` | Regenerate `supabase/seed/*.sql` from the `images/` folder |
| `npm run upload-images` | Upload `images/products` to Supabase Storage               |
| `npm run screenshots`   | Playwright screenshots at desktop/tablet/mobile widths     |
