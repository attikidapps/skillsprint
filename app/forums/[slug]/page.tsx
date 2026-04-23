import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ForumComposer } from './ForumComposer';

type Props = { params: { slug: string } };

export default async function ForumPage({ params }: Props) {
  const supabase = createClient();
  const { data: bootcamp } = await supabase
    .from('bootcamps').select('id, title, slug').eq('slug', params.slug).single();
  if (!bootcamp) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id, body, created_at, profiles ( full_name, avatar_url )')
    .eq('bootcamp_id', bootcamp.id)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href={`/bootcamps/${bootcamp.slug}`} className="text-sm text-ink-muted hover:text-ink">
        ← {bootcamp.title}
      </Link>
      <h1 className="mt-4 font-display text-display-md">Discussion</h1>
      <p className="mt-2 text-ink-soft">Ask questions, share wins, link projects.</p>

      {user ? (
        <ForumComposer bootcampId={bootcamp.id} />
      ) : (
        <p className="mt-8 text-sm text-ink-muted">
          <Link href="/login" className="underline">Log in</Link> to post.
        </p>
      )}

      <ul className="mt-10 space-y-5">
        {posts?.map((p: any) => (
          <li key={p.id} className="card">
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <span className="font-medium text-ink">{p.profiles?.full_name ?? 'Anonymous'}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={p.created_at}>{new Date(p.created_at).toLocaleDateString()}</time>
            </div>
            <p className="mt-3 whitespace-pre-line leading-relaxed">{p.body}</p>
          </li>
        ))}
        {(!posts || posts.length === 0) && (
          <li className="text-ink-muted text-sm">Be the first to post.</li>
        )}
      </ul>
    </div>
  );
}
