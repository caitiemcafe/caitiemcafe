import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET });

export async function uploadImage(buffer: Buffer) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new ApiError(503, 'Cloudinary chưa được cấu hình.');
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'cai-tiem-cafe', resource_type: 'image', transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] }, (error, result) => {
      if (error || !result) reject(new ApiError(502, 'Không thể tải ảnh lên Cloudinary.'));
      else resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}
