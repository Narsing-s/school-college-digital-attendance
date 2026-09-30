import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";

export async function GET(req:Request){
  try{
    const u=await requireUser();
    if(!["ADMIN","PRINCIPAL","TEACHER"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
    if(!u.institutionId)return NextResponse.json({error:"No institution"},{status:400});
    const url=new URL(req.url);
    const from=url.searchParams.get("from");const to=url.searchParams.get("to");
    const where:any={institutionId:u.institutionId};
    if(u.role==="TEACHER"){const teacher=await db.teacher.findFirst({where:{userId:u.id,institutionId:u.institutionId},select:{id:true}});if(!teacher)return NextResponse.json({error:"Teacher profile not found"},{status:403});where.session={...(where.session||{}),teacherId:teacher.id};}
    if(from||to)where.session={date:{...(from?{gte:new Date(from)}:{}),...(to?{lte:new Date(to)}:{})}};
    const rows=await db.attendanceRecord.findMany({
      where,
      include:{student:true,session:{include:{subject:true,section:{include:{classLevel:true}},teacher:{include:{user:true}}}}},
      orderBy:{markedAt:"desc"},take:20000
    });
    const esc=(v:unknown)=>'"'+String(v??"").replaceAll('"','""')+'"';
    const header=["Date","Class","Section","Subject","Teacher","Admission Number","Roll Number","Student","Status","Marked At","Remarks"];
    const lines=[header.map(esc).join(",")];
    for(const r of rows){
      lines.push([
        new Date(r.session.date).toISOString().slice(0,10),
        r.session.section.classLevel.name,
        r.session.section.name,
        r.session.subject?.name||"",
        r.session.teacher?.user?.username||"",
        r.student.admissionNumber,
        r.student.rollNumber||"",
        [r.student.firstName,r.student.lastName||""].join(" ").trim(),
        r.status,
        new Date(r.markedAt).toISOString(),
        r.remarks||""
      ].map(esc).join(","));
    }
    return new NextResponse(lines.join("\n"),{status:200,headers:{"content-type":"text/csv; charset=utf-8","content-disposition":"attachment; filename=attendance-report.csv","cache-control":"no-store"}});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unauthorized"},{status:401})}
}