'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toastError, toastSuccess } from './toast';
import { compressImageTo100KB } from '@/lib/image-compressor';

export interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  currentImageUrl?: string | null;
  maxSizeKB?: number;
  maxSizeMB?: number;
  className?: string;
}

export function FileDropzone({
  onFileSelect,
  currentImageUrl,
  maxSizeKB = 600,
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (currentImageUrl) {
      setPreviewUrl(currentImageUrl);
    }
  }, [currentImageUrl]);

  const handleFile = async (rawFile: File) => {
    if (!rawFile.type.startsWith('image/')) {
      toastError('Invalid file type', 'Please upload a PNG, JPG, or WEBP image.');
      return;
    }

    if (rawFile.size > maxSizeKB * 1024) {
      toastError(
        'File too large',
        `Maximum upload size is ${maxSizeKB} KB. Your file is ${Math.round(rawFile.size / 1024)} KB.`
      );
      return;
    }

    try {
      setIsCompressing(true);
      // Auto-compress and resize image to strictly under 100 KB
      const { file: compressedFile, dataUrl, originalSizeKB, compressedSizeKB } =
        await compressImageTo100KB(rawFile);

      setPreviewUrl(dataUrl);
      onFileSelect(compressedFile);

      if (originalSizeKB > 95) {
        toastSuccess(
          'Image optimized',
          `Compressed from ${originalSizeKB} KB to ${compressedSizeKB} KB (< 100 KB)`
        );
      }
    } catch (err: any) {
      toastError('Image processing failed', err.message || 'Could not compress image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-150',
        isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
          : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40',
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Preview"
            className="h-28 w-28 rounded-full object-cover border-2 border-primary-500 shadow-md"
          />
          <button
            type="button"
            onClick={clearImage}
            aria-label="Remove image"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow hover:bg-rose-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {isCompressing ? 'Optimizing photo...' : 'Click to upload or drag & drop'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            PNG, JPG up to {maxSizeKB} KB (auto-compressed to &lt; 100 KB)
          </p>
        </div>
      )}
    </div>
  );
}
