# 🚀 Shipping SkillSprint — Deployment Checklist

Your MVP is complete. Here's the fastest path from zip to live users.

---

## ⏱️ 30-minute launch path

### 1. Push to GitHub (5 min)

```bash
unzip skillsprint.zip && cd skillsprint
git init && git add . && git commit -m "Initial SkillSprint MVP"
gh repo create skillsprint --public --source=. --push
```

### 2. Set up Supabase (10 min)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine)
2. SQL Editor → paste `supabase/schema.sql` → **Run**
3. SQL Editor → paste `supabase/migration_002_certificates.sql` → **Run**
4. Settings → API → copy the **Project URL** and **anon key**
5. Authentication → URL Configuration → add your production domain to "Site URL" and "Redirect URLs"

### 3. Get API keys (5 min)

- **Anthropic:** [console.anthropic.com](https://console.anthropic.com) → API Keys → create
- **PostHog:** [posthog.com](https://posthog.com) → Create project → copy project API key

### 4. Deploy to Vercel (10 min)

1. [vercel.com](https://vercel.com) → Import your GitHub repo
2. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_SITE_URL=https://skillsprint.vercel.app   ← your actual URL
   ANTHROPIC_API_KEY=sk-ant-...
   NEXT_PUBLIC_POSTHOG_KEY=phc_...
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```
3. Deploy — usually ~90 seconds

### 5. Make yourself a creator (1 min)

Supabase → Table Editor → `profiles` → find your row → set `is_creator = true`. Now you can access `/admin/new` and generate bootcamps with AI.

---

## ✅ Pre-launch smoke test

Hit these six flows before posting anywhere:

- [ ] **Signup** → email confirmation → lands on dashboard
- [ ] **Enroll** in a seeded bootcamp → redirects to day 1
- [ ] **Complete day 1 quiz** → progress bar updates
- [ ] **Admin/new** → generate AI curriculum → save & publish → appears in catalog
- [ ] **Finish 7-day sprint** → certificate issued → PDF downloads cleanly
- [ ] **Sign out** → nav resets → analytics identity clears

---

## 📣 Launch playbook

**Day 1 — Soft launch**
- Post on [Indie Hackers](https://indiehackers.com)
- Tweet the landing page with a 30s screen recording
- Share with 3–5 friends in tech Slacks for feedback

**Day 3 — Public launch**
- [Product Hunt](https://producthunt.com) (launch Tuesday/Wednesday, 12:01am PT)
- Hacker News: "Show HN: SkillSprint — 7-day micro-bootcamps for AI & tech"
- LinkedIn post with a certificate screenshot

**Week 1 — Content flywheel**
- Generate 5–10 free bootcamps using the AI generator
- Each bootcamp = SEO landing page via your sitemap
- Post 1 bootcamp/day on Twitter/LinkedIn with a "learn this in 7 days" hook

---

## 💰 Monetization roadmap

You chose a free MVP, which is the right call. When you're ready to charge:

1. **Stripe Checkout** — 1 day of work. Add `price_id` column to `bootcamps`, create checkout session in a server action, webhook to grant enrollment.
2. **Subscriptions** — unlimited access for $19/mo. Higher LTV, more predictable revenue.
3. **Creator revenue share** — take 20%, pay creators 80% via Stripe Connect. Unlocks a marketplace moat.

Target price for a single bootcamp: **$29–49** (7 days × ~20min × high willingness-to-pay for AI skills = justifiable).

---

## 🎯 What success looks like

**Week 1:** 50 signups, 20 enrollments, 5 completed sprints, 2 paying interest emails.
**Month 1:** 500 signups, a LinkedIn-shared certificate drives organic signups. You know your activation rate.
**Month 3:** You've flipped the switch on Stripe. $1k MRR. You know which bootcamps convert.

---

**Now go ship.** 🌱
