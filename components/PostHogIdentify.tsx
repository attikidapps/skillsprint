'use client';

import { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { createClient } from '@/lib/supabase/client';

/**
 * Listens to Supabase auth state and calls PostHog identify() / reset()
 * accordingly. Mount once near the root (inside the PostHogProvider).
 */
export function PostHogIdentify() {
  const ph = usePostHog();
  const supabase = createClient();

  useEffect(() => {
    if (!ph) return;

    // Initial identify on mount
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        ph.identify(data.user.id, {
          email: data.user.email,
          name:  (data.user.user_metadata as any)?.full_name,
        });
      }
    });

    // Sync on future changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        ph.identify(session.user.id, {
          email: session.user.email,
          name:  (session.user.user_metadata as any)?.full_name,
        });
      } else if (event === 'SIGNED_OUT') {
        ph.reset();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [ph, supabase]);

  return null;
}
