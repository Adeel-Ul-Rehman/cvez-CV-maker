'use client';

import React, { useRef, useState, useEffect } from 'react';

interface CvPreviewFrameProps {
  cvId: string;
  title?: string;
  className?: string;
  timestamp?: number;
}

export function CvPreviewFrame({
  cvId,
  title = 'CV preview',
  className = '',
  timestamp,
}: CvPreviewFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.35);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const containerWidth = el.clientWidth;
      if (containerWidth > 0) {
        // Standard A4 pixel width is 794px
        setScale(containerWidth / 794);
      }
    };

    updateScale();

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const src = timestamp
    ? `/api/cv/${cvId}/preview?embed=1&t=${timestamp}`
    : `/api/cv/${cvId}/preview?embed=1`;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-white select-none ${className}`}
    >
      <iframe
        src={src}
        title={title}
        tabIndex={-1}
        scrolling="no"
        className="border-none pointer-events-none select-none absolute top-0 left-0"
        style={{
          width: '794px',
          height: '1123px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}
