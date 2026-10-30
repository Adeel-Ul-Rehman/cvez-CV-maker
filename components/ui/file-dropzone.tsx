'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toastError } from './toast';

export interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  currentImageUrl?: string | null;
  maxSizeKB?: number;
  maxSizeMB?: number;
  className?: string;
}

async function optimizeAvatar(file: File, maxKB: number): Promise<File> {
  if (file.size <= maxKB * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400; // Perfect crisp dimensions for avatar circles
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimized = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                  { type: 'image/jpeg' }
                );
                resolve(optimized);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.82
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function FileDropzone({
  onFileSelect,
  currentImageUrl,
  maxSizeKB = 100,
  maxSizeMB,
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveMaxKB = maxSizeKB || (maxSizeMB ? maxSizeMB * 1024 : 100);

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

    // Auto-optimize/compress avatar image to under effectiveMaxKB
    const file = await optimizeAvatar(rawFile, effectiveMaxKB);

    if (file.size > effectiveMaxKB * 1024) {
      toastError('File too large', `Image must be smaller than ${effectiveMaxKB}KB.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onFileSelect(file);
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
            Click to upload <span className="font-normal text-slate-500">or drag & drop</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PNG, JPG, or WEBP (max {maxSizeMB}MB)</p>
        </div>
      )}
    </div>
  );
}
