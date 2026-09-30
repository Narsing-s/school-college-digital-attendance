-- Academic calendar / holidays
CREATE TYPE "CalendarDayType" AS ENUM ('WORKING','HOLIDAY','EXAM','EVENT');
CREATE TABLE "AcademicCalendarDay" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "name" TEXT NOT NULL,
  "type" "CalendarDayType" NOT NULL DEFAULT 'HOLIDAY',
  "description" TEXT,
  CONSTRAINT "AcademicCalendarDay_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AcademicCalendarDay_institutionId_date_key" ON "AcademicCalendarDay"("institutionId","date");
CREATE INDEX "AcademicCalendarDay_institutionId_academicYearId_date_idx" ON "AcademicCalendarDay"("institutionId","academicYearId","date");
ALTER TABLE "AcademicCalendarDay" ADD CONSTRAINT "AcademicCalendarDay_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicCalendarDay" ADD CONSTRAINT "AcademicCalendarDay_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
