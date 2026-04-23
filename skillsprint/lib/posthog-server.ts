import 'server-only';
import { PostHog } from 'posthog-node';

/**
 * Singleton PostHog client for server-side event capture.
 *
 * Server routes in Next.js are short-lived, so flushAt/flushInterval are set
 * to near-zero to emit events immediately. Always `await ph.shutdown()` at
 * the end of the request if it might be the last use in that process.
 *
 * Returns `null` if NEXT_PUBLIC_POSTHOG_KEY is not set — callers should
 * no-op when analytics isn't configured.
 */
let _client: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!_client) {
    _client = new PostHog(key, {
      host:         process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt:      1,
      flushInterval: 0,
    });
  }
  return _client;
}

/** Fire-and-forget server event; safe when PostHog isn't configured. */
export async function captureServer(
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>
) {
  const ph = getPostHogServer();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
  // Flush but don't block the response longer than necessary.
  await ph.flush().catch(() => {});
}
