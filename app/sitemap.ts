import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { data: bootcamps } = await supabase
    .from('bootcamps')
    .select('slug, created_at')
    .eq('is_published', true);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE, priority: 1.0, changeFrequency: 'weekly' },
    { url: `${SITE}/bootcamps`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${SITE}/login`,     priority: 0.3 },
    { url: `${SITE}/signup`,    priority: 0.3 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap =
    bootcamps?.map((b) => ({
      url: `${SITE}/bootcamps/${b.slug}`,
      lastModified: b.created_at,
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    })) ?? [];

  return [...staticRoutes, ...dynamicRoutes];
}
