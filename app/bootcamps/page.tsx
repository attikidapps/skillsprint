import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { BootcampCard } from '@/components/BootcampCard';

export const metadata: Metadata = {
  title: 'All bootcamps',
  description: 'Browse all active 7-day SkillSprint bootcamps across AI, web dev, and data.',
};

export const revalidate = 60;

export default async function BootcampsPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from('bootcamps')
    .select('slug, title, tagline, category, difficulty, cover_url')
    .eq('is_published', true);

  if (searchParams.cat) query = query.eq('category', searchParams.cat);

  const { data: bootcamps } = await query;

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <header className="mb-16 max-w-3xl">
        <p className="chip mb-4">Catalog</p>
        <h1 className="font-display text-display-lg">
          Every sprint, <span className="italic font-light">ready to start</span>.
        </h1>
        <p className="mt-6 text-ink-soft text-lg">
          Pick one that matters this week. Each is 7 days, ~20 minutes a day, shipped by Sunday.
        </p>
      </header>

      {bootcamps && bootcamps.length > 0 ? (
        <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bootcamps.map((b) => (
            <li key={b.slug}><BootcampCard bootcamp={b} /></li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-muted">No bootcamps match that filter yet.</p>
      )}
    </div>
  );
}
