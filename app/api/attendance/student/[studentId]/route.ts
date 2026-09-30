import{NextResponse}from"next/server";import{db}from"@/lib/db";import{requireUser}from"@/lib/auth";
export async function GET(_:Request,{params}:{params:Promise<{studentId:string}>}){
 try{
  const u=await requireUser();const{studentId}=await params;
  const student=await db.student.findFirst({where:{id:studentId,institutionId:u.institutionId||""}});
  if(!student)return NextResponse.json({error:"Student not found"},{status:404});
  if(u.role==="STUDENT"&&student.userId!==u.id)return NextResponse.json({error:"Forbidden"},{status:403});
  if(u.role==="PARENT"){
   const linked=await db.parentStudent.findFirst({where:{studentId, parent:{userId:u.id,institutionId:u.institutionId||""}}});
   if(!linked)return NextResponse.json({error:"Forbidden"},{status:403});
  }
  const rows=await db.attendanceRecord.findMany({where:{studentId,institutionId:u.institutionId||""},include:{session:{include:{subject:true,section:{include:{classLevel:true}}}}},orderBy:{markedAt:"desc"}});
  return NextResponse.json(rows);
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unauthorized"},{status:401})}
}