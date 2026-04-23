import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { PostHogProvider } from './providers';
import { PostHogIdentify } from '@/components/PostHogIdentify';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'SkillSprint — 7-day micro-bootcamps for tech & AI',
    template: '%s · SkillSprint',
  },
  description:
    'Ship a new tech or AI skill every week. SkillSprint delivers focused 7-day bootcamps with daily lessons, quizzes, and certificates.',
  keywords: ['AI bootcamp', 'micro-course', 'prompt engineering', 'Next.js', 'learning platform', 'tech skills'],
  authors: [{ name: 'SkillSprint' }],
  openGraph: {
    type: 'website',
    siteName: 'SkillSprint',
    title: 'SkillSprint — 7-day micro-bootcamps for tech & AI',
    description: 'Ship a new skill every week. Focused 7-day bootcamps, daily lessons, real progress.',
    url: SITE,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'SkillSprint' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillSprint',
    description: 'Ship a new tech or AI skill every week.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5eedb' },
    { media: '(prefers-color-scheme: dark)',  color: '#0a4f2d' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'SkillSprint',
    url: SITE,
    sameAs: [],
    description: '7-day micro-bootcamps for tech & AI skills.',
  };

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <PostHogProvider>
          <PostHogIdentify />
          <Navigation />
          <main id="main">{children}</main>
          <Footer />
        </PostHogProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </body>
    </html>
  );
}
