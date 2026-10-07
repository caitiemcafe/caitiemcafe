import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET });

export async function uploadImage(buffer: Buffer, originalname?: string) {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'cai-tiem-cafe', resource_type: 'image', transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] }, (error, result) => {
        if (error || !result) reject(new ApiError(502, 'Không thể tải ảnh lên Cloudinary.'));
        else resolve(result.secure_url);
      });
      stream.end(buffer);
    });
  }

  try {
    const ext = originalname ? path.extname(originalname) : '.webp';
    const filename = `upload_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext || '.webp'}`;
    const frontendUploadDir = path.resolve(process.cwd(), '../frontend/public/uploads');
    if (!fs.existsSync(frontendUploadDir)) {
      fs.mkdirSync(frontendUploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(frontendUploadDir, filename), buffer);

    const backendUploadDir = path.resolve(process.cwd(), 'public/uploads');
    if (!fs.existsSync(backendUploadDir)) {
      fs.mkdirSync(backendUploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(backendUploadDir, filename), buffer);

    return `/uploads/${filename}`;
  } catch (err) {
    console.error('[upload] Lưu ảnh local thất bại:', err);
    throw new ApiError(500, 'Không thể lưu ảnh.');
  }
}

