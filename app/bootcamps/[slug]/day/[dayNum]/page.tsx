import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LessonQuiz } from './LessonQuiz';

type Props = { params: { slug: string; dayNum: string } };

export default async function LessonPage({ params }: Props) {
  const dayNum = parseInt(params.dayNum, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/bootcamps/${params.slug}/day/${params.dayNum}`);

  const { data: bootcamp } = await supabase
    .from('bootcamps')
    .select('id, title, slug')
    .eq('slug', params.slug)
    .single();

  if (!bootcamp) notFound();

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('bootcamp_id', bootcamp.id)
    .eq('day_number', dayNum)
    .single();

  if (!lesson) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="font-display text-display-md">Day {dayNum} isn't ready yet</h1>
        <p className="mt-4 text-ink-soft">The creator hasn't published this lesson. Check back soon.</p>
        <Link href={`/bootcamps/${params.slug}`} className="btn-ghost mt-8">← Back to bootcamp</Link>
      </div>
    );
  }

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('lesson_id', lesson.id)
    .order('position');

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <nav aria-label="Lesson progress" className="mb-8">
        <Link href={`/bootcamps/${params.slug}`} className="text-sm text-ink-muted hover:text-ink">
          ← {bootcamp.title}
        </Link>
        <div className="mt-6 flex items-center gap-1" aria-label={`Day ${dayNum} of 7`}>
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-1 flex-1 rounded-full ${i + 1 <= dayNum ? 'bg-primary-800' : 'bg-ink/10'}`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs font-mono uppercase tracking-wider text-ink-muted">
          Day {dayNum} of 7
        </p>
      </nav>

      <header>
        <h1 className="font-display text-display-md">{lesson.title}</h1>
        <p className="mt-3 text-sm text-ink-muted">
          ~{lesson.estimated_minutes} min read
        </p>
      </header>

      {lesson.content_md && (
        <div className="prose prose-lg max-w-none mt-8 text-ink-soft leading-relaxed whitespace-pre-line">
          {lesson.content_md}
        </div>
      )}

      {questions && questions.length > 0 && (
        <section className="mt-16 pt-12 border-t border-ink/10" aria-labelledby="quiz">
          <h2 id="quiz" className="font-display text-display-md mb-6">Quick check</h2>
          <LessonQuiz
            questions={questions as any}
            lessonId={lesson.id}
            bootcampId={bootcamp.id}
            isFinalDay={dayNum === 7}
            nextUrl={dayNum < 7 ? `/bootcamps/${params.slug}/day/${dayNum + 1}` : `/dashboard`}
          />
        </section>
      )}
    </article>
  );
}
