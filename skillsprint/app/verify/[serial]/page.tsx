import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle2, Download } from 'lucide-react';

export const revalidate = 300;

export default async function VerifyPage({ params }: { params: { serial: string } }) {
  const supabase = createClient();
  const { data: cert } = await supabase
    .from('certificates')
    .select(`
      serial, issued_at,
      bootcamps ( title, slug ),
      profiles  ( full_name )
    `)
    .eq('serial', params.serial)
    .single();

  if (!cert) notFound();

  const date = new Date(cert.issued_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <div className="card border-primary-600/30 bg-primary-50/40">
        <div className="flex items-center gap-3 text-primary-800">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-display text-2xl">Verified certificate</h1>
        </div>

        <dl className="mt-8 space-y-5">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-muted">Recipient</dt>
            <dd className="font-display text-3xl mt-1">
              {(cert as any).profiles?.full_name ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-muted">Bootcamp</dt>
            <dd className="font-display italic text-xl text-primary-800 mt-1">
              {(cert as any).bootcamps?.title}
            </dd>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-muted">Issued</dt>
              <dd className="mt-1">{date}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-muted">Serial</dt>
              <dd className="mt-1 font-mono text-sm">{cert.serial}</dd>
            </div>
          </div>
        </dl>

        <a
          href={`/api/certificates/${cert.serial}`}
          className="btn-ghost mt-10 w-full justify-center"
          aria-label="Download certificate as PDF"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download PDF
        </a>
      </div>
    </div>
  );
}
