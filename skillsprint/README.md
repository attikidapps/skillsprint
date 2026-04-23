# 🏃‍♂️💨 SkillSprint

**7-day micro-bootcamps for tech & AI skills.**
Short, urgent, focused courses. Ship a skill in a week, move on.

Built with **Next.js 14 (App Router)** + **Tailwind CSS** + **Supabase**.
Minimalist design, emerald green + warm beige, full SEO + WCAG AA accessibility.

---

## ✨ What's included

- 🔐 Full auth (email/password + magic link via Supabase)
- 📚 Bootcamp catalog with enrollment
- 📅 7-day structured lessons with progress tracking
- ✅ Quizzes + auto-issued completion certificates
- 📜 **PDF certificates** (react-pdf) with public verification URLs
- 🤖 **AI curriculum generator** — creators describe a skill, Claude drafts all 7 days + quizzes
- 💬 Per-bootcamp discussion forums
- 👩‍🏫 Admin dashboard for creators (create bootcamps, view enrollments)
- 🌐 Full SEO (metadata, Open Graph, sitemap, robots.txt, JSON-LD)
- ♿ WCAG AA accessibility (keyboard nav, ARIA, semantic HTML, reduced motion)
- 📊 **PostHog analytics** — pageviews, funnels (signup → enrollment → completion), creator usage tracking

---

## 🚀 Quick start

### 1. Clone & install

```bash
pnpm install   # or npm install / yarn
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. In the SQL editor, paste and run `supabase/schema.sql`
3. Then run `supabase/migration_002_certificates.sql` (adds the auto-issuance RPC)
4. Copy your project URL and anon key from **Project Settings → API**

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🗂️ Architecture

```
skillsprint/
├── app/
│   ├── (auth)/          # Login & signup (route group)
│   ├── api/auth/        # Supabase auth callback
│   ├── bootcamps/       # Catalog, detail, daily lessons
│   ├── dashboard/       # Learner dashboard
│   ├── admin/           # Creator dashboard
│   ├── forums/          # Per-bootcamp discussions
│   ├── layout.tsx       # Root layout + metadata
│   ├── page.tsx         # Landing page
│   ├── sitemap.ts       # Auto-generated sitemap
│   └── robots.ts        # Auto-generated robots.txt
├── components/          # Reusable UI
├── lib/supabase/        # Supabase client/server helpers
├── middleware.ts        # Auth session refresh
├── supabase/schema.sql  # Complete DB schema + RLS policies
└── tailwind.config.ts   # Design tokens
```

## 🎨 Design system

Minimalist + editorial. The typography pairs a warm serif (Fraunces) with a
precise sans (Geist) to feel both academic and modern.

| Token | Value |
|---|---|
| Primary | Emerald `#0b6b3a` → `#10b981` |
| Surface | Warm beige `#f5eedb` |
| Ink | `#1a1f1c` (near-black, green-tinted) |
| Display font | Fraunces |
| Body font | Geist Sans |
| Mono | JetBrains Mono |

## 🗺️ Roadmap (next 7 days of your own SkillSprint 😉)

- [ ] Add Stripe Checkout for paid bootcamps
- [x] AI-generated daily lesson drafts (Claude API)
- [x] Certificate PDF generation (react-pdf)
- [ ] Email reminders for daily lessons (Resend)
- [x] Analytics (PostHog)
- [ ] i18n

## 📊 Analytics — what's tracked

PostHog captures a handful of high-signal events so you can build funnels, retention curves, and a creator-usage dashboard out of the box:

| Event | Fired when | Properties |
|---|---|---|
| `$pageview` | Every route change | URL, referrer |
| `user_signed_up` | Signup form submitted | email_provider |
| `user_logged_in` | Login submitted | method |
| `bootcamp_enrolled` | Enrol button clicked | bootcamp_id, slug |
| `lesson_completed` | Quiz submitted | lesson_id, bootcamp_id, quiz_score, is_final_day |
| `certificate_earned` | Day 7 quiz completes the bootcamp | bootcamp_id, serial |
| `curriculum_generated` | Creator uses AI generator (server-side) | audience, model, input_tokens, output_tokens |

Users are identified by their Supabase `user.id` via `posthog.identify()` on login and `reset()` on signout. `person_profiles: 'identified_only'` means anonymous visitors don't create profiles (cleaner user counts, lower cost).

Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local` to enable — if they're missing, the provider no-ops silently and the app works normally.

**Suggested funnels to build in PostHog:**
1. Acquisition: `$pageview` (landing) → `user_signed_up` → `user_logged_in`
2. Activation: `user_signed_up` → `bootcamp_enrolled` → `lesson_completed` (day 1)
3. Completion: `bootcamp_enrolled` → `lesson_completed` ×7 → `certificate_earned`

## 🤖 How the AI curriculum generator works

Creators on `/admin/new` describe a skill + target audience. The UI calls `/api/generate-curriculum`, which:

1. Verifies the caller is a creator (`profiles.is_creator = true`)
2. Calls Claude Sonnet 4.6 with a **tool-use schema** forcing a structured 7-lesson curriculum (each with 2–3 multiple-choice quiz questions, correct answer, and explanation)
3. Returns the structured output as JSON
4. Creator reviews & edits each day in-place, then taps **Save & publish** — which writes `bootcamps`, `lessons`, and `quiz_questions` rows to Supabase in a single flow

**Why tool-use over JSON-mode prompting?** The tool's JSON Schema is enforced by the model itself, so you never have to parse malformed JSON or re-prompt on failure. The schema specifies minItems/maxItems, regex patterns for option ids, and required fields — making the output reliable enough to write straight to the database.

Set `ANTHROPIC_API_KEY` in `.env.local` to enable. Get a key at [console.anthropic.com](https://console.anthropic.com).

## 📜 How the certificate flow works

1. User enrolls in a bootcamp and completes 7 daily lessons + quizzes
2. On day 7's quiz submit, the client calls `try_issue_certificate(bootcamp_id)` RPC
3. The Postgres function (SECURITY DEFINER) verifies all 7 lessons are complete and inserts a certificate with a unique serial (`SS-XXXXXXXX`)
4. The UI shows a "Sprint complete" card with a download link to `/api/certificates/[serial]`
5. That route renders a branded PDF with `@react-pdf/renderer` (Fraunces serif + Geist sans, emerald + beige palette)
6. Anyone with the URL `/verify/[serial]` can publicly verify the certificate

## 📄 License

MIT — ship it.
