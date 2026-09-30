import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";
import {classSchema} from "@/lib/master-data/validation";
export async function GET(){const u=await requireUser();if(!u.institutionId)return NextResponse.json({error:"No institution"},{status:400});return NextResponse.json(await db.classLevel.findMany({where:{institutionId:u.institutionId},include:{department:true,sections:true,subjects:true}}))}
export async function POST(req:Request){
 const u=await requireUser();if(!u.institutionId||!["ADMIN","PRINCIPAL"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
 try{const b=classSchema.parse(await req.json());if(b.departmentId&&!(await db.department.findFirst({where:{id:b.departmentId,institutionId:u.institutionId}})))return NextResponse.json({error:"Invalid department"},{status:400});const x=await db.classLevel.create({data:{institutionId:u.institutionId,name:b.name,code:b.code,type:b.type||"SCHOOL",departmentId:b.departmentId||null}});await db.auditLog.create({data:{institutionId:u.institutionId,actorUserId:u.id,userId:u.id,action:"CREATE",entityType:"ClassLevel",entity:"Class",entityId:x.id,newValue:{name:x.name,code:x.code,departmentId:x.departmentId},reason:"Class created"}});return NextResponse.json(x,{status:201})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid class data"},{status:400})}
}