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