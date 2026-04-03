# Friends Media App

Private media-sharing app scaffold built from the deployment guide.

## Stack

- Next.js App Router
- Auth.js with credentials
- Prisma
- Supabase Postgres
- Google Drive API
- Tailwind CSS

## Quick Start

1. Copy `.env.example` to `.env`.
2. Fill in the database and Google Drive credentials.
3. Install dependencies.
4. Run Prisma generate and migrations.
5. Run lint and type checks.
6. Start the dev server.

## Commands

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run lint
npm run typecheck
npm run dev
```

## Database Setup

The default `.env` values are placeholders. Registration and login will fail until `DATABASE_URL` points to a real PostgreSQL server.

Use one of these options before running Prisma migrations:

- Start a local PostgreSQL server on `localhost:5432` and create a `friendsmedia` database that matches the credentials in `.env`.
- Replace `DATABASE_URL` and `DIRECT_URL` with your Supabase Postgres connection strings.

After the database is reachable, run:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Demo Seed

After migrations, you can seed a demo user:

```bash
npm run seed
```

Demo credentials:

- Email: `demo@friendsmedia.app`
- Password: `password123`

## Notes

- `.env.example` contains placeholder values. Copy it to `.env` and replace every credential before running the app.
- The repo includes an initial Prisma migration under `prisma/migrations` so a fresh database can start from a committed baseline.
