import { Readable } from 'node:stream';
import { cloudinary, isCloudinaryConfigured } from '../../config/cloudinary.js';
import { env } from '../../config/env.js';
import { BusinessRuleError } from '../errors/AppError.js';

const assertConfigured = () => {
  if (!isCloudinaryConfigured) {
    throw new BusinessRuleError(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET in .env'
    );
  }
};

/**
 * Stream a buffer to Cloudinary (nothing is written to disk).
 * @param {Buffer} buffer
 * @param {object} opts { folder, publicId, resourceType, overwrite }
 */
export const uploadBuffer = (buffer, { folder = '', publicId, resourceType = 'auto', overwrite = false } = {}) => {
  assertConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: publicId ? undefined : [env.CLOUDINARY_BASE_FOLDER, folder].filter(Boolean).join('/'),
        public_id: publicId,
        resource_type: resourceType,
        overwrite,
        invalidate: overwrite,
        use_filename: true,
        unique_filename: !publicId,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    Readable.from(buffer).pipe(stream);
  });
};

export const destroyAsset = async (publicId, resourceType = 'image') => {
  assertConfigured();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
};

export const cloudinaryPing = async () => {
  if (!isCloudinaryConfigured) return null; // not configured
  try {
    const res = await cloudinary.api.ping();
    return res.status === 'ok';
  } catch {
    return false;
  }
};
