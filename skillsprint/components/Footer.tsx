import Link from 'next/link';
import { Sprout } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-sand-100/50 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display text-xl">
            <Sprout className="h-5 w-5 text-primary-800" aria-hidden="true" />
            SkillSprint
          </div>
          <p className="mt-3 text-sm text-ink-soft max-w-sm">
            Ship a new tech or AI skill every week. Focused bootcamps, real progress, no bloat.
          </p>
        </div>

        <nav aria-label="Learn">
          <h2 className="font-medium text-sm mb-3">Learn</h2>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/bootcamps" className="hover:text-ink">All bootcamps</Link></li>
            <li><Link href="/bootcamps?cat=AI" className="hover:text-ink">AI track</Link></li>
            <li><Link href="/bootcamps?cat=Web%20Dev" className="hover:text-ink">Web dev track</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="font-medium text-sm mb-3">Company</h2>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/#how-it-works" className="hover:text-ink">How it works</Link></li>
            <li><Link href="/#pricing" className="hover:text-ink">Pricing</Link></li>
            <li><Link href="/admin" className="hover:text-ink">Teach on SkillSprint</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-ink/10">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-ink-muted flex justify-between">
          <span>© {new Date().getFullYear()} SkillSprint</span>
          <span>Made with intent ✦</span>
        </div>
      </div>
    </footer>
  );
}
