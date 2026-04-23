import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ArrowUpRight, Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your active sprints and progress.',
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, started_at, completed_at, bootcamps ( slug, title, tagline, category )')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  // Progress per enrollment
  const progressByBootcamp: Record<string, { done: number; total: number }> = {};
  for (const e of enrollments ?? []) {
    const bc = (e as any).bootcamps;
    if (!bc) continue;
    const { count: total } = await supabase
      .from('lessons').select('id', { count: 'exact', head: true })
      .eq('bootcamp_id', (await supabase.from('bootcamps').select('id').eq('slug', bc.slug).single()).data!.id);
    const { data: done } = await supabase
      .from('lesson_progress')
      .select('lesson_id, lessons!inner(bootcamp_id, bootcamps!inner(slug))')
      .eq('user_id', user.id).eq('completed', true)
      .eq('lessons.bootcamps.slug', bc.slug);
    progressByBootcamp[bc.slug] = { done: done?.length ?? 0, total: total ?? 0 };
  }

  const { data: certs } = await supabase
    .from('certificates')
    .select('serial, issued_at, bootcamps ( title, slug )')
    .eq('user_id', user.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-12">
        <p className="chip mb-4">Dashboard</p>
        <h1 className="font-display text-display-lg">
          Hi, {profile?.full_name?.split(' ')[0] || 'there'}.
        </h1>
        <p className="mt-4 text-ink-soft text-lg">Keep the streak alive.</p>
      </header>

      <section aria-labelledby="active" className="mb-20">
        <div className="flex items-end justify-between mb-6">
          <h2 id="active" className="font-display text-2xl">Active sprints</h2>
          <Link href="/bootcamps" className="text-sm hover:text-primary-800 inline-flex items-center gap-1">
            Browse more <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {enrollments && enrollments.length > 0 ? (
          <ul className="grid md:grid-cols-2 gap-6">
            {enrollments.map((e: any) => {
              const bc = e.bootcamps;
              const p = progressByBootcamp[bc?.slug] ?? { done: 0, total: 7 };
              const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
              return (
                <li key={e.id}>
                  <Link href={`/bootcamps/${bc.slug}/day/${Math.min(p.done + 1, 7)}`} className="card-interactive block">
                    <div className="flex items-center justify-between">
                      <span className="chip">{bc.category}</span>
                      <span className="text-xs font-mono text-ink-muted">{p.done}/{p.total || 7}</span>
                    </div>
                    <h3 className="mt-4 font-display text-xl">{bc.title}</h3>
                    <p className="mt-2 text-sm text-ink-soft line-clamp-2">{bc.tagline}</p>
                    <div className="mt-5 h-1.5 rounded-full bg-ink/10 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full bg-primary-800" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="card text-center py-14">
            <p className="text-ink-muted mb-4">You haven't enrolled in any sprints yet.</p>
            <Link href="/bootcamps" className="btn-primary">Browse bootcamps</Link>
          </div>
        )}
      </section>

      <section aria-labelledby="certs">
        <h2 id="certs" className="font-display text-2xl mb-6 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary-800" aria-hidden="true" />
          Certificates
        </h2>
        {certs && certs.length > 0 ? (
          <ul className="grid md:grid-cols-2 gap-4">
            {certs.map((c: any) => (
              <li key={c.serial} className="card">
                <p className="font-mono text-xs text-ink-muted">{c.serial}</p>
                <p className="font-display text-lg mt-2">{c.bootcamps?.title}</p>
                <p className="text-sm text-ink-muted mt-1">
                  Issued {new Date(c.issued_at).toLocaleDateString()}
                </p>
                <div className="mt-5 flex gap-3 text-sm">
                  <a
                    href={`/api/certificates/${c.serial}`}
                    target="_blank"
                    rel="noopener"
                    className="font-medium underline hover:text-primary-800"
                  >
                    Download PDF
                  </a>
                  <span aria-hidden="true" className="text-ink-muted">·</span>
                  <Link
                    href={`/verify/${c.serial}`}
                    className="font-medium underline hover:text-primary-800"
                  >
                    Verify link
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted text-sm">Finish a sprint to earn your first certificate.</p>
        )}
      </section>
    </div>
  );
}
