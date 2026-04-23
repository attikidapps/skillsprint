'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePostHog } from 'posthog-js/react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const ph = usePostHog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.user) ph?.capture('user_logged_in', { method: 'password' });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-display-md">Welcome back.</h1>
      <p className="mt-3 text-ink-soft">Pick up where your sprint left off.</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
        {error && (
          <p role="alert" className="text-sm p-3 rounded-lg bg-red-50 text-red-800 border border-red-200">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-sand-50 px-4 py-3 focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-sand-50 px-4 py-3 focus:border-ink"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink-soft text-center">
        New here? <Link href="/signup" className="underline font-medium">Create an account</Link>
      </p>
    </div>
  );
}
