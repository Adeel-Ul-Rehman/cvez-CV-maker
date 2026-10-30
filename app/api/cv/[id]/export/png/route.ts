import { NextRequest } from 'next/server';
import { handleCvExport } from '@/lib/export/export-helper';
import { generatePng } from '@/lib/export/image';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return handleCvExport(
    req,
    params.id,
    'png',
    'image/png',
    async (cv) => generatePng({ templateKey: cv.template_key, data: cv.data, config: cv.config })
  );
}
