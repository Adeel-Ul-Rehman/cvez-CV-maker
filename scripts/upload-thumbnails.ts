import fs from 'fs';
import path from 'path';
import { sql } from '../lib/db';
import { uploadBuffer, deleteAsset, ALLOWED_FOLDERS } from '../lib/cloudinary';
import { TEMPLATE_KEYS } from '../templates/registry';

async function main() {
  console.log('============================================================');
  console.log('TEMPLATE THUMBNAILS UPLOAD UTILITY');
  console.log('============================================================\n');
  console.log('Expected path pattern: /public/template-thumbnails/{templateKey}.png');
  console.log('Supported templates:', TEMPLATE_KEYS.join(', '), '\n');

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const templateKey of TEMPLATE_KEYS) {
    const thumbPath = path.resolve(
      process.cwd(),
      'public',
      'template-thumbnails',
      `${templateKey}.png`
    );

    if (!fs.existsSync(thumbPath)) {
      console.warn(`[SKIPPED] Missing thumbnail file for '${templateKey}'`);
      console.warn(`  Expected location: ${thumbPath}`);
      skipped++;
      continue;
    }

    try {
      console.log(`Processing thumbnail for '${templateKey}'...`);
      const buffer = fs.readFileSync(thumbPath);

      // 1. Fetch current thumbnail_public_id from DB
      const existingRows = await sql`
        SELECT thumbnail_public_id
        FROM templates
        WHERE template_key = ${templateKey}
        LIMIT 1;
      `;
      const oldPublicId = existingRows[0]?.thumbnail_public_id;

      // 2. Upload to Cloudinary
      const publicId = `template-${templateKey}-${Date.now()}`;
      const uploadRes = await uploadBuffer(buffer, {
        folder: ALLOWED_FOLDERS.TEMPLATE_THUMBS,
        publicId,
        format: 'png',
      });

      // 3. Update templates record in DB
      await sql`
        UPDATE templates
        SET thumbnail_url = ${uploadRes.url},
            thumbnail_public_id = ${uploadRes.publicId},
            updated_at = now()
        WHERE template_key = ${templateKey};
      `;

      // 4. Delete old Cloudinary asset if present
      if (oldPublicId) {
        await deleteAsset(oldPublicId);
      }

      console.log(`  ✓ Uploaded: ${uploadRes.url}`);
      uploaded++;
    } catch (err: any) {
      console.error(`  ✗ Error uploading thumbnail for '${templateKey}':`, err.message || err);
      errors++;
    }
  }

  console.log('\n============================================================');
  console.log(`SUMMARY: Uploaded: ${uploaded}, Skipped: ${skipped}, Errors: ${errors}`);
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('Fatal error in upload-thumbnails:', err);
  process.exit(1);
});
