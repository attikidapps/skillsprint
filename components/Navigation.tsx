import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Sprout } from 'lucide-react';
import { UserMenu } from './UserMenu';

export async function Navigation() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // One small query for display name + creator flag.
  let profile: { full_name: string | null; is_creator: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, is_creator')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-sand-50/80 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl tracking-tight"
          aria-label="SkillSprint home"
        >
          <Sprout className="h-5 w-5 text-primary-800" aria-hidden="true" />
          <span>SkillSprint</span>
        </Link>

        <ul className="hidden md:flex items-center gap-8 text-sm">
          <li><Link href="/bootcamps"     className="hover:text-primary-800 transition-colors">Bootcamps</Link></li>
          <li><Link href="/#how-it-works" className="hover:text-primary-800 transition-colors">How it works</Link></li>
          <li><Link href="/#pricing"      className="hover:text-primary-800 transition-colors">Pricing</Link></li>
        </ul>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu
              userId={user.id}
              email={user.email ?? null}
              fullName={profile?.full_name ?? null}
              isCreator={Boolean(profile?.is_creator)}
            />
          ) : (
            <>
              <Link href="/login"  className="text-sm font-medium hover:text-primary-800">Log in</Link>
              <Link href="/signup" className="btn-primary text-sm !py-2">Get started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
