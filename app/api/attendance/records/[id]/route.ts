import{NextResponse}from"next/server";import{db}from"@/lib/db";import{requireUser}from"@/lib/auth";import{notifyAttendanceEvent}from"@/lib/notifications/events";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const u=await requireUser();
  if(!u.institutionId||!["ADMIN","PRINCIPAL","TEACHER"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
  const{id}=await params;const before=await db.attendanceRecord.findFirst({where:{id,institutionId:u.institutionId},include:{session:true}});
  if(!before)return NextResponse.json({error:"Not found"},{status:404});
  if(before.session.status==="CLOSED")return NextResponse.json({error:"Attendance session is closed"},{status:409});
  if(u.role==="TEACHER"){
   const teacher=await db.teacher.findFirst({where:{userId:u.id,institutionId:u.institutionId}});
   const assignment=teacher?await db.teacherAssignment.findFirst({where:{institutionId:u.institutionId,teacherId:teacher.id,academicYearId:before.session.academicYearId,sectionId:before.session.sectionId,subjectId:before.session.subjectId||undefined}}):null;
   if(!teacher||!assignment)return NextResponse.json({error:"Teacher is not assigned to this class/subject"},{status:403});
  }
  const b=await req.json();if(!["PRESENT","ABSENT","LATE","EXCUSED","LEAVE"].includes(b.status))return NextResponse.json({error:"Invalid attendance status"},{status:400});
  const after=await db.$transaction(async tx=>{
   const x=await tx.attendanceRecord.update({where:{id},data:{status:b.status,remarks:b.remarks,markedAt:new Date(),markedBy:u.id}});
   if(before.status!==x.status)await tx.auditLog.create({data:{institutionId:u.institutionId!,actorUserId:u.id,userId:u.id,action:"ATTENDANCE_CORRECTED",entityType:"AttendanceRecord",entity:"AttendanceRecord",entityId:id,oldValue:{status:before.status},newValue:{status:x.status},reason:b.reason||"Attendance correction",timestamp:new Date(),ip:req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip"),userAgent:req.headers.get("user-agent"),deviceName:req.headers.get("sec-ch-ua-platform")||undefined}});
   await notifyAttendanceEvent(tx,{institutionId:u.institutionId!,studentId:before.studentId,status:x.status,date:before.session.date,actorUserId:u.id,correction:{oldStatus:before.status,newStatus:x.status,reason:b.reason||"Attendance correction"}});return x;
  });
  return NextResponse.json(after);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:400})}
}