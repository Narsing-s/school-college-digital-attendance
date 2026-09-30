import{PrismaClient,InstitutionType,UserRole,UserStatus,AttendanceStatus,AttendanceMethod}from"@prisma/client";
import bcrypt from"bcryptjs";
const db=new PrismaClient();

async function main(){
 const password=await bcrypt.hash("ChangeMe123!",12);
 const institution=await db.institution.upsert({where:{code:"DEMO"},update:{},create:{name:"Demo School & College",code:"DEMO",type:InstitutionType.SCHOOL}});
 const year=await db.academicYear.upsert({where:{institutionId_name:{institutionId:institution.id,name:"2026-27"}},update:{isCurrent:true},create:{institutionId:institution.id,name:"2026-27",startDate:new Date("2026-06-01"),endDate:new Date("2027-05-31"),isCurrent:true}});
 const department=await db.department.upsert({where:{institutionId_code:{institutionId:institution.id,code:"SCI"}},update:{},create:{institutionId:institution.id,name:"Science & Mathematics",code:"SCI"}});
 const classLevel=await db.classLevel.upsert({where:{institutionId_code:{institutionId:institution.id,code:"C10"}},update:{},create:{institutionId:institution.id,name:"Class 10",code:"C10",type:InstitutionType.SCHOOL,departmentId:department.id}});
 const section=await db.section.upsert({where:{classLevelId_name:{classLevelId:classLevel.id,name:"A"}},update:{},create:{institutionId:institution.id,classLevelId:classLevel.id,name:"A"}});
 const admin=await db.user.upsert({where:{username:"admin"},update:{passwordHash:password,institutionId:institution.id,role:UserRole.ADMIN,status:UserStatus.ACTIVE},create:{username:"admin",email:"admin@example.com",passwordHash:password,role:UserRole.ADMIN,status:UserStatus.ACTIVE,institutionId:institution.id}});
 const teacherUser=await db.user.upsert({where:{username:"teacher1"},update:{passwordHash:password,institutionId:institution.id,role:UserRole.TEACHER,status:UserStatus.ACTIVE},create:{username:"teacher1",email:"teacher@example.com",passwordHash:password,role:UserRole.TEACHER,status:UserStatus.ACTIVE,institutionId:institution.id}});
 const teacher=await db.teacher.upsert({where:{institutionId_employeeId:{institutionId:institution.id,employeeId:"T001"}},update:{userId:teacherUser.id,name:"Suresh Kumar",email:"teacher@example.com",departmentId:department.id},create:{institutionId:institution.id,userId:teacherUser.id,employeeId:"T001",name:"Suresh Kumar",email:"teacher@example.com",departmentId:department.id}});
 const math=await db.subject.upsert({where:{institutionId_code:{institutionId:institution.id,code:"MATH10"}},update:{},create:{institutionId:institution.id,classLevelId:classLevel.id,departmentId:department.id,code:"MATH10",name:"Mathematics",credits:5}});
 const science=await db.subject.upsert({where:{institutionId_code:{institutionId:institution.id,code:"SCI10"}},update:{},create:{institutionId:institution.id,classLevelId:classLevel.id,departmentId:department.id,code:"SCI10",name:"Science",credits:5}});
 await db.teacherAssignment.upsert({where:{academicYearId_teacherId_subjectId_sectionId:{academicYearId:year.id,teacherId:teacher.id,subjectId:math.id,sectionId:section.id}},update:{},create:{institutionId:institution.id,academicYearId:year.id,teacherId:teacher.id,subjectId:math.id,sectionId:section.id}});
 await db.timetable.deleteMany({where:{institutionId:institution.id,academicYearId:year.id,sectionId:section.id}});
 await db.timetable.createMany({data:[
  {institutionId:institution.id,academicYearId:year.id,sectionId:section.id,subjectId:math.id,teacherId:teacher.id,dayOfWeek:1,startTime:"09:00",endTime:"10:00"},
  {institutionId:institution.id,academicYearId:year.id,sectionId:section.id,subjectId:science.id,teacherId:teacher.id,dayOfWeek:1,startTime:"10:00",endTime:"11:00"}
 ]});
 for(let n=1;n<=10;n++){
  const admission="ADM"+String(n).padStart(3,"0");
  const st=await db.student.upsert({where:{institutionId_admissionNumber:{institutionId:institution.id,admissionNumber:admission}},update:{},create:{institutionId:institution.id,admissionNumber:admission,rollNumber:String(n),firstName:["Rahul","Priya","Arjun","Sneha"][n-1]||"Student",lastName:n<=4?"Demo":String(n)}});
  await db.enrollment.upsert({where:{academicYearId_studentId:{academicYearId:year.id,studentId:st.id}},update:{sectionId:section.id,rollNumber:String(n)},create:{institutionId:institution.id,academicYearId:year.id,studentId:st.id,sectionId:section.id,rollNumber:String(n)}});
  if(n===1){
   const su=await db.user.upsert({where:{username:"student1"},update:{passwordHash:password,institutionId:institution.id,role:UserRole.STUDENT,status:UserStatus.ACTIVE},create:{username:"student1",email:"student1@example.com",passwordHash:password,role:UserRole.STUDENT,status:UserStatus.ACTIVE,institutionId:institution.id}});
   await db.student.update({where:{id:st.id},data:{userId:su.id,email:"student1@example.com"}});
   const pu=await db.user.upsert({where:{username:"parent1"},update:{passwordHash:password,institutionId:institution.id,role:UserRole.PARENT,status:UserStatus.ACTIVE},create:{username:"parent1",email:"parent1@example.com",passwordHash:password,role:UserRole.PARENT,status:UserStatus.ACTIVE,institutionId:institution.id}});
   const parent=await db.parent.upsert({where:{userId:pu.id}},update:{},create:{institutionId:institution.id,userId:pu.id,phone:"9000000000"}});
   await db.parentStudent.upsert({where:{parentId_studentId:{parentId:parent.id,studentId:st.id}},update:{},create:{parentId:parent.id,studentId:st.id,relationship:"Parent"}});
  }
 }
 const day=new Date("2026-09-30T09:00:00+05:30");
 let session=await db.attendanceSession.findFirst({where:{institutionId:institution.id,academicYearId:year.id,sectionId:section.id,subjectId:math.id,date:day}});
 if(!session)session=await db.attendanceSession.create({data:{institutionId:institution.id,academicYearId:year.id,classId:classLevel.id,sectionId:section.id,subjectId:math.id,teacherId:teacher.id,date:day,startTime:"09:00",endTime:"10:00",method:AttendanceMethod.MANUAL,createdBy:admin.id}});
 const statuses:AttendanceStatus[]=["PRESENT","PRESENT","ABSENT","PRESENT","PRESENT","LATE","PRESENT","PRESENT","EXCUSED","PRESENT"];
 const enrollments=await db.enrollment.findMany({where:{institutionId:institution.id,academicYearId:year.id,sectionId:section.id},orderBy:{rollNumber:"asc"}});
 for(let i=0;i<enrollments.length;i++){
  await db.attendanceRecord.upsert({where:{sessionId_studentId:{sessionId:session.id,studentId:enrollments[i].studentId}},update:{status:statuses[i]||"PRESENT",markedBy:teacherUser.id},create:{institutionId:institution.id,sessionId:session.id,studentId:enrollments[i].studentId,status:statuses[i]||"PRESENT",markedBy:teacherUser.id}});
 }
 console.log("Seed complete. Demo passwords: ChangeMe123!");
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect());
