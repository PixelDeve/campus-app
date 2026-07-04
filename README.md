# Campus Feed

A mobile-first PWA for a single school's private social feed. React + Vite + Tailwind + Firebase (Auth/Firestore) + Uploadcare for images.

## Setup

```bash
npm install
cp .env.example .env      # fill in Firebase + Uploadcare values
npm run dev                # local dev server
npm run build               # production build → dist/
```

## Backend pieces to set up

1. **Firebase project** — enable Email/Password auth, create a Firestore database.
2. **Firestore rules** — paste the contents of `firestore.rules` into Firebase Console → Firestore Database → Rules → Publish.
3. **Uploadcare account** (free, no card) — get your **Public Key** and **CDN subdomain** (Delivery settings in the Uploadcare dashboard) and set them as `VITE_UPLOADCARE_PUBLIC_KEY` / `VITE_UPLOADCARE_CDN_SUBDOMAIN`.
4. **Seed the invite code** — Firestore → create collection `config` → document `inviteCode` → field `value` (string) = your code, e.g. `MY_SCHOOL_2026`.
5. **Bootstrap your first admin** — register a normal account, then manually set `isAdmin: true` on that user's `users/{uid}` doc in the Firestore console.

## Hosting (Cloudflare Pages)

- Build command: `npm run build`
- Output directory: `dist`
- Set all `VITE_*` env vars in the Pages project's Settings → Environment variables
- Use the plain project URL (`your-project.pages.dev`), not a per-deployment hash-prefixed URL — the latter is frozen to whatever was live at that specific deploy and never updates.

## Features

- **Auth**: Gmail-only registration gated by a rotatable School Invite Code (stored in Firestore, editable from the Admin Panel)
- **Campus Feed**: posts with text/image, like, expandable comments, edit/delete your own posts
- **Lost & Found**: image grid with location/date filters
- **Friends**: Discover students, send/accept/decline friend requests, remove friends
- **Events**: students propose events; only visible campus-wide after an admin approves them from the Admin Panel
- **Private Chat**: 1:1 messaging, restricted to friends, with a conversations list and live message threads
- **Profile editing**: name, bio, avatar photo (uploaded via Uploadcare)
- **Admin Panel**: user stats, flagged-content moderation, pending event approval queue, user admin/ban toggles, invite code rotation

## Project structure

```
src/
  firebase/config.js          Firebase init (Auth + Firestore)
  utils/imageCompression.js   Client-side resize/compress before upload
  utils/r2Upload.js            Uploadcare upload (name kept for compatibility)
  context/AuthContext.jsx      Register/login + live-synced profile doc
  context/ThemeContext.jsx     Dark/light toggle
  components/Auth/             Login/Register split card
  components/Feed/              Campus Feed, PostCard (edit/delete/like), CommentSection
  components/Create/            FAB + creation overlay
  components/LostFound/         Lost & Found grid + report form
  components/Friends/           Discover / Requests / Friends list
  components/Events/            Upcoming events, propose-event form, my submissions
  components/Chat/              Conversations list + message thread
  components/Profile/           Edit profile modal (name, bio, avatar)
  components/Admin/             Admin moderation panel incl. event approval
  components/Layout/            TopBar, BottomNav
firestore.rules                 Security rules for every collection above
```

## Data model quick reference

| Collection | Key fields | Notes |
|---|---|---|
| `users/{uid}` | name, bio, avatarUrl, isAdmin, isBanned | |
| `posts/{id}` | authorId, text, imageUrl, likedBy[], flagged | + `comments` subcollection |
| `lostFound/{id}` | authorId, description, location, imageUrl | |
| `friendRequests/{id}` | fromId, toId, status | deleted on accept/decline |
| `friendships/{uidA_uidB}` | users: [uidA, uidB] | doc id = sorted uids joined with `_` |
| `events/{id}` | createdBy, status ('pending'/'approved'/'rejected'), startTime | |
| `chats/{uidA_uidB}` | participants: [uidA, uidB], lastMessage | + `messages` subcollection |
| `config/inviteCode` | value | publicly readable, admin-only write |

## Building on Termux (no PC)

`npm install` and `npm run build` work fine under Termux. If deploying via Cloudflare Pages' Git integration, make sure commits go **directly to `main`** (not a feature branch/PR) or auto-deploy won't pick them up.
