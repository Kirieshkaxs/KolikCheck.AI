import sharp from 'sharp';

const MAX_PIXELS = 25_000_000;
const signatures = [
  ['jpeg', b => b[0] === 255 && b[1] === 216 && b[2] === 255],
  ['png', b => b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))],
  ['webp', b => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'],
];

export async function preparePhotos(files) {
  const photos = [];
  for (const { buffer } of files) {
    const format = signatures.find(([, matches]) => matches(buffer))?.[0];
    if (!format) throw Object.assign(new Error('invalid_image'), { status: 415, code: 'invalid_image' });
    try {
      const image = sharp(buffer, { limitInputPixels: MAX_PIXELS, failOn: 'warning', animated: true });
      const metadata = await image.metadata();
      if (metadata.format !== format || (metadata.pages ?? 1) > 1) throw new Error('Invalid photo format');
      // Decode before sending, honor EXIF orientation and discard metadata.
      const normalized = await image.autoOrient().resize({
        width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true, fastShrinkOnLoad: false,
      }).flatten({ background: '#fff' }).jpeg({ quality: 86 }).toBuffer();
      photos.push({ mimetype: 'image/jpeg', buffer: normalized });
    } catch {
      throw Object.assign(new Error('invalid_image'), { status: 422, code: 'invalid_image' });
    }
  }
  return photos;
}

export function providerStatus(error) {
  const status = Number(error?.status);
  const details = String(error?.message ?? '');
  if (status === 401 || status === 403 || /API_KEY_INVALID|API key not valid|UNAUTHENTICATED/i.test(details)) return 'auth_error';
  if (status === 429 || /RESOURCE_EXHAUSTED/i.test(details)) return 'quota_exceeded';
  if ([408, 504].includes(status) || ['TimeoutError', 'AbortError'].includes(error?.name) ||
      /deadline exceeded|timed? ?out|ETIMEDOUT/i.test(details)) return 'timeout';
  if (status === 404) return 'model_unavailable';
  if (error instanceof SyntaxError || error?.code === 'invalid_response') return 'invalid_response';
  return 'provider_unavailable';
}
