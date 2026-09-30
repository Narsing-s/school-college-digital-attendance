import{NextResponse}from"next/server";
import{db}from"@/lib/db";
import{requireUser}from"@/lib/auth";
import{bulkAttendanceSchema}from"@/lib/validation";

export async function POST(req:Request){
 try{
  const u=await requireUser();
  if(!u.institutionId||!["ADMIN","PRINCIPAL","TEACHER"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
  const b=bulkAttendanceSchema.parse(await req.json());
  const s=await db.attendanceSession.findFirst({where:{id:b.sessionId,institutionId:u.institutionId}});
  if(!s)return NextResponse.json({error:"Session not found"},{status:404});
  if(s.status==="CLOSED")return NextResponse.json({error:"Attendance session is closed"},{status:409});
  if(u.role==="TEACHER"){
   const teacher=await db.teacher.findFirst({where:{userId:u.id,institutionId:u.institutionId}});
   const assignment=teacher?await db.teacherAssignment.findFirst({where:{institutionId:u.institutionId,teacherId:teacher.id,academicYearId:s.academicYearId,sectionId:s.sectionId,subjectId:s.subjectId||undefined}}):null;
   if(!teacher||!assignment)return NextResponse.json({error:"Teacher is not assigned to this class/subject"},{status:403});
  }
  const ids=b.records.map(x=>x.studentId);
  const enrolled=await db.enrollment.findMany({where:{institutionId:u.institutionId,academicYearId:s.academicYearId,sectionId:s.sectionId,studentId:{in:ids},status:"ACTIVE"},select:{studentId:true}});
  const allowed=new Set(enrolled.map(x=>x.studentId));
  if(b.records.some(x=>!allowed.has(x.studentId)))return NextResponse.json({error:"One or more students are not enrolled in this session section"},{status:400});
  await db.$transaction(async tx=>{
   for(const x of b.records){
    const before=await tx.attendanceRecord.findUnique({where:{sessionId_studentId:{sessionId:b.sessionId,studentId:x.studentId}}});
    await tx.attendanceRecord.upsert({where:{sessionId_studentId:{sessionId:b.sessionId,studentId:x.studentId}},create:{institutionId:u.institutionId!,sessionId:b.sessionId,studentId:x.studentId,status:x.status,markedBy:u.id,remarks:x.remarks},update:{status:x.status,markedAt:new Date(),markedBy:u.id,remarks:x.remarks}});
    if(before&&before.status!==x.status)await tx.auditLog.create({data:{institutionId:u.institutionId!,actorUserId:u.id,userId:u.id,action:"ATTENDANCE_STATUS_CHANGED",entityType:"AttendanceRecord",entity:"AttendanceRecord",entityId:before.id,oldValue:{status:before.status},newValue:{status:x.status},reason:x.remarks||"Attendance corrected",timestamp:new Date(),ip:req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip"),userAgent:req.headers.get("user-agent"),deviceId:req.headers.get("x-device-id")||null,deviceName:req.headers.get("x-device-name")||null}});
   }
  });
  return NextResponse.json({ok:true,count:b.records.length});
 }catch(e){const m=e instanceof Error?e.message:"Invalid request";return NextResponse.json({error:m==="AUTHENTICATION_REQUIRED"?"Authentication required":m},{status:m==="AUTHENTICATION_REQUIRED"?401:400})}
}