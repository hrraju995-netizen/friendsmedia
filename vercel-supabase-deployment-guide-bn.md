# Friends Media App Deployment Guide

একটি private media-sharing app deploy করার জন্য clean production guide।

এই ফাইলটি **UTF-8** encoding-এ রাখতে হবে।

## 1) Final Stack Decision

এই project-এর জন্য final stack:

- **App framework:** Next.js (App Router)
- **Hosting:** Vercel
- **Database:** Supabase Postgres
- **ORM:** Prisma
- **Authentication:** Auth.js
- **Media storage:** Google Drive
- **Styling:** Tailwind CSS

## 2) Core Decision

Guide-টা ইচ্ছা করে কিছু decision fixed করে দিচ্ছে, যাতে পরে architecture messy না হয়ে যায়:

- authentication-এর জন্য শুধু **Auth.js** use করবে
- **Auth.js** আর **Firebase Auth** একসাথে use করবে না
- app-এর media storage-এর জন্য **একটা dedicated Google account** use করবে
- সব upload সেই Drive account-এর root folder-এর মধ্যে যাবে
- user-দের নিজেদের Drive connect করতে হবে না
- file metadata থাকবে Postgres-এ
- actual file থাকবে Google Drive-এ
- media default হিসেবে **private** থাকবে

## 3) Recommended Storage Model

এই app-এর জন্য সবচেয়ে practical Google Drive model:

1. app storage-এর জন্য আলাদা Google account খুলো
2. ওই Drive-এ manually একটা root folder তৈরি করো
3. একবার OAuth দিয়ে account connect করো
4. refresh token server-side এ securely store করো
5. future upload/read-এর জন্য সেই token use করো

এটা MVP-র জন্য ভালো কারণ:

- প্রতি user-এর Drive connect করতে হয় না
- permission model সহজ হয়
- folder management সহজ হয়
- backup ও maintenance সহজ হয়

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
          |
          +--> Google Drive API
                 - images
                 - videos
                 - thumbnails
```

## 5) Data Ownership Rule

- **Google Drive**-এ থাকবে আসল file bytes
- **Postgres**-এ থাকবে metadata

Recommended metadata:

- uploader
- group
- drive file ID
- file name
- mime type
- file size
- status
- timestamps

শুধু Drive `webViewLink`-কে security layer হিসেবে ধরা ঠিক হবে না। Private app হলে access control app-এর ভেতরেই enforce করতে হবে।

## 6) Recommended User Flow

### Login

- user Auth.js দিয়ে sign in করবে
- session create হবে
- protected page এবং upload route-এ authenticated session লাগবে

### Upload

1. user image বা video select করবে
2. app auth, file size, mime type, group membership validate করবে
3. server proper Drive folder select করবে
4. file Google Drive-এ upload হবে
5. Drive metadata পাওয়া যাবে
6. Postgres-এ media row save হবে
7. gallery update হবে

### View Media

1. user gallery page open করবে
2. app Postgres থেকে allowed media query করবে
3. user media item click করবে
4. app protected read flow দিয়ে file serve করবে

## 7) Private Media Access Strategy

Private app-এর জন্য recommended approach:

- database-এ `driveFileId` store করো
- protected route বানাও, যেমন `GET /api/media/[id]/stream`
- ওই route-এ session check করো
- group membership check করো
- server-side থেকে Drive file fetch করো
- client-এ stream করে ফেরত দাও

Avoid:

- সব file public করে দেওয়া
- public Drive URL-এর উপর পুরো access control ছেড়ে দেওয়া

## 8) Services You Need

### GitHub

- codebase store করবে
- Vercel-এর সাথে connect হবে

### Vercel

- Next.js app deploy করবে
- environment variable store করবে

### Supabase

- PostgreSQL host করবে

### Google Cloud

- Google Drive API enable করবে
- OAuth credential manage করবে

## 9) Environment Variables

Suggested `.env.example`:

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

# Optional
GOOGLE_DRIVE_REFRESH_TOKEN=
```

Notes:

- `DATABASE_URL` pooled connection হওয়া ভালো
- `DIRECT_URL` migration-এর জন্য direct connection হওয়া ভালো
- existing codebase যদি `NEXTAUTH_SECRET` use করে, তাহলে project জুড়ে consistent naming রাখো
- কোনো secret client-side expose করবে না

## 10) Supabase Setup

### Step 1

- Supabase project create করো
- strong database password set করো

### Step 2

- database settings থেকে pooled এবং direct দুই ধরনের connection string নাও

### Step 3

Example:

```env
DATABASE_URL=postgresql://...pooler...?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...direct-host...:5432/postgres?sslmode=require
```

### Step 4

Prisma datasource:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 11) Vercel Setup

### Step 1

- Vercel account create করো
- GitHub connect করো
- repo import করো

### Step 2

এই env vars add করো:

- `AUTH_SECRET`
- `AUTH_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REDIRECT_URI`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `GOOGLE_DRIVE_REFRESH_TOKEN` যদি env-এ রাখো

### Step 3

- framework হিসেবে Next.js detect হবে

### Step 4

- deploy করো

## 12) Google Cloud Setup

### Step 1

- Google Cloud Console-এ নতুন project create করো

### Step 2

- **Google Drive API** enable করো

### Step 3

- OAuth consent screen configure করো
- app name, support email set করো
- শুরুতে test user add করো

### Step 4

- **OAuth Client ID** create করো
- application type: **Web application**

### Step 5

Authorized redirect URI add করো

Local:

```txt
http://localhost:3000/api/google/callback
```

Production:

```txt
https://your-domain.com/api/google/callback
```

### Step 6

- dedicated Google storage account দিয়ে sign in করো
- offline access allow করো
- refresh token securely store করো

Important:

- app-এর future upload/read-এর জন্য offline access দরকার
- personal daily-use Google account storage account হিসেবে use না করাই ভালো

## 13) Drive Folder Structure

Recommended structure:

```txt
FriendsMediaApp/
  groups/
    group-<groupId>/
      images/
      videos/
      thumbnails/
```

এতে সুবিধা:

- group-wise cleanup সহজ
- file isolation সহজ
- future automation সহজ

## 14) Core Database Tables

দুই ধরনের table লাগবে:

### Auth tables

Auth.js Prisma adapter use করলে standard auth table রাখো:

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

এটা app-specific অংশ। Auth.js-এর standard Prisma models আলাদা করে add করতে হবে।

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
  id                   String    @id @default(cuid())
  uploaderId           String
  groupId              String
  driveFileId          String    @unique
  thumbnailDriveFileId String?
  fileName             String
  mimeType             String
  size                 Int
  mediaType            String
  status               String    @default("ready")
  checksum             String?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  deletedAt            DateTime?

  uploader             User      @relation(fields: [uploaderId], references: [id], onDelete: Cascade)
  group                Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)

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

Auth.js use করলে সাধারণত আলাদা `/api/auth/login` বা `/api/auth/logout` route দরকার হয় না।

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

- **Images:** সর্বোচ্চ `10 MB`
- **Videos:** শুরুতে সর্বোচ্চ `50 MB`
- upload route runtime: `nodejs`

### কেন শুরুতে 200 MB না?

কারণ Vercel-এ MVP stage-এ বড় upload timeout, request handling, এবং stability issue তৈরি করতে পারে। আগে ছোট limit নিয়ে stable flow বানানো ভালো।

### Recommended phases

#### Phase 1

- app route দিয়ে image এবং short video upload

#### Phase 2

- বড় video-এর জন্য resumable upload
- session-based upload design

## 20) Upload Validation Rules

### Images

- allow: `jpg`, `jpeg`, `png`, `webp`
- max size: `10 MB`

### Videos

- allow: `mp4`, `webm`, `mov`
- max size: `50 MB`

### Always enforce

- auth required
- group membership required
- empty file reject
- mime type allowlist
- magic-byte verification
- safe filename generation
- per-user rate limit

## 21) Vercel-Specific Notes

Upload এবং file stream route-এ:

```ts
export const runtime = "nodejs";
```

Practical rules:

- Edge runtime-এ upload route দিও না
- শুরুতে upload size controlled রাখো
- পরে প্রয়োজন হলে resumable upload add করো
- upload failure proper log করো

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

## 23) Security Checklist

- সব secret server-side রাখো
- refresh token database-এ রাখলে encrypt করো
- upload ও delete route protect করো
- delete-এর আগে ownership বা admin permission check করো
- আগে soft delete, পরে Drive delete করো
- শুধু extension না, file type verify করো
- rate limiting add করো
- upload/delete request log রাখো
- DB আর Drive folder-এর backup plan রাখো

## 24) Deployment Checklist

### Before deploy

- [ ] GitHub repository ready
- [ ] Vercel project connected
- [ ] Supabase project created
- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] OAuth redirect URIs added
- [ ] dedicated Google storage account prepared
- [ ] Drive root folder created
- [ ] environment variables added
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

### Prisma connect হচ্ছে না

Fix:

- `DATABASE_URL` check করো
- `DIRECT_URL` check করো
- Supabase pooled আর direct URL আলাদা ঠিকমতো use করছ কি না দেখো
- SSL params ঠিক আছে কি না দেখো

### Google OAuth redirect mismatch

Fix:

- local আর production URL exact match হতে হবে
- callback route path exact same হতে হবে

### Local-এ upload works, Vercel-এ fail করে

Fix:

- Vercel env vars ঠিক আছে কি না check করো
- upload route Node runtime use করছে কি না check করো
- file size কমিয়ে test করো
- Vercel logs check করো

### Media সবার জন্য open হয়ে যাচ্ছে

Fix:

- public Drive URL-এর উপর depend কোরো না
- app-controlled stream route use করো
- read-এর সময় membership check করো

### Video upload timeout

Fix:

- max file size কমাও
- resumable upload use করো
- request-এর মধ্যে heavy processing এড়িয়ে চলো

## 26) Recommended MVP Plan

### Phase 1

- Auth.js login
- group create
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

এই project-এর জন্য clean MVP architecture হবে:

- **Vercel** এ Next.js app
- **Supabase Postgres** এ structured data
- **Google Drive** এ actual media file
- **Auth.js** এ authentication

এই setup ছোট private media-sharing app-এর জন্য practical, manageable, এবং production-friendly।
