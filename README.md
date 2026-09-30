# School & College Digital Attendance

A self-hostable digital attendance platform for schools and colleges.

## Architecture
Institution → Campus → Academic Year → Department → Class/Program → Section/Batch → Students + Subjects + Timetable. Attendance, Leave, Reports, Notifications and Audit Logs are institution-scoped.

## Included
- Admin, Principal, Teacher, Student and Parent dashboards
- Secure cookie sessions, RBAC, password reset and session invalidation
- Institution, student, teacher, class, section, subject and timetable APIs
- Attendance sessions and records with UNIQUE(sessionId, studentId)
- PRESENT, ABSENT, LATE, EXCUSED and LEAVE
- Attendance correction audit trail with old/new values, reason and device/IP fields
- Leave PENDING / APPROVED / REJECTED / CANCELLED
- QR session-token foundation with short expiry
- Offline attendance queue using IndexedDB and automatic sync after reconnection
- Daily/weekly/monthly/subject/semester/academic-year reporting foundation
- PWA/mobile-ready interface
- PostgreSQL + Prisma transactions
- Docker, Docker Compose and GitHub Actions CI

## API
/auth/* · /institutions/* · /users/* · /students/* · /teachers/* · /classes/* · /sections/* · /subjects/* · /timetable/* · /attendance/* · /leaves/* · /reports/* · /notifications/*

Key attendance endpoints:
- POST /api/attendance/sessions
- GET /api/attendance/sessions
- GET /api/attendance/sessions/:id
- POST /api/attendance/sessions/:id/records
- PATCH /api/attendance/records/:id
- GET /api/attendance/student/:studentId
- GET /api/attendance/class/:classId

## Attendance rules
The reporting baseline is PRESENT ÷ all recorded attendance records × 100. Institutions can configure minimum attendance percentage. Late handling should be selected by institution policy: Present-equivalent, separate status, or half-day; the schema preserves LATE separately so policy can be applied without losing source data.

## Local
1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` and a strong `SESSION_SECRET`.
3. npm install
4. npx prisma migrate dev --name init
5. npm run db:seed
6. npm run dev

Seed account: admin / ChangeMe123!. Change it immediately outside development.

## Docker
`docker compose up --build` starts the app and PostgreSQL. Run Prisma migration/seed inside the app container before first production use.

Never commit `.env`, database credentials, session secrets or production tokens.

## Cloudflare Workers + D1

This project can run on Cloudflare Workers using the OpenNext adapter and Cloudflare D1 (SQLite).

### One-time Cloudflare setup

1. Create a D1 database named `school-college-attendance`.
2. Put the returned database ID in `wrangler.jsonc` as `d1_databases[0].database_id`.
3. Apply the schema:
   ```bash
   npm install
   npm run d1:migrate
   ```
4. Configure Worker secrets/variables in Cloudflare:
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `RESEND_API_KEY` and `EMAIL_FROM` when production email is enabled.
5. Deploy:
   ```bash
   npm run deploy
   ```

The application uses the D1 binding named `DB`. The same Prisma schema is configured for SQLite locally and D1 in production.

**Important D1 limitation:** Cloudflare D1 currently does not provide ACID transactions. Prisma's D1 adapter therefore does not provide real `$transaction` guarantees. This repository still contains transaction-based workflows inherited from the PostgreSQL implementation; those workflows must be refactored to D1-safe idempotent/batched writes before treating the D1 deployment as production-ready.
