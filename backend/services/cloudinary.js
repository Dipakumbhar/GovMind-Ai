const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function cloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return null;
  }
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'govmind/complaints',
  };
}

function sniffImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

function providerFailureReason(status, providerMessage) {
  const message = String(providerMessage || '').toLowerCase();
  if (status === 401 && /(api.?secret|secret).{0,24}(mismatch|incorrect|invalid)|(mismatch|incorrect|invalid).{0,24}(api.?secret|secret)/.test(message)) {
    return 'api_secret_mismatch';
  }
  if (status === 401 && /(api.?key|key).{0,24}(mismatch|incorrect|invalid)|(mismatch|incorrect|invalid).{0,24}(api.?key|key)/.test(message)) {
    return 'api_key_mismatch';
  }
  if (status === 401 && /signature/.test(message)) return 'signature_rejected';
  if (status === 401 && /(api.?key|api.?secret|credential|authentication)/.test(message)) return 'credentials_rejected';
  if (status === 401) return 'authentication_rejected';
  if (status === 403) return 'account_or_upload_permission_rejected';
  return 'provider_rejected';
}

async function uploadImage({ buffer, contentType, filename, requestId }) {
  const config = cloudinaryConfig();
  if (!config) {
    const error = new Error('Cloudinary image storage is not configured');
    error.status = 503;
    error.code = 'IMAGE_STORAGE_NOT_CONFIGURED';
    throw error;
  }
  if (!ALLOWED_IMAGE_TYPES.has(contentType) || sniffImageType(buffer) !== contentType) {
    const error = new Error('Upload a valid JPG, PNG, or WebP image');
    error.status = 400;
    error.code = 'INVALID_IMAGE';
    throw error;
  }
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    const error = new Error('Each image must be 5 MB or smaller');
    error.status = 400;
    error.code = 'IMAGE_TOO_LARGE';
    throw error;
  }

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: contentType }), filename || 'complaint-image');
  form.append('folder', config.folder);

  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`,
      },
      body: form,
    });
  } catch {
    console.warn('Cloudinary upload could not reach the provider', {
      event: 'cloudinary_upload_network_error',
      requestId: requestId || null,
      contentType,
      bytes: buffer.length,
    });
    const error = new Error('Image storage is temporarily unavailable');
    error.status = 502;
    error.code = 'IMAGE_STORAGE_UNAVAILABLE';
    throw error;
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url || !result.public_id) {
    const reason = providerFailureReason(response.status, result.error?.message);
    console.error('Cloudinary upload rejected the image', {
      event: 'cloudinary_upload_rejected',
      requestId: requestId || null,
      status: response.status,
      providerCode: typeof result.error?.code === 'string' || typeof result.error?.code === 'number'
        ? String(result.error.code).slice(0, 40)
        : null,
      reason,
      contentType,
      bytes: buffer.length,
    });
    const error = new Error(reason === 'api_secret_mismatch' || reason === 'api_key_mismatch'
      ? 'Image storage credentials are not accepted by the connected service'
      : 'Image upload failed. Please try again.');
    error.status = 502;
    error.code = reason === 'api_secret_mismatch' || reason === 'api_key_mismatch'
      ? 'IMAGE_STORAGE_CREDENTIALS_REJECTED'
      : 'IMAGE_STORAGE_PROVIDER_REJECTED';
    throw error;
  }

  return {
    name: filename || result.original_filename || 'complaint-image',
    size: String(buffer.length),
    type: contentType,
    url: result.secure_url,
    publicId: result.public_id,
  };
}

module.exports = { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, cloudinaryConfig, providerFailureReason, uploadImage };
