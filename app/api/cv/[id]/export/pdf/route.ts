import { NextRequest } from 'next/server';
import { handleCvExport } from '@/lib/export/export-helper';
import { generatePdf } from '@/lib/export/pdf';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return handleCvExport(
    req,
    params.id,
    'pdf',
    'application/pdf',
    async (cv) => generatePdf({ templateKey: cv.template_key, data: cv.data, config: cv.config })
  );
}
