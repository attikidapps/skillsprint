'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePostHog } from 'posthog-js/react';

export function EnrollButton({
  bootcampId,
  slug,
  initiallyEnrolled,
}: {
  bootcampId: string;
  slug: string;
  initiallyEnrolled: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const ph = usePostHog();
  const [enrolled, setEnrolled] = useState(initiallyEnrolled);
  const [loading, setLoading] = useState(false);

  async function enrol() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { error } = await supabase.from('enrollments').insert({
      user_id: user.id,
      bootcamp_id: bootcampId,
    });
    setLoading(false);
    if (!error) {
      ph?.capture('bootcamp_enrolled', { bootcamp_id: bootcampId, slug });
      setEnrolled(true);
      router.push(`/bootcamps/${slug}/day/1`);
    }
  }

  if (enrolled) {
    return (
      <a href={`/bootcamps/${slug}/day/1`} className="btn-primary">
        Continue →
      </a>
    );
  }

  return (
    <button onClick={enrol} disabled={loading} className="btn-primary">
      {loading ? 'Enrolling…' : 'Enrol — free'}
    </button>
  );
}
