import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";

const STAFF=["ADMIN","PRINCIPAL","TEACHER"];
function overlaps(aStart:string,aEnd:string,bStart:string,bEnd:string){
  return aStart<bEnd && bStart<aEnd;
}
async function conflict(institutionId:string,academicYearId:string,sectionId:string,teacherId:string,dayOfWeek:number,startTime:string,endTime:string,excludeId?:string){
  const rows=await db.timetable.findMany({where:{institutionId,academicYearId,dayOfWeek,id:excludeId?{not:excludeId}:undefined,OR:[{sectionId},{teacherId}]},select:{id: true,sectionId:true,teacherId:true,startTime:true,endTime:true}});
  return rows.find(x=>overlaps(startTime,endTime,x.startTime,x.endTime) && (x.sectionId===sectionId||x.teacherId===teacherId));
}
export async function GET(){
  const u=await requireUser();
  if(!u.institutionId)return NextResponse.json({error:"No institution"},{status:400});
  return NextResponse.json(await db.timetable.findMany({where:{institutionId:u.institutionId},include:{section:{include:{classLevel:true}},subject:true,teacher:true,academicYear:true},orderBy:[{dayOfWeek:"asc"},{startTime:"asc"}]}));
}
export async function POST(req:Request){
  const u=await requireUser();
  if(!u.institutionId||!["ADMIN","PRINCIPAL"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
  const b=await req.json();
  if(!b.academicYearId||!b.sectionId||!b.subjectId||!b.teacherId||typeof b.dayOfWeek!=="number"||!b.startTime||!b.endTime||b.startTime>=b.endTime)return NextResponse.json({error:"Invalid timetable entry"},{status:400});
  const section=await db.section.findFirst({where:{id:b.sectionId,institutionId:u.institutionId},select:{id:true,classLevelId:true}});
  const teacher=await db.teacher.findFirst({where:{id:b.teacherId,institutionId:u.institutionId},select:{id:true}});
  const subject=await db.subject.findFirst({where:{id:b.subjectId,institutionId:u.institutionId},select:{id:true}});
  const year=await db.academicYear.findFirst({where:{id:b.academicYearId,institutionId:u.institutionId},select:{id:true}});
  if(!section||!teacher||!subject||!year)return NextResponse.json({error:"Invalid timetable references"},{status:400});
  const clash=await conflict(u.institutionId,b.academicYearId,b.sectionId,b.teacherId,b.dayOfWeek,b.startTime,b.endTime);
  if(clash)return NextResponse.json({error:"Timetable conflict: section or teacher already has an overlapping period"},{status:409});
  return NextResponse.json(await db.timetable.create({data:{institutionId:u.institutionId,academicYearId:b.academicYearId,sectionId:b.sectionId,subjectId:b.subjectId,teacherId:b.teacherId,dayOfWeek:b.dayOfWeek,startTime:b.startTime,endTime:b.endTime,room:b.room||null}}),{status:201});
}