import { sql, TransactionContext } from '../db';
import { MAX_VERSIONS_PER_CV } from './limits';

export interface CvSnapshotTarget {
  id: string;
  data: any;
  config: any;
}

/**
 * Inserts a snapshot of the current CV's data and config into cv_versions.
 * Must be called before updating or restoring a CV.
 */
export async function snapshotCurrentVersion(
  cv: CvSnapshotTarget,
  tx?: TransactionContext
): Promise<void> {
  const dataJson = typeof cv.data === 'string' ? cv.data : JSON.stringify(cv.data);
  const configJson = typeof cv.config === 'string' ? cv.config : JSON.stringify(cv.config);

  if (tx) {
    await tx.sql`
      INSERT INTO cv_versions (cv_id, data, config)
      VALUES (${cv.id}, ${dataJson}::jsonb, ${configJson}::jsonb);
    `;
  } else {
    await sql`
      INSERT INTO cv_versions (cv_id, data, config)
      VALUES (${cv.id}, ${dataJson}::jsonb, ${configJson}::jsonb);
    `;
  }
}

/**
 * Prunes older versions for a CV so that only the newest MAX_VERSIONS_PER_CV (20) remain.
 */
export async function pruneOldVersions(
  cvId: string,
  tx?: TransactionContext
): Promise<number> {
  if (tx) {
    const deleted = await tx.sql`
      DELETE FROM cv_versions
      WHERE id IN (
        SELECT id FROM cv_versions
        WHERE cv_id = ${cvId}
        ORDER BY created_at DESC
        OFFSET ${MAX_VERSIONS_PER_CV}
      )
      RETURNING id;
    `;
    return deleted.length;
  } else {
    const deleted = await sql`
      DELETE FROM cv_versions
      WHERE id IN (
        SELECT id FROM cv_versions
        WHERE cv_id = ${cvId}
        ORDER BY created_at DESC
        OFFSET ${MAX_VERSIONS_PER_CV}
      )
      RETURNING id;
    `;
    return deleted.length;
  }
}
