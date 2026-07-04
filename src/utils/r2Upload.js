// ─────────────────────────────────────────────────────────────────────────
// UPLOADCARE UPLOAD (public key — no backend, no secret keys, no card)
// ─────────────────────────────────────────────────────────────────────────

const PUBLIC_KEY = import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY;
const CDN_SUBDOMAIN = import.meta.env.VITE_UPLOADCARE_CDN_SUBDOMAIN; // e.g. "1gnt57ssxg.ucarecd.net"

export async function uploadToR2(file, folder = 'posts') {
  const formData = new FormData();
  formData.append('UPLOADCARE_PUB_KEY', PUBLIC_KEY);
  formData.append('UPLOADCARE_STORE', '1');
  formData.append('file', file);

  const res = await fetch('https://upload.uploadcare.com/base/', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error('Image upload failed. Please try again.');
  }

  const data = await res.json();
  const fileId = data.file;

  // A CDN operation (e.g. -/preview/) is required for Uploadcare to reliably
  // serve the image inline in the browser; 1200x1200 caps the delivered size
  // as a second safety net on top of our client-side compression.
  return `https://${CDN_SUBDOMAIN}/${fileId}/-/preview/1200x1200/`;
}
