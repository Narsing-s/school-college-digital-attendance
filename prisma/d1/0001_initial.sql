PRAGMA foreign_keys = ON;

CREATE TABLE "Institution" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE,
  "type" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "minAttendancePercent" REAL NOT NULL DEFAULT 75,
  "latePolicy" TEXT NOT NULL DEFAULT 'SEPARATE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Campus" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "address" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE ("institutionId","code")
);

CREATE TABLE "AcademicYear" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "campusId" TEXT,
  "name" TEXT NOT NULL,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "isCurrent" BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE ("institutionId","name")
);

CREATE TABLE "Department" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE ("institutionId","code")
);

CREATE TABLE "ClassLevel" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "departmentId" TEXT,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE ("institutionId","code")
);

CREATE TABLE "Section" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "classLevelId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 60,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("classLevelId") REFERENCES "ClassLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE ("classLevelId","name")
);

CREATE TABLE "Subject" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "classLevelId" TEXT,
  "departmentId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "credits" INTEGER,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("classLevelId") REFERENCES "ClassLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE ("institutionId","code")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT,
  "email" TEXT,
  "emailVerifiedAt" DATETIME,
  "username" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "lastLoginAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Student" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "userId" TEXT UNIQUE,
  "admissionNumber" TEXT NOT NULL,
  "rollNumber" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  "dob" DATETIME,
  "dateOfBirth" DATETIME,
  "gender" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "guardianName" TEXT,
  "guardianPhone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE ("institutionId","admissionNumber")
);

CREATE TABLE "Teacher" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL UNIQUE,
  "employeeId" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "departmentId" TEXT,
  "phone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE ("institutionId","employeeId")
);

CREATE TABLE "Parent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL UNIQUE,
  "phone" TEXT,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ParentStudent" (
  "parentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "relationship" TEXT NOT NULL DEFAULT 'Guardian',
  PRIMARY KEY ("parentId","studentId"),
  FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Enrollment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "rollNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE ("academicYearId","studentId")
);

CREATE TABLE "TeacherAssignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE ("academicYearId","teacherId","subjectId","sectionId")
);

CREATE TABLE "Timetable" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "room" TEXT,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AttendanceSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "classId" TEXT,
  "sectionId" TEXT NOT NULL,
  "subjectId" TEXT,
  "teacherId" TEXT,
  "date" DATETIME NOT NULL,
  "startTime" TEXT,
  "endTime" TEXT,
  "method" TEXT NOT NULL DEFAULT 'MANUAL',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "latePolicy" TEXT NOT NULL DEFAULT 'SEPARATE',
  "createdBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("classId") REFERENCES "ClassLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "AttendanceRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "markedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "markedBy" TEXT NOT NULL,
  "remarks" TEXT,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE ("sessionId","studentId")
);

CREATE TABLE "LeaveRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "fromDate" DATETIME NOT NULL,
  "toDate" DATETIME NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approvedBy" TEXT,
  "approvedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entity" TEXT,
  "entityId" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "reason" TEXT,
  "timestamp" DATETIME,
  "ip" TEXT,
  "userAgent" TEXT,
  "deviceId" TEXT,
  "deviceName" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "EmailVerificationToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" DATETIME NOT NULL,
  "verifiedAt" DATETIME,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" DATETIME NOT NULL,
  "usedAt" DATETIME,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AttendanceSyncOperation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "operationId" TEXT NOT NULL UNIQUE,
  "institutionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AcademicCalendarDay" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'HOLIDAY',
  "description" TEXT,
  FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE ("institutionId","date")
);

CREATE INDEX "AcademicYear_institutionId_isCurrent_idx" ON "AcademicYear"("institutionId","isCurrent");
CREATE INDEX "User_institutionId_role_idx" ON "User"("institutionId","role");
CREATE INDEX "Student_institutionId_rollNumber_idx" ON "Student"("institutionId","rollNumber");
CREATE INDEX "Enrollment_sectionId_academicYearId_idx" ON "Enrollment"("sectionId","academicYearId");
CREATE INDEX "Timetable_sectionId_dayOfWeek_idx" ON "Timetable"("sectionId","dayOfWeek");
CREATE INDEX "AttendanceSession_institutionId_date_idx" ON "AttendanceSession"("institutionId","date");
CREATE INDEX "AttendanceSession_sectionId_date_idx" ON "AttendanceSession"("sectionId","date");
CREATE INDEX "AttendanceRecord_institutionId_studentId_idx" ON "AttendanceRecord"("institutionId","studentId");
CREATE INDEX "LeaveRequest_institutionId_status_idx" ON "LeaveRequest"("institutionId","status");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId","readAt");
CREATE INDEX "AuditLog_institutionId_createdAt_idx" ON "AuditLog"("institutionId","createdAt");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId","expiresAt");
CREATE INDEX "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId","expiresAt");
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId","expiresAt");
CREATE INDEX "AttendanceSyncOperation_institutionId_createdAt_idx" ON "AttendanceSyncOperation"("institutionId","createdAt");
CREATE INDEX "AcademicCalendarDay_institutionId_academicYearId_date_idx" ON "AcademicCalendarDay"("institutionId","academicYearId","date");
