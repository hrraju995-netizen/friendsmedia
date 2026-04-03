# Friends Media App Deployment Guide

Clean production plan for a private media-sharing app using **Next.js + Vercel + Supabase + Google Drive**.

Save this file as **UTF-8**.

## 1) Final Stack Decision

Use one clear stack so the project does not become inconsistent later:

- **App framework:** Next.js (App Router)
- **Hosting:** Vercel
- **Database:** Supabase Postgres
- **ORM:** Prisma
- **Authentication:** Auth.js
- **Media storage:** Google Drive
- **Styling:** Tailwind CSS

## 2) Important Decisions

This guide intentionally makes these decisions:

- Use **Auth.js only** for app authentication.
- Do **not** mix Auth.js and Firebase Auth in the same MVP.
- Use **one dedicated Google account** as the app storage account.
- All uploaded files go into that account's Google Drive root folder.
- Users do not connect their own Drive accounts.
- Media metadata stays in Postgres, but actual files stay in Google Drive.
- Keep uploaded media **private by default**.

## 3) Recommended Storage Model

For this app, the simplest production-friendly Google Drive model is:

1. Create one dedicated Google account for app storage.
2. Manually create a root folder in that Drive.
3. Connect that Google account once through OAuth.
4. Store the refresh token securely on the server side.
5. Use that token for all future Drive uploads and reads.

Why this is better for MVP:

- Easier than connecting every user's Drive
- Easier permission model
- Easier folder management
- Easier backup and support

## 4) High-Level Architecture

```txt
Users
  |
  v
Next.js App (Vercel)
  |
  +--> Auth.js
  |
  +--> Route Handlers / Server Actions
          |
          +--> Supabase Postgres
          |      - users
          |      - groups
          |      - memberships
          |      - media metadata
          |      - audit fields
          |
          +--> Google Drive API
                 - images
                 - videos
                 - thumbnails
```

## 5) Data Ownership Rule

- **Google Drive** stores the real file bytes.
- **Postgres** stores metadata such as:
  - uploader
  - group
  - Drive file ID
  - file name
  - mime type
  - size
  - access status
  - timestamps

Do not treat Google Drive `webViewLink` as your main security layer. For a private app, the app should decide who can access a file.

## 6) Recommended User Flow

### Login

- User signs in with Auth.js
- Session is created
- Protected pages and upload routes require an authenticated session

### Upload

1. User selects image or video
2. App validates auth, file size, mime type, and membership
3. Server picks the correct Drive folder
4. File uploads to Google Drive
5. Drive file metadata is returned
6. App writes a media row to Postgres
7. UI updates gallery

### View Media

1. User opens a gallery page
2. App queries Postgres for allowed media
3. User clicks a media item
4. App serves the file through a protected read flow or a controlled file URL

## 7) Private Media Access Strategy

For a private friends app, prefer this order:

### Recommended

- Store `driveFileId` in the database
- Create a protected server route such as `GET /api/media/[id]/stream`
- Check session and group membership there
- Fetch the file from Drive on the server side
- Stream it back to the client

### Acceptable for non-sensitive MVP

- Store a Drive link only for preview convenience
- Use restricted sharing carefully

### Avoid

- Making every uploaded file public
- Relying only on a public Drive URL for access control

## 8) Services You Need

### GitHub

- Store the codebase
- Connect the repository to Vercel

### Vercel

- Deploy the Next.js app
- Store environment variables

### Supabase

- Host PostgreSQL
- Use it for production data

### Google Cloud

- Enable Google Drive API
- Create OAuth credentials for the storage account connection

## 9) Environment Variables

Example `.env.example`:

```env
# App
APP_NAME="Friends Media App"
NODE_ENV=production

# Auth.js
AUTH_SECRET=replace_with_a_long_random_secret
AUTH_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://pooled-connection
DIRECT_URL=postgresql://direct-connection

# Google Drive OAuth
GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret
GOOGLE_DRIVE_REDIRECT_URI=https://your-domain.com/api/google/callback
GOOGLE_DRIVE_ROOT_FOLDER_ID=your_drive_root_folder_id

# Optional if you store the refresh token in env instead of DB
GOOGLE_DRIVE_REFRESH_TOKEN=
```

Notes:

- `DATABASE_URL` should be the pooled connection string for Prisma Client.
- `DIRECT_URL` should be the direct connection string for migrations.
- If your existing codebase already uses `NEXTAUTH_SECRET`, keep it consistent there instead of mixing names.
- Do not expose any Google secret to the client.

## 10) Supabase Setup

### Step 1

- Create a Supabase project
- Set a strong database password

### Step 2

- Open database settings
- Copy both pooled and direct connection strings

### Step 3

Set:

```env
DATABASE_URL=postgresql://...pooler...?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...direct-host...:5432/postgres?sslmode=require
```

### Step 4

Use Prisma datasource:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 11) Vercel Setup

### Step 1

- Create a Vercel account
- Connect GitHub
- Import the repository

### Step 2

Add environment variables:

- `AUTH_SECRET`
- `AUTH_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REDIRECT_URI`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `GOOGLE_DRIVE_REFRESH_TOKEN` if used

### Step 3

Set the project to build with Next.js.

### Step 4

Deploy.

## 12) Google Cloud Setup

### Step 1: Create project

- Open Google Cloud Console
- Create a new project

### Step 2: Enable API

- Enable **Google Drive API**

### Step 3: Configure OAuth consent screen

- Choose External
- Set app name and support email
- Add yourself as a test user during setup

### Step 4: Create OAuth credentials

- Create **OAuth Client ID**
- Application type: **Web application**

### Step 5: Add redirect URIs

Local:

```txt
http://localhost:3000/api/google/callback
```

Production:

```txt
https://your-domain.com/api/google/callback
```

### Step 6: Connect the storage account

- Sign in with the dedicated Google storage account
- Request offline access
- Save the refresh token securely

Important:

- The app needs **offline access** so it can upload even when the Google user is not actively present.
- Do not use a personal daily-use Google account for app storage.

## 13) Drive Folder Structure

Recommended:

```txt
FriendsMediaApp/
  groups/
    group-<groupId>/
      images/
      videos/
      thumbnails/
```

Benefits:

- Easy cleanup by group
- Easy file isolation
- Easy future automation

## 14) Core Database Tables

You need two categories of tables:

### Auth tables

If using Auth.js with Prisma adapter, include the standard auth tables:

- `User`
- `Account`
- `Session`
- `VerificationToken`

### App tables

- `Group`
- `GroupMember`
- `Media`

### Recommended `Media` columns

- `id`
- `uploaderId`
- `groupId`
- `driveFileId`
- `fileName`
- `mimeType`
- `size`
- `mediaType`
- `status`
- `thumbnailDriveFileId`
- `checksum`
- `createdAt`
- `updatedAt`
- `deletedAt`

## 15) Minimal Domain Schema Example

This is the app-specific part only. Add the standard Auth.js Prisma models separately.

```prisma
model Group {
  id         String        @id @default(cuid())
  name       String
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  media      Media[]
  members    GroupMember[]
}

model GroupMember {
  id         String   @id @default(cuid())
  groupId    String
  userId     String
  role       String   @default("member")
  createdAt  DateTime @default(now())

  group      Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

model Media {
  id                  String    @id @default(cuid())
  uploaderId          String
  groupId             String
  driveFileId         String    @unique
  thumbnailDriveFileId String?
  fileName            String
  mimeType            String
  size                Int
  mediaType           String
  status              String    @default("ready")
  checksum            String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  uploader            User      @relation(fields: [uploaderId], references: [id], onDelete: Cascade)
  group               Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@index([groupId, createdAt])
  @@index([uploaderId, createdAt])
}
```

## 16) Required Routes

### Auth.js

- `/api/auth/[...nextauth]`

### Google Drive connection

- `GET /api/google/connect`
- `GET /api/google/callback`

### Media

- `POST /api/upload`
- `GET /api/media`
- `GET /api/media/[id]`
- `GET /api/media/[id]/stream`
- `DELETE /api/media/[id]`

### Groups

- `POST /api/groups`
- `GET /api/groups/[id]/media`
- `POST /api/groups/[id]/invite`

### Current user

- `GET /api/me`

If you use Auth.js properly, you usually do not need separate custom routes like `/api/auth/login` and `/api/auth/logout`.

## 17) Recommended Folder Structure

```txt
src/
  app/
    (auth)/
      login/
    gallery/
    upload/
    api/
      auth/
      google/
      upload/
      media/
      groups/
  components/
    gallery/
    upload/
    ui/
  lib/
    auth.ts
    prisma.ts
    drive.ts
    drive-auth.ts
    validations.ts
  server/
    services/
    repositories/
  types/
  config/
```

## 18) Core Functions

### Auth

- `getCurrentUser()`
- `requireAuth()`
- `requireGroupMember(groupId)`

### Google Drive

- `getDriveClient()`
- `findOrCreateFolder(name, parentId?)`
- `uploadSmallFile(input)`
- `createResumableUploadSession(input)`
- `deleteDriveFile(fileId)`
- `getDriveFileMetadata(fileId)`
- `streamDriveFile(fileId)`

### Media

- `saveMediaRecord(data)`
- `listGroupMedia(groupId)`
- `getMediaById(id)`
- `softDeleteMedia(id)`

### Validation

- `validateImage(file)`
- `validateVideo(file)`
- `assertAllowedMimeType(mimeType)`
- `assertMagicBytes(buffer)`

## 19) Upload Strategy

### MVP upload policy

- **Images:** allow up to `10 MB`
- **Videos:** start with `50 MB`
- Route runtime: `nodejs`

### Why not start with 200 MB?

Because Vercel request handling and server execution time can become painful for large uploads in an MVP. Start smaller, then add resumable upload later.

### Recommended phases

#### Phase 1

- Upload images and short videos through your app route

#### Phase 2

- Add resumable upload for larger videos
- Prefer a session-based upload design for large files

## 20) Upload Validation Rules

### Images

- allow: `jpg`, `jpeg`, `png`, `webp`
- max size: `10 MB`

### Videos

- allow: `mp4`, `webm`, `mov`
- max size: `50 MB` for MVP

### Always enforce

- auth required
- group membership required
- empty file reject
- mime type allowlist
- magic-byte verification for important types
- safe filename generation
- rate limit per user

## 21) Vercel-Specific Notes

Use Node runtime on upload and file-stream routes:

```ts
export const runtime = "nodejs";
```

Practical guidance:

- Do not put upload handlers on Edge runtime
- Keep initial uploads small enough for stable server handling
- Add resumable upload when video uploads become more important
- Log upload failures clearly

## 22) Build and Migration Commands

### Local

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Production

```bash
npx prisma migrate deploy
npx prisma generate
npm run build
```

### Suggested scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate"
  }
}
```

Small-project shortcut:

- You can run `prisma migrate deploy` during deployment, but keep the process explicit so migrations are not forgotten.

## 23) Security Checklist

- Keep all secrets server-side only
- Encrypt the Google refresh token if stored in the database
- Protect upload and delete routes
- Check ownership or admin permission before delete
- Use soft delete first, then Drive delete
- Verify file type, not only extension
- Add rate limiting
- Add request logging for uploads and deletes
- Keep a backup plan for database and Drive root folder

## 24) Deployment Checklist

### Before deploy

- [ ] GitHub repository ready
- [ ] Vercel project connected
- [ ] Supabase project created
- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] OAuth redirect URIs added
- [ ] Dedicated Google storage account prepared
- [ ] Drive root folder created
- [ ] Environment variables added
- [ ] Prisma migrations tested locally

### After deploy

- [ ] login works
- [ ] database connection works
- [ ] group membership checks work
- [ ] image upload works
- [ ] media list works
- [ ] protected media read works
- [ ] delete works with authorization
- [ ] Google callback works
- [ ] domain and HTTPS work

## 25) Common Problems and Fixes

### Prisma cannot connect

Fix:

- check `DATABASE_URL`
- check `DIRECT_URL`
- use correct Supabase pooled vs direct URLs
- confirm SSL parameters

### Google OAuth redirect mismatch

Fix:

- local and production URLs must be exact
- callback route path must match exactly

### Upload works locally but fails on Vercel

Fix:

- confirm env vars in Vercel
- confirm upload route uses Node runtime
- reduce file size for MVP
- inspect Vercel logs

### Media opens for everyone

Fix:

- stop relying on public Drive URLs
- serve files through an app-controlled route
- verify membership on read

### Video upload times out

Fix:

- reduce max file size
- move to resumable upload
- avoid heavy processing inside the request

## 26) Recommended MVP Plan

### Phase 1

- Auth.js login
- create group
- image upload
- gallery list
- protected media read

### Phase 2

- short video upload
- delete media
- user uploads page
- audit logging

### Phase 3

- resumable large video upload
- thumbnails
- comments
- notifications

## 27) Final Recommendation

For this project, the cleanest MVP architecture is:

- **Vercel** for the Next.js app
- **Supabase Postgres** for structured data
- **Google Drive** for actual file storage
- **Auth.js** for authentication

This gives you a stack that is practical, understandable, and realistic for a small private media-sharing app without overengineering the first release.
