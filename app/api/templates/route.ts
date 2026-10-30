import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { TEMPLATES } from '@/templates/registry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const rows = await sql`
      SELECT
        id,
        template_key AS "key",
        name,
        description,
        category,
        thumbnail_url AS "thumbnailUrl",
        definition,
        display_order AS "displayOrder"
      FROM templates
      WHERE is_active = TRUE
      ORDER BY display_order ASC, created_at ASC;
    `;

    if (rows && rows.length > 0) {
      const templates = rows.map((r) => ({
        key: r.key,
        name: r.name,
        description: r.description,
        category: r.category,
        isAts: r.category === 'ATS' || (r.definition as any)?.layoutHints?.columns === 1,
        sampleUrl: `/api/templates/${r.key}/sample-preview`,
        thumbnailUrl: r.thumbnailUrl || `/template-thumbnails/${r.key}.png`,
      }));
      return NextResponse.json({ ok: true, templates });
    }

    // Fallback to registry if DB is empty
    const fallback = TEMPLATES.map((t) => ({
      key: t.key,
      name: t.name,
      description: t.description,
      category: t.category,
      isAts: t.category === 'ATS' || t.layoutHints?.columns === 1,
      sampleUrl: `/api/templates/${t.key}/sample-preview`,
      thumbnailUrl: `/template-thumbnails/${t.key}.png`,
    }));

    return NextResponse.json({ ok: true, templates: fallback });
  } catch (error: any) {
    // If DB fails, fallback to static registry
    const fallback = TEMPLATES.map((t) => ({
      key: t.key,
      name: t.name,
      description: t.description,
      category: t.category,
      isAts: t.category === 'ATS' || t.layoutHints?.columns === 1,
      sampleUrl: `/api/templates/${t.key}/sample-preview`,
      thumbnailUrl: `/template-thumbnails/${t.key}.png`,
    }));
    return NextResponse.json({ ok: true, templates: fallback });
  }
}
