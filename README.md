# Bad Moms Christmas - Sponsorship Site

A full sponsorship management site: families submit their kids, sponsors claim
them, and an admin console handles everything in between. This replaces the
Google Form + spreadsheet + Canva workflow with one system.

## What's included

- **Family intake form** (`/family-form`) - one submission per family, with
  as many children added as needed. Mom's contact info is captured once and
  is never shown to sponsors.
- **Public claim page** (`/claim`) - shows children grouped by family (using
  a family code like "Blue Family", never the real family name). Sponsors
  select one or more children, enter their contact info, and confirm. It's
  whole-child-or-nothing - no partial claiming.
- **Admin console** (`/admin`) - login-protected. Search/filter families and
  children, flag or remove duplicate submissions, track texting mom/sponsors
  (a checkbox + notes field - it does **not** send texts, since you said you
  prefer to keep texting from your phone), track drop-off/pickup, release a
  claim back into the pool if a sponsor drops out, and trigger reminder
  emails.
- **Automatic 30-minute soft lock** - when a sponsor selects children, that
  spot is reserved for 30 minutes. If they never confirm, a background job
  releases it automatically so it doesn't get stuck.
- **Emails** (via Resend) - sponsor claim confirmation, sponsor drop-off
  reminder (admin-triggered, sends to everyone with a confirmed claim), mom
  "you're fully sponsored" notice (sent automatically the moment the last
  child in a family gets claimed), and mom pickup reminder (admin-triggered).

## What this does NOT do (on purpose, per what we discussed)

- No automated text messages - just a manual "texted" checkbox + notes.
- No address collection - everyone picks up at the same location.
- No photos of children anywhere.
- No tax receipts.
- No automatic duplicate detection - admins remove duplicates manually.

---

## 1. Prerequisites

- **Node.js 18+** installed on your computer (for local development).
- A **Postgres database**. The easiest free options:
  - [Neon](https://neon.tech) (recommended, generous free tier)
  - [Supabase](https://supabase.com)
- A **[Resend](https://resend.com)** account for sending emails (free tier
  covers small volumes easily). You'll need a "from" email address - Resend
  lets you use their test domain to start, or verify your own domain later.
- A **[Vercel](https://vercel.com)** account for hosting (free tier is fine).

## 2. Local setup

```bash
# from inside the project folder
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `DATABASE_URL` - your Neon/Supabase connection string
- `SESSION_SECRET` - any long random string (run `openssl rand -base64 32`)
- `RESEND_API_KEY` and `EMAIL_FROM` - from your Resend account
- The org/date/location fields at the bottom (already filled with your 2026
  details - update yearly)

Then create the database tables:

```bash
npx prisma migrate dev --name init
```

Create your first admin login:

```bash
ADMIN_EMAIL="you@example.org" ADMIN_PASSWORD="choose-a-strong-password" ADMIN_NAME="Your Name" npm run seed:admin
```

Run it locally:

```bash
npm run dev
```

Visit `http://localhost:3000`. The family form is at `/family-form`, the
claim page at `/claim`, and the admin console at `/admin`.

## 3. Deploying to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, "Add New Project" and import that repo.
3. In the project's Environment Variables settings, add every variable from
   your `.env` file (same names, same values, but use your **production**
   database URL if it's different from your local one).
4. Deploy. Vercel will run `npm run build`, which also runs
   `prisma generate` automatically.
5. After the first deploy, run the migration against your production
   database once from your own machine:
   ```bash
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   ```
6. Create your production admin login the same way as step 2's seed command,
   pointed at the production `DATABASE_URL`.

### Keeping the 30-minute lock release working

The soft-lock release logic lives at `/api/cron/expire-locks`. Something
needs to hit that URL every few minutes so abandoned reservations get
released back into the pool. Two easy options:

- **Vercel Cron** (Settings → Cron Jobs) - note that Vercel's free Hobby
  plan only allows once-per-day cron schedules, which is too infrequent for
  a 30-minute lock. If you're on Vercel Pro, add a `vercel.json` cron entry
  running every 5 minutes.
- **A free external pinger** like [cron-job.org](https://cron-job.org) -
  set it to hit `https://yoursite.com/api/cron/expire-locks` every 5
  minutes. This works on any Vercel plan.

Either way, set a `CRON_SECRET` environment variable and have the scheduler
send it as `Authorization: Bearer <your-secret>` so random visitors can't
trigger it.

## 4. Running each year

- Update the `.env` values for the year's deadline, drop-off date, and
  location if anything changes.
- The family code generator (`lib/familyCode.ts`) reuses color names once
  they're free again, so old submissions won't collide with new ones as
  long as you're starting a fresh database or archiving last year's data
  first. If you want to keep prior years' data for comparison (as you
  mentioned), export the families/children tables before wiping them for a
  new season, or add a `season` field down the road if you want everything
  to live in one database long-term - happy to help add that when you're
  ready.

## 5. Admin console notes

- Only admins can see mom's name/phone/email - sponsors only ever see a
  child's first name, family code, and wishlist.
- "Remove family" and "Remove child" are permanent deletes, meant for
  confirmed duplicate submissions.
- "Flag as duplicate" just marks a family for your own review without
  deleting it or hiding it from sponsors.
- "Release claim" puts a child back into the unclaimed pool - use this when
  a sponsor drops out.
- The texted checkboxes are just a log for your own records; nothing gets
  sent automatically.

## Project structure

```
app/
  page.tsx                  - landing page
  family-form/page.tsx      - family intake form
  claim/page.tsx            - public claim page (server component, live data)
  claim/ClaimClient.tsx     - claim page interactivity
  admin/page.tsx            - admin dashboard shell
  admin/AdminClient.tsx     - admin dashboard interactivity
  admin/login/page.tsx      - admin login
  api/families              - family submission endpoint
  api/claim                 - reserve + confirm claim endpoints
  api/admin/*               - admin-only endpoints (protected by middleware.ts)
  api/cron/expire-locks     - releases abandoned 30-minute reservations
lib/
  prisma.ts, config.ts, session.ts, email.ts, familyCode.ts
prisma/schema.prisma        - the full data model
scripts/create-admin.ts     - CLI to create/update an admin login
```
