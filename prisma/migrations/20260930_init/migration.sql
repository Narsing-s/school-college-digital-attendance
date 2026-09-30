CREATE TYPE "InstitutionType" AS ENUM ('SCHOOL','COLLEGE');
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN','ADMIN','PRINCIPAL','TEACHER','STUDENT','PARENT');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT','ABSENT','LATE','EXCUSED','LEAVE');
CREATE TYPE "AttendanceMethod" AS ENUM ('MANUAL','QR','ROLL_NUMBER');
CREATE TYPE "SessionStatus" AS ENUM ('OPEN','CLOSED');
CREATE TYPE "LatePolicy" AS ENUM ('PRESENT','SEPARATE','HALF_DAY');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING','APPROVED','REJECTED','CANCELLED');

CREATE TABLE "Institution" (
 "id" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "code" TEXT NOT NULL,
 "type" "InstitutionType" NOT NULL,
 "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
 "minAttendancePercent" DOUBLE PRECISION NOT NULL DEFAULT 75,
 "latePolicy" "LatePolicy" NOT NULL DEFAULT 'SEPARATE',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Institution_code_key" ON "Institution"("code");

CREATE TABLE "Campus" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"name" TEXT NOT NULL,"code" TEXT NOT NULL,"address" TEXT,"status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
 CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Campus_institutionId_code_key" ON "Campus"("institutionId","code");

CREATE TABLE "AcademicYear" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"campusId" TEXT,"name" TEXT NOT NULL,"startDate" TIMESTAMP(3) NOT NULL,"endDate" TIMESTAMP(3) NOT NULL,"isCurrent" BOOLEAN NOT NULL DEFAULT false,
 CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AcademicYear_institutionId_name_key" ON "AcademicYear"("institutionId","name");
CREATE INDEX "AcademicYear_institutionId_isCurrent_idx" ON "AcademicYear"("institutionId","isCurrent");

CREATE TABLE "Department" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"name" TEXT NOT NULL,"code" TEXT NOT NULL,"status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
 CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Department_institutionId_code_key" ON "Department"("institutionId","code");

CREATE TABLE "ClassLevel" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"departmentId" TEXT,"name" TEXT NOT NULL,"code" TEXT NOT NULL,"type" "InstitutionType" NOT NULL,
 CONSTRAINT "ClassLevel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClassLevel_institutionId_code_key" ON "ClassLevel"("institutionId","code");

CREATE TABLE "Section" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"classLevelId" TEXT NOT NULL,"name" TEXT NOT NULL,"capacity" INTEGER NOT NULL DEFAULT 60,
 CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Section_classLevelId_name_key" ON "Section"("classLevelId","name");

CREATE TABLE "Subject" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"classLevelId" TEXT,"departmentId" TEXT,"code" TEXT NOT NULL,"name" TEXT NOT NULL,"credits" INTEGER,
 CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subject_institutionId_code_key" ON "Subject"("institutionId","code");

CREATE TABLE "User" (
 "id" TEXT NOT NULL,"institutionId" TEXT,"email" TEXT,"emailVerifiedAt" TIMESTAMP(3),"username" TEXT NOT NULL,"passwordHash" TEXT NOT NULL,"role" "UserRole" NOT NULL,"status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',"lastLoginAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_institutionId_role_idx" ON "User"("institutionId","role");

CREATE TABLE "Student" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"userId" TEXT,"admissionNumber" TEXT NOT NULL,"rollNumber" TEXT,"firstName" TEXT NOT NULL,"lastName" TEXT,"dob" TIMESTAMP(3),"dateOfBirth" TIMESTAMP(3),"gender" TEXT,"email" TEXT,"phone" TEXT,"guardianName" TEXT,"guardianPhone" TEXT,"status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
 CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE UNIQUE INDEX "Student_institutionId_admissionNumber_key" ON "Student"("institutionId","admissionNumber");
CREATE INDEX "Student_institutionId_rollNumber_idx" ON "Student"("institutionId","rollNumber");

CREATE TABLE "Teacher" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"userId" TEXT NOT NULL,"employeeId" TEXT NOT NULL,"name" TEXT,"email" TEXT,"departmentId" TEXT,"phone" TEXT,"status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
 CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");
CREATE UNIQUE INDEX "Teacher_institutionId_employeeId_key" ON "Teacher"("institutionId","employeeId");

CREATE TABLE "Parent" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"userId" TEXT NOT NULL,"phone" TEXT,
 CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent"("userId");

CREATE TABLE "ParentStudent" (
 "parentId" TEXT NOT NULL,"studentId" TEXT NOT NULL,"relationship" TEXT NOT NULL DEFAULT 'Guardian',
 CONSTRAINT "ParentStudent_pkey" PRIMARY KEY ("parentId","studentId")
);

CREATE TABLE "Enrollment" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"academicYearId" TEXT NOT NULL,"studentId" TEXT NOT NULL,"sectionId" TEXT NOT NULL,"rollNumber" TEXT,"status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
 CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Enrollment_academicYearId_studentId_key" ON "Enrollment"("academicYearId","studentId");
CREATE INDEX "Enrollment_sectionId_academicYearId_idx" ON "Enrollment"("sectionId","academicYearId");

CREATE TABLE "TeacherAssignment" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"academicYearId" TEXT NOT NULL,"teacherId" TEXT NOT NULL,"subjectId" TEXT NOT NULL,"sectionId" TEXT NOT NULL,
 CONSTRAINT "TeacherAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeacherAssignment_academicYearId_teacherId_subjectId_sectionId_key" ON "TeacherAssignment"("academicYearId","teacherId","subjectId","sectionId");

CREATE TABLE "Timetable" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"academicYearId" TEXT NOT NULL,"sectionId" TEXT NOT NULL,"subjectId" TEXT NOT NULL,"teacherId" TEXT NOT NULL,"dayOfWeek" INTEGER NOT NULL,"startTime" TEXT NOT NULL,"endTime" TEXT NOT NULL,"room" TEXT,
 CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Timetable_sectionId_dayOfWeek_idx" ON "Timetable"("sectionId","dayOfWeek");

CREATE TABLE "AttendanceSession" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"academicYearId" TEXT NOT NULL,"classId" TEXT,"sectionId" TEXT NOT NULL,"subjectId" TEXT,"teacherId" TEXT,"date" TIMESTAMP(3) NOT NULL,"startTime" TEXT,"endTime" TEXT,"method" "AttendanceMethod" NOT NULL DEFAULT 'MANUAL',"status" "SessionStatus" NOT NULL DEFAULT 'OPEN',"latePolicy" "LatePolicy" NOT NULL DEFAULT 'SEPARATE',"createdBy" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AttendanceSession_institutionId_date_idx" ON "AttendanceSession"("institutionId","date");
CREATE INDEX "AttendanceSession_sectionId_date_idx" ON "AttendanceSession"("sectionId","date");
CREATE INDEX "AttendanceSession_classId_idx" ON "AttendanceSession"("classId");

CREATE TABLE "AttendanceRecord" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"sessionId" TEXT NOT NULL,"studentId" TEXT NOT NULL,"status" "AttendanceStatus" NOT NULL,"markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"markedBy" TEXT NOT NULL,"remarks" TEXT,
 CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId","studentId");
CREATE INDEX "AttendanceRecord_institutionId_studentId_idx" ON "AttendanceRecord"("institutionId","studentId");

CREATE TABLE "LeaveRequest" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"studentId" TEXT NOT NULL,"fromDate" TIMESTAMP(3) NOT NULL,"toDate" TIMESTAMP(3) NOT NULL,"reason" TEXT NOT NULL,"status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',"approvedBy" TEXT,"approvedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LeaveRequest_institutionId_status_idx" ON "LeaveRequest"("institutionId","status");

CREATE TABLE "Notification" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"userId" TEXT NOT NULL,"type" TEXT NOT NULL,"title" TEXT NOT NULL,"message" TEXT NOT NULL,"readAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId","readAt");

CREATE TABLE "AuditLog" (
 "id" TEXT NOT NULL,"institutionId" TEXT NOT NULL,"actorUserId" TEXT NOT NULL,"userId" TEXT,"action" TEXT NOT NULL,"entityType" TEXT NOT NULL,"entity" TEXT,"entityId" TEXT NOT NULL,"oldValue" JSONB,"newValue" JSONB,"reason" TEXT,"timestamp" TIMESTAMP(3),"ip" TEXT,"userAgent" TEXT,"deviceId" TEXT,"deviceName" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_institutionId_createdAt_idx" ON "AuditLog"("institutionId","createdAt");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

CREATE TABLE "Session" (
 "id" TEXT NOT NULL,"userId" TEXT NOT NULL,"tokenHash" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId","expiresAt");

CREATE TABLE "EmailVerificationToken" (
 "id" TEXT NOT NULL,"userId" TEXT NOT NULL,"tokenHash" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,"verifiedAt" TIMESTAMP(3),
 CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId","expiresAt");

CREATE TABLE "PasswordResetToken" (
 "id" TEXT NOT NULL,"userId" TEXT NOT NULL,"tokenHash" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,"usedAt" TIMESTAMP(3),
 CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId","expiresAt");

ALTER TABLE "Campus" ADD CONSTRAINT "Campus_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassLevel" ADD CONSTRAINT "ClassLevel_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassLevel" ADD CONSTRAINT "ClassLevel_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Section" ADD CONSTRAINT "Section_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Section" ADD CONSTRAINT "Section_classLevelId_fkey" FOREIGN KEY ("classLevelId") REFERENCES "ClassLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_classLevelId_fkey" FOREIGN KEY ("classLevelId") REFERENCES "ClassLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
