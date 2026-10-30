import fs from 'fs';
import path from 'path';
import {
  Paragraph,
  TextRun,
  BorderStyle,
  AlignmentType,
} from 'docx';
import type { CvData, CvConfig } from '@/lib/cv/schema';

export const NO_BORDER = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

export const NO_TABLE_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

/**
 * Clean hex string to 6 characters without '#'
 */
export function cleanHex(hex?: string, fallback = '000000'): string {
  if (!hex) return fallback;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return clean.length === 6 ? clean : fallback;
}

/**
 * Approximates a color tint with a given opacity blended against a white (#FFFFFF) background.
 */
export function tintColorHex(hex: string, opacity: number): string {
  const clean = cleanHex(hex, '8B5CF6');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const blendedR = Math.round(255 * (1 - opacity) + r * opacity);
  const blendedG = Math.round(255 * (1 - opacity) + g * opacity);
  const blendedB = Math.round(255 * (1 - opacity) + b * opacity);

  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `${toHex(blendedR)}${toHex(blendedG)}${toHex(blendedB)}`;
}

/**
 * Sanitize text to avoid null/undefined output in documents.
 */
export function sanitizeText(s?: string | null): string {
  if (!s) return '';
  return s.trim();
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatSingleDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{1,2})/);
  if (match) {
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_NAMES[monthIdx]} ${year}`;
    }
  }
  return trimmed;
}

export function formatDateRange(
  start?: string | null,
  end?: string | null,
  current?: boolean
): string {
  const formattedStart = formatSingleDate(start);
  if (!formattedStart) return '';

  if (current) {
    return `${formattedStart} – Present`;
  }
  if (!end || !end.trim()) {
    return formattedStart;
  }
  const formattedEnd = formatSingleDate(end);
  return `${formattedStart} – ${formattedEnd}`;
}

/**
 * Split multi-line descriptions into individual bullet strings without leading bullet characters.
 */
export function chunkBullets(text?: string | null): string[] {
  if (!text || !text.trim()) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith('•') || line.startsWith('-') ? line.replace(/^[•\-]\s*/, '') : line));
}

/**
 * Creates a styled section heading paragraph with a colored bottom border.
 */
export function heading(text: string, level: number, config: CvConfig): Paragraph {
  const primaryHex = cleanHex(config.primaryColor, '0B3D91');
  const fontFamily = config.fontFamily || 'Arial';

  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: {
      bottom: {
        color: primaryHex,
        space: 4,
        style: BorderStyle.SINGLE,
        size: level === 1 ? 8 : 6,
      },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        font: fontFamily,
        size: level === 1 ? 22 : 20, // 11pt or 10pt (half-points)
        color: primaryHex,
      }),
    ],
  });
}

/**
 * Creates a section divider paragraph with bottom border.
 */
export function sectionDivider(config: CvConfig): Paragraph {
  const primaryHex = cleanHex(config.primaryColor, '0B3D91');
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: {
      bottom: {
        color: primaryHex,
        space: 2,
        style: BorderStyle.SINGLE,
        size: 4,
      },
    },
  });
}

/**
 * Creates a single contact line separated by bullets.
 */
export function contactLine(data: CvData, config: CvConfig): Paragraph {
  const { basics } = data;
  const parts: string[] = [];
  if (basics.location) parts.push(basics.location);
  if (basics.phone) parts.push(basics.phone);
  if (basics.email) parts.push(basics.email);
  if (basics.website) parts.push(basics.website);
  if (basics.linkedin) parts.push(basics.linkedin);

  const fontFamily = config.fontFamily || 'Arial';

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 180 },
    children: parts.map(
      (part, idx) =>
        new TextRun({
          text: idx < parts.length - 1 ? `${part}   ·   ` : part,
          font: fontFamily,
          size: 19, // 9.5pt
          color: '4B5563',
        })
    ),
  });
}

/**
 * Fetches an image buffer from a remote URL or local file path safely.
 */
export async function fetchImageBuffer(url?: string | null): Promise<Buffer | null> {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();

  try {
    if (trimmed.startsWith('data:image/')) {
      const match = trimmed.match(/^data:image\/[a-zA-Z+]+;base64,(.+)$/);
      if (match && match[1]) {
        return Buffer.from(match[1], 'base64');
      }
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const response = await fetch(trimmed);
      if (!response.ok) return null;
      const arrayBuf = await response.arrayBuffer();
      return Buffer.from(arrayBuf);
    }

    // Local file path (e.g. /photo-test.jpg or public/photo-test.jpg)
    const normalized = trimmed.startsWith('/') ? '.' + trimmed : trimmed;
    const candidates = [
      path.resolve(process.cwd(), normalized),
      path.resolve(process.cwd(), 'public', trimmed.replace(/^\//, '')),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        return fs.readFileSync(cand);
      }
    }
  } catch {
    // Graceful fallback if image fetch/read fails
  }

  return null;
}

/**
 * Detect image mime format for docx ImageRun ('png' | 'jpg')
 */
export function detectImageType(buf: Buffer): 'png' | 'jpg' {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'png';
  }
  return 'jpg';
}

