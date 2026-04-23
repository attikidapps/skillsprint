'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePostHog } from 'posthog-js/react';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const ph = usePostHog();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/callback`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.user) {
      ph?.capture('user_signed_up', { email_provider: email.split('@')[1] });
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="font-display text-display-md">Check your email.</h1>
        <p className="mt-4 text-ink-soft">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-display text-display-md">Start your first sprint.</h1>
      <p className="mt-3 text-ink-soft">Free while the MVP is in beta. No card required.</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
        {error && (
          <p role="alert" className="text-sm p-3 rounded-lg bg-red-50 text-red-800 border border-red-200">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">Full name</label>
          <input
            id="name" type="text" required autoComplete="name"
            value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-sand-50 px-4 py-3 focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
          <input
            id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-sand-50 px-4 py-3 focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
          <input
            id="password" type="password" required minLength={8} autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            aria-describedby="pwd-hint"
            className="w-full rounded-lg border border-ink/20 bg-sand-50 px-4 py-3 focus:border-ink"
          />
          <p id="pwd-hint" className="mt-1.5 text-xs text-ink-muted">Minimum 8 characters.</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink-soft text-center">
        Already have an account? <Link href="/login" className="underline font-medium">Sign in</Link>
      </p>
    </div>
  );
}
