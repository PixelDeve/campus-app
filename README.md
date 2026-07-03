# Campus Feed

A mobile-first PWA for a single school's private social feed. React + Tailwind + Firebase (Auth/Firestore) + Cloudflare R2 for images.

## Setup

```bash
npm install
cp .env.example .env      # fill in Firebase + R2 worker values
npm run dev                # local dev server
npm run build               # production build → dist/
```

## Backend pieces you still need to deploy

1. **Firebase project** — enable Email/Password auth, create a Firestore database, deploy `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. **Cloudflare R2 bucket** + the Worker in `server/r2-presign-worker.js` (deploy with `wrangler deploy`, set the four secrets listed at the top of that file, and enable public access or a custom domain on the bucket for `R2_PUBLIC_BASE_URL`).
3. **Seed the invite code** — create a Firestore doc at `config/inviteCode` with field `value: "MY_SCHOOL_2026"` (or set your own). The Admin Panel can change it after that.
4. **First admin** — register a normal account, then manually flip `isAdmin: true` on that user's `users/{uid}` doc in the Firestore console (bootstrapping — after that, admins can promote others from the Admin Panel).

## Project structure

```
src/
  firebase/config.js        Firebase init (Auth + Firestore)
  utils/imageCompression.js Client-side resize/compress before upload
  utils/r2Upload.js          Pre-signed R2 upload flow
  context/AuthContext.jsx    Register/login incl. gmail + invite-code checks
  context/ThemeContext.jsx   Dark/light toggle
  components/Auth/           Login/Register split card
  components/Feed/           Campus Feed, PostCard, CommentSection
  components/Create/         FAB + creation overlay
  components/LostFound/      Lost & Found grid + report form
  components/Admin/          Admin moderation panel
  components/Layout/         TopBar, BottomNav
server/r2-presign-worker.js  Cloudflare Worker: signs R2 upload URLs
firestore.rules              Security rules
```

## Building on Termux (no PC)

`npm install` and `npm run build` both work fine under Termux. For the Worker deploy step (`wrangler deploy`), `wrangler` also runs under Termux via `npm i -g wrangler`, or you can push `server/r2-presign-worker.js` through the Cloudflare dashboard's Worker editor if npm-based deploy gives you trouble on-device.
