import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";
import {notifyLeaveEvent} from "@/lib/notifications/events";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const u=await requireUser();if(!u.institutionId)return NextResponse.json({error:"Unauthorized"},{status:401});
  const{id}=await params,b=await req.json();const before=await db.leaveRequest.findFirst({where:{id,institutionId:u.institutionId}});
  if(!before)return NextResponse.json({error:"Not found"},{status:404});
  const requested=String(b.status||"");
  if(!["PENDING","APPROVED","REJECTED","CANCELLED"].includes(requested))return NextResponse.json({error:"Invalid leave status"},{status:400});

  if(u.role==="STUDENT"||u.role==="PARENT"){
   if(requested!=="CANCELLED"||before.status!=="PENDING")return NextResponse.json({error:"Students and parents can only cancel pending leave requests"},{status:403});
   const student=await db.student.findFirst({where:{id:before.studentId,institutionId:u.institutionId}});
   if(!student)return NextResponse.json({error:"Student not found"},{status:404});
   if(u.role==="STUDENT"&&student.userId!==u.id)return NextResponse.json({error:"Forbidden"},{status:403});
   if(u.role==="PARENT"){const p=await db.parent.findFirst({where:{userId:u.id,institutionId:u.institutionId}});const link=p&&await db.parentStudent.findUnique({where:{parentId_studentId:{parentId:p.id,studentId:student.id}}});if(!link)return NextResponse.json({error:"Forbidden"},{status:403});}
  }else if(!["ADMIN","PRINCIPAL","TEACHER"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});

  if(u.role==="TEACHER"){
   const enrollment=await db.enrollment.findFirst({where:{institutionId:u.institutionId,studentId:before.studentId,status:"ACTIVE"}});
   const teacher=await db.teacher.findFirst({where:{userId:u.id,institutionId:u.institutionId}});
   if(!enrollment||!teacher)return NextResponse.json({error:"Teacher is not authorized for this student"},{status:403});
   const assigned=await db.teacherAssignment.findFirst({where:{institutionId:u.institutionId,teacherId:teacher.id,sectionId:enrollment.sectionId,academicYearId:enrollment.academicYearId}});
   if(!assigned)return NextResponse.json({error:"Teacher is not assigned to this student's section"},{status:403});
  }
  if(requested==="PENDING"&&before.status!=="PENDING")return NextResponse.json({error:"Only pending requests can be reopened"},{status:409});

  const row=await db.$transaction(async tx=>{
   const updated=await tx.leaveRequest.update({where:{id},data:{status:requested as any,approvedBy:requested==="APPROVED"||requested==="REJECTED"?u.id:null,approvedAt:requested==="APPROVED"||requested==="REJECTED"?new Date():null}});
   if(requested==="APPROVED"){
    const sessions=await tx.attendanceSession.findMany({where:{institutionId:u.institutionId!,date:{gte:before.fromDate,lte:before.toDate},section:{enrollments:{some:{studentId:before.studentId,status:"ACTIVE"}}}},select:{id:true}});
    for(const s of sessions)await tx.attendanceRecord.upsert({where:{sessionId_studentId:{sessionId:s.id,studentId:before.studentId}},create:{institutionId:u.institutionId!,sessionId:s.id,studentId:before.studentId,status:"LEAVE",markedBy:u.id,remarks:"Approved leave"},update:{status:"LEAVE",markedAt:new Date(),markedBy:u.id,remarks:"Approved leave"}});
   }
   if(requested==="CANCELLED"&&before.status==="APPROVED"){
    await tx.attendanceRecord.updateMany({where:{institutionId:u.institutionId!,studentId:before.studentId,status:"LEAVE",remarks:"Approved leave",session:{date:{gte:before.fromDate,lte:before.toDate}}},data:{status:"ABSENT",markedAt:new Date(),markedBy:u.id,remarks:"Leave cancelled; attendance requires review"}});
   }
   await tx.auditLog.create({data:{institutionId:u.institutionId!,actorUserId:u.id,userId:u.id,action:"LEAVE_STATUS_CHANGED",entityType:"LeaveRequest",entity:"LeaveRequest",entityId:id,oldValue:{status:before.status},newValue:{status:updated.status},reason:b.reason||"Leave workflow",timestamp:new Date(),ip:req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip"),userAgent:req.headers.get("user-agent")}});
   if(requested==="APPROVED"||requested==="REJECTED"||requested==="CANCELLED")await notifyLeaveEvent(tx,{institutionId:u.institutionId!,studentId:before.studentId,status:requested as "APPROVED"|"REJECTED"|"CANCELLED",reason:b.reason});
   return updated;
  });
  return NextResponse.json(row);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:400})}
}