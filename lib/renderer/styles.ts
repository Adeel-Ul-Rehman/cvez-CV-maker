import React from 'react';
import type { RenderContext } from './types';

export function getFontFallback(fontFamily?: string): string {
  if (!fontFamily) return 'sans-serif';
  const serifs = ['georgia', 'merriweather', 'garamond', 'times new roman', 'cambria'];
  return serifs.includes(fontFamily.toLowerCase()) ? 'serif' : 'sans-serif';
}

/**
 * Base root wrapper styles for a rendered CV document.
 * Strictly using inline styles and mm/pt units for accurate print & preview fidelity.
 */
export function baseCvStyles(ctx: RenderContext): React.CSSProperties {
  const isLetter = ctx.config.pageSize === 'LETTER';
  const width = isLetter ? '8.5in' : '210mm';
  const minHeight = isLetter ? '11in' : '297mm';
  const spacing = ctx.config.spacingScale || 1.0;
  const fontFam = ctx.config.fontFamily || 'Inter';

  const isLegacy =
    ctx.templateKey === 'europass' ||
    ctx.templateKey === 'jobhire-chronological' ||
    ctx.templateKey === 'jobhire-creative';

  return {
    width,
    minHeight,
    padding: isLegacy ? '20mm' : '0',
    margin: '0 auto',
    boxSizing: 'border-box',
    fontFamily: `'${fontFam}', ${getFontFallback(fontFam)}`,
    fontSize: `${ctx.config.fontSizePt || 10.5}pt`,
    color: '#1f2937',
    lineHeight: (ctx.config as any).lineHeight
      ? (ctx.config as any).lineHeight * spacing
      : 1.45 * spacing,
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
    wordWrap: 'break-word',
  };
}

/**
 * Global CSS reset for Puppeteer print export and browser preview.
 */
export function printResetCss(pageSize: 'A4' | 'LETTER' = 'A4'): string {
  const size = pageSize === 'LETTER' ? 'letter' : 'A4';
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&family=Merriweather:ital,wght@0,400;0,700;1,300&family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap');
    @page {
      size: ${size};
      margin: 0;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: 'Inter', Arial, sans-serif;
    }
    @media print {
      body {
        background: #ffffff;
      }
    }
  `.trim();
}

/**
 * Formats a date string into "Mon YYYY" or preserves raw format if unparseable.
 */
export function formatSingleDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const trimmed = dateStr.trim();
  // Check if matches YYYY-MM or YYYY-MM-DD
  if (/^\d{4}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('-');
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    if (month >= 1 && month <= 12) {
      return `${monthNames[month - 1]} ${year}`;
    }
  }
  return trimmed;
}

/**
 * Formats date range: "Jan 2022 – Present" or "Jan 2020 – Dec 2021"
 */
export function formatDateRange(
  startDate?: string | null,
  endDate?: string | null,
  current?: boolean
): string {
  const start = formatSingleDate(startDate);
  if (current) {
    return start ? `${start} – Present` : 'Present';
  }
  const end = formatSingleDate(endDate);
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return '';
}
