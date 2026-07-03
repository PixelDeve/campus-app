// ─────────────────────────────────────────────────────────────────────────
// CLOUDFLARE WORKER: R2 PRE-SIGN ENDPOINT
// Deploy with `wrangler deploy`. Holds the real R2 credentials as Worker
// secrets — these never reach the browser. Called by src/utils/r2Upload.js.
//
// Required secrets (set via `wrangler secret put <NAME>`):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
// ─────────────────────────────────────────────────────────────────────────
import { AwsClient } from 'aws4fetch';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { key, contentType } = await request.json();
    if (!key || !contentType) {
      return new Response('Missing key or contentType', { status: 400 });
    }

    // R2's S3-compatible endpoint for this account.
    const endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

    const s3 = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      service: 's3',
      region: 'auto'
    });

    const objectUrl = `${endpoint}/${env.R2_BUCKET}/${key}`;

    // Sign a PUT request, valid for 5 minutes, without executing it yet.
    const signedRequest = await s3.sign(objectUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      aws: { signQuery: true, expires: 300 }
    });

    return new Response(
      JSON.stringify({
        uploadUrl: signedRequest.url,
        publicUrl: `${env.R2_PUBLIC_BASE_URL}/${key}`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
};
