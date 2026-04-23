import Link from 'next/link';
import { ArrowUpRight, Clock, CheckCircle2, Zap, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { BootcampCard } from '@/components/BootcampCard';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();
  const { data: featured } = await supabase
    .from('bootcamps')
    .select('slug, title, tagline, category, difficulty, cover_url')
    .eq('is_published', true)
    .limit(3);

  return (
    <>
      {/* ============ HERO ============ */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="chip">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse" aria-hidden="true" />
              New cohort starts Monday
            </span>
          </div>

          <h1
            id="hero-heading"
            className="mt-8 font-display text-display-xl text-ink max-w-5xl animate-fade-up"
            style={{ animationDelay: '100ms' }}
          >
            Ship a new skill{' '}
            <span className="italic font-light text-primary-800">every</span>{' '}
            Sunday.
          </h1>

          <p
            className="mt-8 max-w-xl text-lg md:text-xl text-ink-soft leading-relaxed animate-fade-up"
            style={{ animationDelay: '250ms' }}
          >
            SkillSprint turns scattered learning into focused 7-day bootcamps.
            One skill. One week. Real output by Sunday night.
          </p>

          <div
            className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
            style={{ animationDelay: '400ms' }}
          >
            <Link href="/bootcamps" className="btn-primary">
              Browse bootcamps
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/#how-it-works" className="btn-ghost">
              How it works
            </Link>
          </div>

          {/* Stats strip */}
          <dl
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-ink/10 pt-10 animate-fade-up"
            style={{ animationDelay: '550ms' }}
          >
            {[
              ['7', 'days per sprint'],
              ['20', 'min / lesson'],
              ['38', 'live bootcamps'],
              ['4.8', 'avg. rating'],
            ].map(([num, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-4xl md:text-5xl text-ink">{num}</dd>
                <dd className="mt-1 text-sm text-ink-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Decorative emerald orb (soft, not overwhelming) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-20 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(36,154,102,0.35) 0%, rgba(212,199,163,0) 70%)',
          }}
        />
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="border-y border-ink/10 bg-sand-100/60"
      >
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-16">
            <div>
              <p className="chip mb-4"><Sparkles className="h-3 w-3" aria-hidden="true" /> The method</p>
              <h2 id="how-heading" className="font-display text-display-lg max-w-2xl">
                Focused <span className="italic font-light">bursts</span> beat endless courses.
              </h2>
            </div>
            <p className="max-w-md text-ink-soft">
              Most courses fail because they're too long. SkillSprints are engineered
              around the one-week attention span — urgent enough to finish, deep enough to matter.
            </p>
          </div>

          <ol className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap,         day: 'Day 0', title: 'Pick a sprint', body: 'Browse the catalog, pick a skill that matters this week. Enrol in one tap.' },
              { icon: Clock,       day: 'Days 1–6', title: '20 min a day', body: 'Short daily lesson + a sharp quiz. Missable? No — momentum is the feature.' },
              { icon: CheckCircle2, day: 'Day 7', title: 'Ship & certify', body: 'Final project, auto-issued certificate, a signed artifact to show off.' },
            ].map(({ icon: Icon, day, title, body }, i) => (
              <li key={title} className="card relative pt-12">
                <span className="absolute top-6 left-6 font-mono text-xs text-ink-muted">0{i+1}</span>
                <Icon className="h-6 w-6 text-primary-800 mb-5" aria-hidden="true" />
                <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">{day}</p>
                <h3 className="mt-2 font-display text-2xl">{title}</h3>
                <p className="mt-3 text-ink-soft leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ FEATURED BOOTCAMPS ============ */}
      <section aria-labelledby="featured-heading" className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <h2 id="featured-heading" className="font-display text-display-lg">
            Up next.
          </h2>
          <Link href="/bootcamps" className="text-sm font-medium hover:text-primary-800 inline-flex items-center gap-1">
            View all bootcamps <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {featured && featured.length > 0 ? (
          <ul className="grid md:grid-cols-3 gap-6">
            {featured.map((b) => (
              <li key={b.slug}><BootcampCard bootcamp={b} /></li>
            ))}
          </ul>
        ) : (
          <div className="card text-center py-16">
            <p className="text-ink-muted">No bootcamps yet — run <code className="font-mono">supabase/schema.sql</code> to seed.</p>
          </div>
        )}
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" aria-labelledby="pricing-heading" className="bg-sand-100/60 border-t border-ink/10">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="chip mb-4 mx-auto">Pricing</p>
          <h2 id="pricing-heading" className="font-display text-display-lg">
            Free while we build.
          </h2>
          <p className="mt-6 text-ink-soft max-w-xl mx-auto">
            MVP is free for early cohorts. When paid sprints launch, you'll keep
            lifetime access to anything you enrolled in before then.
          </p>
          <Link href="/signup" className="btn-primary mt-10">
            Claim free access
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
