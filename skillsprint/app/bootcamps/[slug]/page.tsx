import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { EnrollButton } from './EnrollButton';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: b } = await supabase
    .from('bootcamps')
    .select('title, tagline, description')
    .eq('slug', params.slug)
    .single();

  if (!b) return { title: 'Not found' };
  return {
    title: b.title,
    description: b.tagline ?? b.description ?? undefined,
    openGraph: { title: b.title, description: b.tagline ?? undefined },
  };
}

export default async function BootcampDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: bootcamp } = await supabase
    .from('bootcamps')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!bootcamp) notFound();

  const { data: lessons } = await supabase
    .from('lessons')
    .select('day_number, title, estimated_minutes')
    .eq('bootcamp_id', bootcamp.id)
    .order('day_number');

  const { data: { user } } = await supabase.auth.getUser();
  let enrolled = false;
  if (user) {
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('bootcamp_id', bootcamp.id)
      .maybeSingle();
    enrolled = !!data;
  }

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: bootcamp.title,
    description: bootcamp.description ?? bootcamp.tagline,
    provider: {
      '@type': 'Organization',
      name: 'SkillSprint',
      sameAs: process.env.NEXT_PUBLIC_SITE_URL,
    },
  };

  return (
    <article className="mx-auto max-w-4xl px-6 py-20">
      <Link href="/bootcamps" className="text-sm text-ink-muted hover:text-ink">← All bootcamps</Link>

      <header className="mt-8">
        <div className="flex items-center gap-2">
          <span className="chip">{bootcamp.category}</span>
          <span className="chip">{bootcamp.difficulty}</span>
        </div>
        <h1 className="mt-6 font-display text-display-lg">{bootcamp.title}</h1>
        {bootcamp.tagline && (
          <p className="mt-4 text-xl text-ink-soft">{bootcamp.tagline}</p>
        )}
      </header>

      <section className="mt-12 card">
        <p className="text-ink whitespace-pre-line leading-relaxed">{bootcamp.description}</p>
        <div className="mt-8 pt-6 border-t border-ink/10 flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-ink-muted">
            <strong className="text-ink font-medium">7 days</strong> · ~20 min/day · quiz + certificate
          </div>
          {user ? (
            <EnrollButton bootcampId={bootcamp.id} slug={bootcamp.slug} initiallyEnrolled={enrolled} />
          ) : (
            <Link href="/signup" className="btn-primary">Sign up to enrol</Link>
          )}
        </div>
      </section>

      <section className="mt-16" aria-labelledby="syllabus">
        <h2 id="syllabus" className="font-display text-display-md mb-6">Syllabus</h2>
        {lessons && lessons.length > 0 ? (
          <ol className="space-y-3">
            {lessons.map((l) => (
              <li key={l.day_number} className="flex items-center gap-4 p-4 rounded-xl border border-ink/10 bg-sand-50">
                <span className="font-mono text-xs text-ink-muted w-14">Day {l.day_number}</span>
                <span className="font-medium flex-1">{l.title}</span>
                <span className="text-xs text-ink-muted">{l.estimated_minutes} min</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-ink-muted">Lessons are being finalised. Enrol to get notified on launch.</p>
        )}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
    </article>
  );
}
