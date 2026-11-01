import { apiClient } from '@/lib/api-client';

export interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
  cvId?: string;
}

/**
 * Attempts native device sharing via Web Share API (WhatsApp, Messages, AirDrop, etc.).
 * Falls back to returning false so caller can open fallback modal or copy link.
 */
export async function shareViaNativeSheet(options: ShareOptions): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: options.title,
      text: options.text || `View my resume: ${options.title}`,
      url: options.url || window.location.href,
    });
    return true;
  } catch (err: any) {
    // User cancelled share dialog
    if (err.name === 'AbortError') return true;
    return false;
  }
}

/**
 * Downloads the PDF blob and shares the actual PDF file via mobile share sheet
 * (directly into WhatsApp chat, Slack, Mail, or Files).
 */
export async function sharePdfFileViaNativeSheet(
  cvId: string,
  cvTitle: string
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }

  try {
    const res = await fetch(`/api/cv/${cvId}/export/pdf`, {
      method: 'GET',
    });

    if (!res.ok) return false;

    const blob = await res.blob();
    const sanitizedTitle = (cvTitle || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
    const file = new File([blob], `${sanitizedTitle}.pdf`, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `${cvTitle}.pdf`,
        files: [file],
      });
      return true;
    } else {
      // Share URL fallback
      await navigator.share({
        title: `${cvTitle} - PDF`,
        text: `Resume for ${cvTitle}`,
        url: window.location.href,
      });
      return true;
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return true;
    return false;
  }
}

