'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, LayoutDashboard, UserCog, ChevronDown } from 'lucide-react';

type Props = {
  userId: string;
  email: string | null;
  fullName: string | null;
  isCreator: boolean;
};

export function UserMenu({ userId, email, fullName, isCreator }: Props) {
  const router   = useRouter();
  const supabase = createClient();
  const [open, setOpen]         = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  const displayName = fullName?.trim() || email?.split('@')[0] || 'Account';
  const initial = (displayName[0] || 'A').toUpperCase();

  // ---------- Close on outside click + Escape ----------
  useEffect(() => {
    if (!open) return;

    function onPointer(e: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Move focus into the menu when it opens (a11y)
  useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  async function onSignOut() {
    setSigningOut(true);
    // Supabase signOut triggers SIGNED_OUT on the auth listener,
    // which the PostHogIdentify component already handles with reset().
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        className="flex items-center gap-2 rounded-full border border-ink/15 pl-1 pr-3 py-1
                   hover:border-ink/40 transition-colors"
      >
        <span
          aria-hidden="true"
          className="h-7 w-7 rounded-full bg-primary-800 text-sand-50
                     flex items-center justify-center font-display text-sm font-medium"
        >
          {initial}
        </span>
        <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          id="user-menu"
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 mt-2 w-64 rounded-2xl border border-ink/10
                     bg-sand-50 shadow-[0_18px_40px_-18px_rgba(10,79,45,0.35)]
                     p-2 z-50 animate-fade-in"
        >
          <div className="px-3 py-2 border-b border-ink/10 mb-1">
            <p className="font-medium text-sm truncate">{displayName}</p>
            {email && <p className="text-xs text-ink-muted truncate">{email}</p>}
          </div>

          <Link
            ref={firstItemRef}
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm
                       hover:bg-ink/5 focus:bg-ink/5 focus:outline-none"
          >
            <LayoutDashboard className="h-4 w-4 text-ink-muted" aria-hidden="true" />
            Dashboard
          </Link>

          {isCreator && (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm
                         hover:bg-ink/5 focus:bg-ink/5 focus:outline-none"
            >
              <UserCog className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              Creator admin
            </Link>
          )}

          <div className="h-px bg-ink/10 my-1.5" role="separator" />

          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm
                       hover:bg-ink/5 focus:bg-ink/5 focus:outline-none
                       text-ink-soft disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
