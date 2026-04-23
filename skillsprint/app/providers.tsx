'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';

// Init once per tab.
if (typeof window !== 'undefined') {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (key && !posthog.__loaded) {
    posthog.init(key, {
      api_host:         process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles:  'identified_only',   // don't profile anonymous visitors
      capture_pageview: false,               // we capture manually in App Router
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist:    ['click', 'submit'],
        element_allowlist:      ['a', 'button', 'form'],
        // Never capture inputs — avoids grabbing PII.
      },
      respect_dnt: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug(false);
      },
    });
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // If no key, render children directly — analytics is optional.
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const ph           = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    ph.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}
