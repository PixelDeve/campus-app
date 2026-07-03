// ─────────────────────────────────────────────────────────────────────────
// CLIENT-SIDE IMAGE COMPRESSION
// Runs before any upload to Cloudflare R2. Resizes to a max width of 1200px
// and re-encodes as JPEG at 70% quality to keep storage/bandwidth in check.
// Returns a File object so it can be handed straight to the R2 upload step.
// ─────────────────────────────────────────────────────────────────────────

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.7;

/**
 * Compress an image File in the browser using a canvas.
 * @param {File} file - the original image file selected by the user
 * @returns {Promise<File>} a new, compressed JPEG File
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, MAX_WIDTH / img.width);
      const targetWidth = Math.round(img.width * scale);
      const targetHeight = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed.'));
            return;
          }
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.\w+$/, '.jpg'),
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          resolve(compressedFile);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image for compression.'));
    };

    img.src = objectUrl;
  });
}

/** Quick helper to build a local preview URL for the compressed/original file. */
export function getPreviewUrl(file) {
  return URL.createObjectURL(file);
}
