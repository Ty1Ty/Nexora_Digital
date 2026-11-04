# Nexora Digital: multi-vendor marketplace

Netlify + Supabase + Paystack. Contact details on the site: Tyrone John, +254 792 381 698, Nairobi, Kenya.

## What you get
| Your build order | Where it lives |
|---|---|
| 1. Customer and vendor registration | `/account/`, `/sell/` (Supabase Auth, email verification) |
| 2. Secure vendor dashboards | `/vendor/` (row-level security: vendors only see their own data) |
| 3. Listing creation and approval | Vendor dashboard to Admin approval queue; approved listings become indexable SEO pages |
| 4. Orders and order management | Cart, `/checkout/`, buyer orders in `/account/`, vendor fulfilment in `/vendor/` |
| 5. Administrator dashboard | `/admin/` (vendors, listings, orders, payouts, refunds, settings, messages) |
| 6. Payments and commission | Paystack (M-Pesa + card). Prices are taken **server-side**; commission (default 12%) is written per item at checkout |
| 7. Automated digital downloads | Private storage bucket, 60-second signed links, download limit and log |
| 8. SEO, analytics, international | Static SEO pages, JSON-LD, sitemap, GA4 with consent, KES/USD/EUR/GBP display |

Automatic parts: payment confirmation (webhook), commission ledger, download unlock, daily payouts to vendor M-Pesa (06:00 UTC), and SEO page regeneration when listings are approved (via build hook).

## Preview mode vs live mode
With **no environment variables** the site runs as a polished placeholder marketplace (sample vendors, listings, demo dashboards, no real payments). Add the keys below and it switches to **live** automatically, with no code changes.

## Go live (about 20 minutes)
1. **Supabase**: create a project, open SQL Editor, run `supabase/schema.sql`. Optional: run `supabase/seed.sql` for sample listings (flagged demo; blocked from purchase in live mode).
2. **Paystack**: create an account, complete business verification, copy your secret key (use `sk_test_...` first). Under *Settings > Preferences* turn **off** transfer OTP so payouts can run automatically. Set webhook URL to `https://YOUR-SITE/api/paystack-webhook`.
3. **Netlify**: push this folder to GitHub, then *Add new site > Import from Git*. Build settings are read from `netlify.toml`. Add the variables from `.env.example` (Site configuration > Environment variables).
   - Important: functions, scheduled payouts and the build step need a Git or CLI deploy. A plain drag-and-drop of the `public` folder gives you the preview-mode front end only.
4. **Register on the site** with your email, then run in Supabase SQL Editor:
   `update public.profiles set role = 'admin' where email = 'tyronejohn001@gmail.com';`
5. **Build hook** (optional): Netlify > Build hooks > create, paste into `NETLIFY_BUILD_HOOK`. Approved listings then get their own SEO pages automatically.
6. **SEO**: set `SITE_URL` to your real domain, add `GA_MEASUREMENT_ID`, verify the domain in Google Search Console (`GOOGLE_SITE_VERIFICATION`) and submit `/sitemap.xml`.
7. Test a full purchase in Paystack test mode, then swap to `sk_live_...`.

## Things only you can do
- Paystack business verification and Supabase/Netlify accounts (needs your identity and bank details).
- Confirm the legal pages (Terms, Privacy, Refunds, Vendor Agreement) suit you, ideally with a Kenyan lawyer. Register with the Office of the Data Protection Commissioner if required.
- Check Paystack's current rules on marketplace payouts/transfers for your account type.
- Replace placeholder listings and vendors with real ones (Admin > Settings > Remove demo content).

## Project layout
```
public/            generated site (also committed so preview works immediately)
tools/build.mjs    static generator (SEO pages, sitemap, schema, headers)
tools/data/        placeholder catalogue, categories, FAQs, blog articles
netlify/functions/ checkout, webhook, verify, download, payouts, admin actions, config
supabase/          schema.sql (tables, RLS, RPCs, storage) and seed.sql
```
Edit text, categories or the commission rate in `tools/data/catalog.mjs` (or commission in Admin > Settings), then run `node tools/build.mjs`.

## GitHub note
Generated pages (products, categories, blog, sitemap) are not stored in this repo. Netlify creates them on every deploy via `node tools/build.mjs`.
