import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { CertificatePDF } from '@/components/CertificatePDF';

// @react-pdf/renderer requires the Node runtime (it uses Node streams & fs).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { serial: string } }
) {
  const supabase = createClient();

  const { data: cert, error } = await supabase
    .from('certificates')
    .select(`
      serial,
      issued_at,
      bootcamps ( title ),
      profiles  ( full_name )
    `)
    .eq('serial', params.serial)
    .single();

  if (error || !cert) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  const recipientName = (cert as any).profiles?.full_name || 'SkillSprint Graduate';
  const bootcampTitle = (cert as any).bootcamps?.title     || 'Unknown Bootcamp';
  const issuedDate    = new Date(cert.issued_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const verifyUrl = `${site.replace(/^https?:\/\//, '')}/verify/${cert.serial}`;

  const buffer = await renderToBuffer(
    <CertificatePDF
      recipientName={recipientName}
      bootcampTitle={bootcampTitle}
      issuedDate={issuedDate}
      serial={cert.serial}
      verifyUrl={verifyUrl}
    />
  );

  const filename = `SkillSprint-${cert.serial}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control':       'private, max-age=3600',
    },
  });
}
