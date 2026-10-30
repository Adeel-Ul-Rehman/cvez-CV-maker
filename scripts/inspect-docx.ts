import fs from 'fs';
import path from 'path';

function inspectUnzipped(dirName: string, label: string) {
  const docXmlPath = path.resolve('test-exports', dirName, 'word', 'document.xml');
  if (!fs.existsSync(docXmlPath)) {
    console.log(`Document XML not found for ${label}`);
    return;
  }
  const xml = fs.readFileSync(docXmlPath, 'utf8');
  const pCount = (xml.match(/<w:p[\s>]/g) || []).length;
  const tblCount = (xml.match(/<w:tbl[\s>]/g) || []).length;
  const runsCount = (xml.match(/<w:r[\s>]/g) || []).length;
  const shadingFills = (xml.match(/w:fill="[^"]+"/g) || []);
  const mediaDir = path.resolve('test-exports', dirName, 'word', 'media');
  const mediaFiles = fs.existsSync(mediaDir) ? fs.readdirSync(mediaDir) : [];

  console.log(`\n=== Inspection Details: ${label} ===`);
  console.log(`Paragraph count: ${pCount}`);
  console.log(`Table count: ${tblCount}`);
  console.log(`Text run count: ${runsCount}`);
  console.log(`Shading fills: ${shadingFills.join(', ') || 'none'}`);
  console.log(`Media files in word/media: ${mediaFiles.join(', ') || 'none'}`);
}

inspectUnzipped('europass_unzipped', 'Europass');
inspectUnzipped('creative_unzipped', 'Jobhire Creative');
