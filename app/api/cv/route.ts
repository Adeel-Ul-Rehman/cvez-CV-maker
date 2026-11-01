import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { createCvSchema } from '@/lib/schemas/cv';
import { cvConfigSchema, cvDataSchema, defaultConfigFor, emptyCvData } from '@/lib/cv/schema';
import { MAX_CVS_PER_USER } from '@/lib/cv/limits';
import { badRequest, forbidden, handleApiError, notFound } from '@/lib/errors';
import { getTemplate } from '@/templates/registry';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    const body = await req.json();
    const parsed = createCvSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw badRequest(firstIssue?.message || 'Invalid CV input data', 'VALIDATION_ERROR');
    }

    const { title, templateKey, data: partialData, config: partialConfig } = parsed.data;

    // Verify template definition exists in registry
    const templateDef = getTemplate(templateKey);
    if (!templateDef) {
      throw badRequest(`Template '${templateKey}' is not supported`, 'INVALID_TEMPLATE');
    }

    const createdCv = await withTransaction(async (tx) => {
      // 1. Lock user row and check cv_count
      const userRows = await tx.sql`
        SELECT id, full_name, cv_count
        FROM users
        WHERE id = ${authUser.userId}
        FOR UPDATE;
      `;

      if (!userRows || userRows.length === 0) {
        throw notFound('User not found', 'USER_NOT_FOUND');
      }

      const user = userRows[0];
      const currentCount = Number(user.cv_count) || 0;

      if (currentCount >= MAX_CVS_PER_USER) {
        throw forbidden(
          `You have reached the maximum limit of ${MAX_CVS_PER_USER} CVs (current count: ${currentCount})`,
          'CV_LIMIT_REACHED'
        );
      }

      // 2. Prepare data: Automatically inherit profile & career details from user's latest CV
      const previousCvRows = await tx.sql`
        SELECT data
        FROM cvs
        WHERE user_id = ${authUser.userId}
        ORDER BY updated_at DESC
        LIMIT 1;
      `;
      const prevData = previousCvRows?.[0]?.data as any;

      const starter = emptyCvData(user.full_name || undefined);

      const mergedBasics = {
        ...starter.basics,
        ...(prevData?.basics || {}),
        ...(partialData?.basics || {}),
      };

      const mergedSections =
        partialData?.sections !== undefined
          ? partialData.sections
          : prevData?.sections && Array.isArray(prevData.sections) && prevData.sections.length > 0
          ? prevData.sections
          : starter.sections;

      const mergedData = {
        basics: mergedBasics,
        sections: mergedSections,
        meta: {
          wizardCompleted: false,
          wizardStep: 1,
        },
      };

      const validatedData = cvDataSchema.parse(mergedData);

      // 3. Prepare and validate config
      const defaultConf = defaultConfigFor(templateKey);
      const mergedConfig = {
        ...defaultConf,
        wizardCompleted: false,
        wizardStep: 1,
        ...(partialConfig || {}),
      };

      const validatedConfig = cvConfigSchema.parse(mergedConfig);

      // 4. Insert into cvs
      const dataJson = JSON.stringify(validatedData);
      const configJson = JSON.stringify(validatedConfig);

      const insertedRows = await tx.sql`
        INSERT INTO cvs (
          user_id,
          title,
          template_key,
          data,
          config,
          is_public,
          public_slug
        )
        VALUES (
          ${authUser.userId},
          ${title},
          ${templateKey},
          ${dataJson}::jsonb,
          ${configJson}::jsonb,
          FALSE,
          NULL
        )
        RETURNING *;
      `;

      // 5. Increment user cv_count
      await tx.sql`
        UPDATE users
        SET cv_count = cv_count + 1, updated_at = now()
        WHERE id = ${authUser.userId};
      `;

      return insertedRows[0];
    });

    return NextResponse.json({
      ok: true,
      data: {
        cv: createdCv,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
