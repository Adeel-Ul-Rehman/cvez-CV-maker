'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, X, Download, Share2, ZoomIn, ZoomOut, ChevronUp, ChevronDown } from 'lucide-react';
import { CvPreviewFrame } from '@/components/features/cv/cv-preview-frame';

interface MobilePreviewDrawerProps {
  cvId: string;
  title: string;
  previewTimestamp: number;
  onDownloadPdf?: () => void;
  onShare?: () => void;
  isDownloading?: boolean;
}

export function MobilePreviewDrawer({
  cvId,
  title,
  previewTimestamp,
  onDownloadPdf,
  onShare,
  isDownloading = false,
}: MobilePreviewDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(0.48);
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  // Auto adjust initial scale to fit mobile screen width
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      // Standard A4 width is 794px. We leave ~24px padding.
      const optimalScale = Math.min(0.65, Math.max(0.38, (screenWidth - 24) / 794));
      setScale(Number(optimalScale.toFixed(2)));
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchEndY - touchStartY.current;

    // Swiped down significantly -> close
    if (diff > 80 && isOpen) {
      setIsOpen(false);
    }
    // Swiped up -> open
    if (diff < -40 && !isOpen) {
      setIsOpen(true);
    }
    touchStartY.current = null;
  };

  return (
    <div className="sm:hidden">
      {/* Floating Bottom Bar (Collapsed State) */}
      {!isOpen && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-2.5 px-4 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200"
        >
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center shrink-0">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <span>Live Preview</span>
                <ChevronUp className="h-3 w-3 text-slate-400" />
              </p>
              <p className="text-[10px] text-slate-500">Tap or swipe up to check layout</p>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            {onDownloadPdf && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDownloadPdf}
                loading={isDownloading}
                className="h-8 px-2.5 text-xs text-primary-600 border-primary-200 dark:border-primary-900"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                PDF
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsOpen(true)}
              className="h-8 px-3 text-xs"
            >
              View Full
            </Button>
          </div>
        </div>
      )}

      {/* Expanded Bottom Sheet Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={sheetRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="fixed inset-x-0 bottom-0 z-50 h-[88vh] rounded-t-3xl bg-slate-950 text-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
          >
            {/* Sheet Handle & Header */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
              {/* Drag Handle Pill */}
              <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-2" />

              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">{title}</h3>
                  <p className="text-[10px] text-slate-400">Swipe down or tap close</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Zoom Controls */}
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.max(0.35, Number((s - 0.05).toFixed(2))))}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 w-8 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.min(0.9, Number((s + 0.05).toFixed(2))))}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>

                  {onDownloadPdf && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onDownloadPdf}
                      loading={isDownloading}
                      className="h-7 px-2 text-[11px] text-white border-slate-700 bg-slate-800"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}

                  {onShare && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onShare}
                      className="h-7 px-2 text-[11px] text-white border-slate-700 bg-slate-800"
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center ml-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Document Viewport */}
            <div className="flex-1 overflow-auto bg-slate-900/60 p-3 flex justify-center items-start">
              <div
                style={{
                  width: `${794 * scale}px`,
                  minHeight: `${1123 * scale}px`,
                  transition: 'width 0.15s ease-out',
                }}
                className="bg-white rounded-lg shadow-2xl overflow-hidden shrink-0"
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: '794px',
                    height: '1123px',
                  }}
                >
                  <CvPreviewFrame
                    cvId={cvId}
                    title={title}
                    className="w-[794px] h-[1123px] border-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

