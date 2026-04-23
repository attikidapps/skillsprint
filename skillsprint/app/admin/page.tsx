import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Creator dashboard',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles').select('is_creator, full_name').eq('id', user.id).single();

  if (!profile?.is_creator) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-display-md">Teach on SkillSprint</h1>
        <p className="mt-4 text-ink-soft">
          Creator accounts are opt-in. Ask an admin (or flip <code className="font-mono text-sm">is_creator = true</code>
          {' '}on your profile row in Supabase) to start building bootcamps.
        </p>
        <Link href="/dashboard" className="btn-ghost mt-8">Back to dashboard</Link>
      </div>
    );
  }

  const { data: myBootcamps } = await supabase
    .from('bootcamps')
    .select('id, slug, title, is_published, created_at')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="flex items-end justify-between flex-wrap gap-4 mb-12">
        <div>
          <p className="chip mb-4">Creator</p>
          <h1 className="font-display text-display-lg">Your bootcamps</h1>
        </div>
        <Link href="/admin/new" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New bootcamp
        </Link>
      </header>

      {myBootcamps && myBootcamps.length > 0 ? (
        <table className="w-full text-left">
          <caption className="sr-only">Your bootcamps</caption>
          <thead className="text-xs uppercase tracking-wider text-ink-muted border-b border-ink/10">
            <tr>
              <th scope="col" className="py-3">Title</th>
              <th scope="col" className="py-3">Slug</th>
              <th scope="col" className="py-3">Status</th>
              <th scope="col" className="py-3 sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {myBootcamps.map((b) => (
              <tr key={b.id} className="border-b border-ink/5">
                <td className="py-4 font-medium">{b.title}</td>
                <td className="py-4 font-mono text-sm text-ink-muted">{b.slug}</td>
                <td className="py-4">
                  <span className={`chip ${b.is_published ? '!border-primary-600 text-primary-800' : ''}`}>
                    {b.is_published ? 'Live' : 'Draft'}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <Link href={`/admin/edit/${b.slug}`} className="text-sm underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="card text-center py-14">
          <p className="text-ink-muted mb-4">No bootcamps yet. Create your first one.</p>
          <Link href="/admin/new" className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New bootcamp
          </Link>
        </div>
      )}
    </div>
  );
}
