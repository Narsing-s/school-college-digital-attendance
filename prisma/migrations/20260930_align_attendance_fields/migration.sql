-- Align the persisted schema with the attendance domain contract.
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "classId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "entity" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMP(3);

UPDATE "AttendanceSession" s
SET "classId" = sec."classLevelId"
FROM "Section" sec
WHERE s."sectionId" = sec."id" AND s."classId" IS NULL;

UPDATE "Student"
SET "dateOfBirth" = "dob"
WHERE "dateOfBirth" IS NULL AND "dob" IS NOT NULL;

UPDATE "AuditLog"
SET "userId" = "actorUserId",
    "entity" = "entityType",
    "timestamp" = "createdAt"
WHERE "userId" IS NULL OR "entity" IS NULL OR "timestamp" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AttendanceSession_classId_fkey'
  ) THEN
    ALTER TABLE "AttendanceSession"
      ADD CONSTRAINT "AttendanceSession_classId_fkey"
      FOREIGN KEY ("classId") REFERENCES "ClassLevel"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "AttendanceSession_classId_idx" ON "AttendanceSession"("classId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
