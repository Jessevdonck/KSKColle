import { v2 as cloudinary } from 'cloudinary';
import config from 'config';

// Configure Cloudinary using URL or individual credentials
const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (cloudinaryUrl) {
  // Parse the Cloudinary URL manually
  const urlParts = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (urlParts && urlParts.length >= 4) {
    const [, apiKey, apiSecret, cloudName] = urlParts;
    cloudinary.config({
      cloud_name: cloudName!,
      api_key: apiKey!,
      api_secret: apiSecret!,
    });
  } else {
    throw new Error('Invalid CLOUDINARY_URL format');
  }
} else {
  cloudinary.config({
    cloud_name: config.get<string>('cloudinary.cloudName'),
    api_key: config.get<string>('cloudinary.apiKey'),
    api_secret: config.get<string>('cloudinary.apiSecret'),
  });
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}

export async function uploadAvatar(
  fileBuffer: Buffer,
  userId: number,
  originalName: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'kskcolle/avatars',
        public_id: `avatar_${userId}_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload image to Cloudinary'));
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error('No result from Cloudinary upload'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function deleteAvatar(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error('Cloudinary delete error:', error);
        reject(new Error('Failed to delete image from Cloudinary'));
      } else {
        console.log('Cloudinary delete result:', result);
        resolve();
      }
    });
  });
}

export function getPublicIdFromUrl(url: string): string | null {
  // Extract public_id from Cloudinary URL
  // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/kskcolle/avatars/avatar_123_4567890.jpg
  const match = url.match(/\/kskcolle\/avatars\/([^\/]+)\./);
  return match ? `kskcolle/avatars/${match[1]}` : null;
}
