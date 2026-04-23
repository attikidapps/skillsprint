import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

type Bootcamp = {
  slug: string;
  title: string;
  tagline: string | null;
  category: string | null;
  difficulty: string | null;
  cover_url?: string | null;
};

export function BootcampCard({ bootcamp }: { bootcamp: Bootcamp }) {
  return (
    <Link
      href={`/bootcamps/${bootcamp.slug}`}
      className="card-interactive block group"
      aria-label={`View ${bootcamp.title} bootcamp`}
    >
      <div className="flex items-center justify-between">
        <span className="chip">{bootcamp.category ?? 'General'}</span>
        <ArrowUpRight
          className="h-5 w-5 text-ink-muted group-hover:text-primary-800 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
          aria-hidden="true"
        />
      </div>

      <h3 className="mt-5 font-display text-2xl leading-tight">{bootcamp.title}</h3>
      {bootcamp.tagline && (
        <p className="mt-3 text-ink-soft text-sm leading-relaxed line-clamp-3">
          {bootcamp.tagline}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3 text-xs text-ink-muted font-mono uppercase tracking-wider">
        <span>7 days</span>
        <span aria-hidden="true">·</span>
        <span>{bootcamp.difficulty ?? 'all levels'}</span>
      </div>
    </Link>
  );
}
