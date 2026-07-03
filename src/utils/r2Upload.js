// ─────────────────────────────────────────────────────────────────────────
// CLOUDFLARE R2 UPLOAD (S3-compatible, pre-signed URL flow)
//
// R2 credentials must never live in the client bundle. The flow is:
//   1. Client asks our backend (a Cloudflare Worker or any small server)
//      for a pre-signed PUT URL for a given object key.
//   2. Backend uses the S3 SDK + R2 credentials to sign that URL and
//      returns { uploadUrl, publicUrl }.
//   3. Client PUTs the compressed image bytes directly to `uploadUrl`.
//   4. Client stores `publicUrl` on the Firestore post document.
//
// This file only contains the CLIENT side of that flow. See
// `server/r2-presign-worker.js` for the companion Worker endpoint.
// ─────────────────────────────────────────────────────────────────────────

const PRESIGN_ENDPOINT = import.meta.env.VITE_R2_PRESIGN_ENDPOINT; // e.g. https://api.yourschoolapp.com/presign

/**
 * Requests a pre-signed URL from the backend, then uploads the given
 * (already-compressed) image file directly to Cloudflare R2.
 * @param {File} file - compressed image file
 * @param {string} folder - logical folder, e.g. "posts" or "lostfound"
 * @returns {Promise<string>} the public URL of the uploaded object
 */
export async function uploadToR2(file, folder = 'posts') {
  const objectKey = `${folder}/${crypto.randomUUID()}-${file.name}`;

  // Step 1: fetch a pre-signed PUT URL from our own backend/Worker.
  const presignRes = await fetch(PRESIGN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: objectKey,
      contentType: file.type
    })
  });

  if (!presignRes.ok) {
    throw new Error('Failed to get pre-signed upload URL from server.');
  }

  const { uploadUrl, publicUrl } = await presignRes.json();

  // Step 2: PUT the file bytes straight to R2 using the pre-signed URL.
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });

  if (!putRes.ok) {
    throw new Error('Upload to Cloudflare R2 failed.');
  }

  // Step 3: return the public/CDN URL to be saved on the Firestore doc.
  return publicUrl;
}
