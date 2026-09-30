import{NextResponse}from"next/server";import{db}from"@/lib/db";import{requireUser}from"@/lib/auth";

function validRange(from:string,to:string){const a=new Date(from),b=new Date(to);return !Number.isNaN(a.getTime())&&!Number.isNaN(b.getTime())&&a<=b&&a>=new Date("2000-01-01")}

export async function GET(){try{const u=await requireUser();const where:any={institutionId:u.institutionId||""};if(u.role==="STUDENT"){const s=await db.student.findFirst({where:{userId:u.id,institutionId:u.institutionId||""}});where.studentId=s?.id||"none"}else if(u.role==="PARENT"){const p=await db.parent.findFirst({where:{userId:u.id,institutionId:u.institutionId||""}});where.studentId={in:p?(await db.parentStudent.findMany({where:{parentId:p.id},select:{studentId:true}})).map(x=>x.studentId):[]}}return NextResponse.json(await db.leaveRequest.findMany({where,include:{student:true},orderBy:{createdAt:"desc"},take:200}))}catch{return NextResponse.json({error:"Unauthorized"},{status:401})}}

export async function POST(req:Request){try{
 const u=await requireUser();if(!u.institutionId)return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await req.json();if(!b.studentId||!validRange(b.fromDate,b.toDate)||!String(b.reason||"").trim())return NextResponse.json({error:"Valid dates and reason are required"},{status:400});
 const from=new Date(b.fromDate),to=new Date(b.toDate);from.setHours(0,0,0,0);to.setHours(23,59,59,999);
 const student=await db.student.findFirst({where:{id:b.studentId,institutionId:u.institutionId}});if(!student)return NextResponse.json({error:"Student not found"},{status:404});
 if(u.role==="STUDENT"&&student.userId!==u.id)return NextResponse.json({error:"You can only request leave for yourself"},{status:403});
 if(u.role==="PARENT"){const p=await db.parent.findFirst({where:{userId:u.id,institutionId:u.institutionId}});const link=p&&await db.parentStudent.findUnique({where:{parentId_studentId:{parentId:p.id,studentId:student.id}}});if(!link)return NextResponse.json({error:"Student is not linked to this parent"},{status:403})}
 if(!["STUDENT","PARENT","TEACHER","ADMIN","PRINCIPAL"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
 const overlap=await db.leaveRequest.findFirst({where:{institutionId:u.institutionId,studentId:student.id,status:{in:["PENDING","APPROVED"]},fromDate:{lte:to},toDate:{gte:from}}});
 if(overlap)return NextResponse.json({error:"Overlapping leave request already exists"},{status:409});
 const row=await db.leaveRequest.create({data:{institutionId:u.institutionId,studentId:student.id,fromDate:from,toDate:to,reason:String(b.reason).trim()}});
 return NextResponse.json(row,{status:201});
}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:400})}}