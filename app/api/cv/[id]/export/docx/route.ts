import { NextRequest } from 'next/server';
import { handleCvExport } from '@/lib/export/export-helper';
import { generateDocx } from '@/lib/docx';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return handleCvExport(
    req,
    params.id,
    'docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    async (cv) => generateDocx(cv.template_key, { data: cv.data, config: cv.config })
  );
}
