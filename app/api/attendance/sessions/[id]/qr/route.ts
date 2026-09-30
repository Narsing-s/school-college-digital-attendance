import{NextResponse}from"next/server";import{createHmac}from"crypto";import{requireUser}from"@/lib/auth";import{db}from"@/lib/db";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const u=await requireUser();if(!["ADMIN","PRINCIPAL","TEACHER"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
  const{id}=await params;const s=await db.attendanceSession.findFirst({where:{id,institutionId:u.institutionId||""}});
  if(!s)return NextResponse.json({error:"Not found"},{status:404});
  if(s.status==="CLOSED")return NextResponse.json({error:"Attendance session is closed"},{status:409});
  if(u.role==="TEACHER"){const teacher=await db.teacher.findFirst({where:{userId:u.id,institutionId:u.institutionId||""}});const assignment=teacher?await db.teacherAssignment.findFirst({where:{institutionId:u.institutionId||"",teacherId:teacher.id,academicYearId:s.academicYearId,sectionId:s.sectionId,subjectId:s.subjectId||undefined}}):null;if(!teacher||!assignment)return NextResponse.json({error:"Forbidden"},{status:403})}
  const secret=process.env.SESSION_SECRET;if(!secret)return NextResponse.json({error:"SESSION_SECRET missing"},{status:500});
  const exp=Date.now()+120000;const raw=Buffer.from(JSON.stringify({sessionId:id,exp})).toString("base64url");
  return NextResponse.json({token:raw+"."+createHmac("sha256",secret).update(id+"."+exp).digest("hex"),expiresAt:new Date(exp).toISOString()});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:400})}
}