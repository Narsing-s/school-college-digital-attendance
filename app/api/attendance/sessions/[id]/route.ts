import{NextResponse}from"next/server";import{db}from"@/lib/db";import{requireUser}from"@/lib/auth";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const u=await requireUser();const{id}=await params;
  const s=await db.attendanceSession.findFirst({where:{id,institutionId:u.institutionId||""},include:{records:{include:{student:true}},section:{include:{classLevel:true}},class:true,subject:true,teacher:true}});
  if(!s)return NextResponse.json({error:"Not found"},{status:404});
  if(u.role==="STUDENT"){
   const student=await db.student.findFirst({where:{userId:u.id,institutionId:u.institutionId||""}});
   if(!student||!s.records.some(r=>r.studentId===student.id))return NextResponse.json({error:"Forbidden"},{status:403});
   return NextResponse.json({...s,records:s.records.filter(r=>r.studentId===student.id)});
  }
  if(u.role==="PARENT"){
   const links=await db.parentStudent.findMany({where:{parent:{userId:u.id,institutionId:u.institutionId||""}},select:{studentId:true}});
   const ids=new Set(links.map(x=>x.studentId));return NextResponse.json({...s,records:s.records.filter(r=>ids.has(r.studentId))});
  }
  if(!["ADMIN","PRINCIPAL","TEACHER"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
  if(u.role==="TEACHER"){
   const teacher=await db.teacher.findFirst({where:{userId:u.id,institutionId:u.institutionId||""}});
   const assignment=teacher?await db.teacherAssignment.findFirst({where:{institutionId:u.institutionId||"",teacherId:teacher.id,academicYearId:s.academicYearId,sectionId:s.sectionId,subjectId:s.subjectId||undefined}}):null;
   if(!teacher||!assignment)return NextResponse.json({error:"Forbidden"},{status:403});
  }
  return NextResponse.json(s);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unauthorized"},{status:401})}
}