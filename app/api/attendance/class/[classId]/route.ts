import{NextResponse}from"next/server";import{db}from"@/lib/db";import{requireUser}from"@/lib/auth";
export async function GET(_:Request,{params}:{params:Promise<{classId:string}>}){
 try{
  const u=await requireUser();if(!["ADMIN","PRINCIPAL","TEACHER"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
  const{classId}=await params;const cls=await db.classLevel.findFirst({where:{id:classId,institutionId:u.institutionId||""}});if(!cls)return NextResponse.json({error:"Class not found"},{status:404});
  let sectionIds=(await db.section.findMany({where:{classLevelId:classId,institutionId:u.institutionId||""},select:{id:true}})).map(x=>x.id);
  if(u.role==="TEACHER"){const teacher=await db.teacher.findFirst({where:{userId:u.id,institutionId:u.institutionId||""}});if(!teacher)return NextResponse.json({error:"Teacher profile not found"},{status:403});sectionIds=(await db.teacherAssignment.findMany({where:{institutionId:u.institutionId||"",teacherId:teacher.id,sectionId:{in:sectionIds}},select:{sectionId:true}})).map(x=>x.sectionId)}
  const rows=await db.attendanceRecord.findMany({where:{institutionId:u.institutionId||"",session:{sectionId:{in:sectionIds}}},include:{student:true,session:{include:{subject:true}}},orderBy:{markedAt:"desc"},take:500});
  return NextResponse.json(rows);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unauthorized"},{status:401})}
}