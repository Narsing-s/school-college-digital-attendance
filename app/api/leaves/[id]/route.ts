import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const u=await requireUser();
    if(!u.institutionId||!["ADMIN","PRINCIPAL","TEACHER"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
    const {id}=await params; const b=await req.json();
    const before=await db.leaveRequest.findFirst({where:{id,institutionId:u.institutionId}});
    if(!before)return NextResponse.json({error:"Not found"},{status:404});
    if(!["PENDING","APPROVED","REJECTED","CANCELLED"].includes(b.status))return NextResponse.json({error:"Invalid leave status"},{status:400});
    if(u.role==="TEACHER"){
      const enrollment=await db.enrollment.findFirst({where:{institutionId:u.institutionId,studentId:before.studentId,status:"ACTIVE"}});
      const teacher=await db.teacher.findFirst({where:{userId:u.id,institutionId:u.institutionId}});
      if(!enrollment||!teacher)return NextResponse.json({error:"Teacher is not authorized for this student"},{status:403});
      const assigned=await db.teacherAssignment.findFirst({where:{institutionId:u.institutionId,teacherId:teacher.id,sectionId:enrollment.sectionId,academicYearId:enrollment.academicYearId}});
      if(!assigned)return NextResponse.json({error:"Teacher is not assigned to this student's section"},{status:403});
    }
    const row=await db.$transaction(async tx=>{
      const updated=await tx.leaveRequest.update({where:{id},data:{status:b.status,approvedBy:b.status==="APPROVED"||b.status==="REJECTED"?u.id:null,approvedAt:b.status==="APPROVED"||b.status==="REJECTED"?new Date():null}});
      if(b.status==="APPROVED"){
        const sessions=await tx.attendanceSession.findMany({where:{institutionId:u.institutionId!,date:{gte:before.fromDate,lte:before.toDate},section:{enrollments:{some:{studentId:before.studentId,status:"ACTIVE"}}}},select:{id:true}});
        for(const s of sessions) await tx.attendanceRecord.upsert({where:{sessionId_studentId:{sessionId:s.id,studentId:before.studentId}},create:{institutionId:u.institutionId!,sessionId:s.id,studentId:before.studentId,status:"LEAVE",markedBy:u.id,remarks:"Approved leave"},update:{status:"LEAVE",markedAt:new Date(),markedBy:u.id,remarks:"Approved leave"}});
      }
      await tx.auditLog.create({data:{institutionId:u.institutionId!,actorUserId:u.id,userId:u.id,action:"LEAVE_STATUS_CHANGED",entityType:"LeaveRequest",entity:"LeaveRequest",entityId:id,oldValue:{status:before.status},newValue:{status:updated.status},reason:b.reason||"Leave workflow",timestamp:new Date(),ip:req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip"),userAgent:req.headers.get("user-agent")}});
      return updated;
    });
    return NextResponse.json(row);
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:400})}
}