'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function ForumComposer({ bootcampId }: { bootcampId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPosting(false); return; }
    const { error } = await supabase.from('forum_posts').insert({
      bootcamp_id: bootcampId,
      author_id: user.id,
      body: body.trim(),
    });
    setPosting(false);
    if (!error) {
      setBody('');
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 card">
      <label htmlFor="post-body" className="block text-sm font-medium mb-2">
        New post
      </label>
      <textarea
        id="post-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Share your progress, stuck on something, or ask away…"
        className="w-full rounded-lg border border-ink/20 bg-sand-50 px-4 py-3 focus:border-ink resize-none"
      />
      <div className="mt-3 flex justify-end">
        <button type="submit" disabled={posting || !body.trim()} className="btn-primary">
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}
