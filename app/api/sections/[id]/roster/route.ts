import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const u=await requireUser();
    if(!u.institutionId)return NextResponse.json({error:"No institution"},{status:400});
    const {id}=await params;
    const section=await db.section.findFirst({where:{id,institutionId:u.institutionId},include:{classLevel:true}});
    if(!section)return NextResponse.json({error:"Section not found"},{status:404});
    const academicYear=await db.academicYear.findFirst({where:{institutionId:u.institutionId,isCurrent:true}});
    if(!academicYear)return NextResponse.json({error:"No current academic year"},{status:404});
    const enrollments=await db.enrollment.findMany({where:{institutionId:u.institutionId,sectionId:id,academicYearId:academicYear.id,status:"ACTIVE"},include:{student:true},orderBy:{rollNumber:"asc"}});
    return NextResponse.json({section,academicYear,students:enrollments.map(e=>({...e.student,rollNumber:e.rollNumber||e.student.rollNumber}))});
  }catch(e){return NextResponse.json({error:"Unauthorized"},{status:401})}
}