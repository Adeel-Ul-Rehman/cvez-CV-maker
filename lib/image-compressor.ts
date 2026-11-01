/**
 * Image compressor utility for CV photos and account profile avatars.
 * Accepts files up to 600 KB and automatically resizes & compresses them
 * client-side to strictly under 100 KB before upload/saving.
 */

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
}

export const MAX_UPLOAD_INPUT_BYTES = 600 * 1024; // 600 KB
export const TARGET_MAX_OUTPUT_BYTES = 95 * 1024; // Strictly < 100 KB

export async function compressImageTo100KB(rawFile: File): Promise<CompressionResult> {
  const originalSizeKB = Math.round(rawFile.size / 1024);

  // 1. Guard against files over 600 KB
  if (rawFile.size > MAX_UPLOAD_INPUT_BYTES) {
    throw new Error(
      `Photo exceeds the 600 KB limit. Your image is ${originalSizeKB} KB. Please select a photo under 600 KB.`
    );
  }

  // 2. Validate MIME type
  if (!rawFile.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, or WEBP).');
  }

  // 3. Load image into canvas for high-quality downscaling
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Standard crisp dimensions for CV photos (400px provides 2x-3x retina clarity)
          const MAX_DIM = 400;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Could not initialize image processing canvas.');
          }

          // Enable high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Iteratively find compression quality that fits under 95 KB
          let quality = 0.85;
          let blob: Blob | null = null;

          while (quality >= 0.4) {
            blob = await new Promise<Blob | null>((res) =>
              canvas.toBlob((b) => res(b), 'image/jpeg', quality)
            );

            if (blob && blob.size <= TARGET_MAX_OUTPUT_BYTES) {
              break;
            }
            quality -= 0.1;
          }

          if (!blob) {
            throw new Error('Image compression failed.');
          }

          const compressedSizeKB = Math.round(blob.size / 1024);
          const cleanName = rawFile.name.replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], cleanName, { type: 'image/jpeg' });

          // Also generate dataURL for instant local preview
          const dataUrl = canvas.toDataURL('image/jpeg', quality);

          resolve({
            file: compressedFile,
            dataUrl,
            originalSizeKB,
            compressedSizeKB,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for processing.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Could not read image file.'));
    };

    reader.readAsDataURL(rawFile);
  });
}

