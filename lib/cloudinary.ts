import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { badRequest } from './errors';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const ALLOWED_FOLDERS = {
  AVATARS: 'cv-maker/avatars',
  TEMPLATE_THUMBS: 'cv-maker/template-thumbnails',
  CV_PHOTOS: 'cv-maker/cv-photos',
} as const;

export type AllowedFolder = (typeof ALLOWED_FOLDERS)[keyof typeof ALLOWED_FOLDERS];

export const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface UploadBufferOptions {
  folder: string;
  publicId?: string;
  resourceType?: 'image' | 'raw';
  format?: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

/**
 * Uploads a buffer to Cloudinary using upload_stream.
 * Validates folder and file size.
 */
export async function uploadBuffer(
  buffer: Buffer,
  options: UploadBufferOptions
): Promise<UploadResult> {
  const allowedFolderList = Object.values(ALLOWED_FOLDERS) as string[];
  if (!allowedFolderList.includes(options.folder)) {
    throw badRequest('Invalid upload folder', 'INVALID_FOLDER');
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw badRequest('File size exceeds 2 MB limit', 'INVALID_FILE_SIZE');
  }

  return new Promise<UploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: options.resourceType || 'image',
        format: options.format,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload to Cloudinary failed'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Deletes an asset from Cloudinary by its public ID.
 */
export async function deleteAsset(
  publicId: string,
  resourceType: 'image' | 'raw' = 'image'
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (err) {
    console.warn(`Warning: failed to delete Cloudinary asset ${publicId}:`, err);
  }
}

export { cloudinary };
