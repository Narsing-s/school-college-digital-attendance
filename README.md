# School & College Digital Attendance

A production-oriented Next.js + Prisma + PostgreSQL foundation for schools and colleges.

## Core
Multi-institution tenancy, Admin/Principal/Teacher/Student/Parent roles, academic years, departments, classes, sections, subjects, students, teachers, parents, enrollments, teacher assignments, timetables, attendance sessions, five attendance states, leave workflow, notifications, audit logs, secure cookie sessions, responsive UI, Docker and CI.

## Run
Copy .env.example to .env, set DATABASE_URL and SESSION_SECRET, then: npm install && npx prisma migrate dev --name init && npm run db:seed && npm run dev.

Demo: admin / ChangeMe123! — change before production.