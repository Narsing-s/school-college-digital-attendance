import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";
import {subjectSchema} from "@/lib/master-data/validation";
export async function GET(){const u=await requireUser();if(!u.institutionId)return NextResponse.json({error:"No institution"},{status:400});return NextResponse.json(await db.subject.findMany({where:{institutionId:u.institutionId},include:{department:true,classLevel:true}}))}
export async function POST(req:Request){
 const u=await requireUser();if(!u.institutionId||!["ADMIN","PRINCIPAL"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
 try{const b=subjectSchema.parse(await req.json());const refs=await Promise.all([b.classLevelId?db.classLevel.findFirst({where:{id:b.classLevelId,institutionId:u.institutionId}}):null,b.departmentId?db.department.findFirst({where:{id:b.departmentId,institutionId:u.institutionId}}):null]);if((b.classLevelId&&!refs[0])||(b.departmentId&&!refs[1]))return NextResponse.json({error:"Invalid subject references"},{status:400});const x=await db.subject.create({data:{institutionId:u.institutionId,...b}});await db.auditLog.create({data:{institutionId:u.institutionId,actorUserId:u.id,userId:u.id,action:"CREATE",entityType:"Subject",entity:"Subject",entityId:x.id,newValue:b,reason:"Subject created"}});return NextResponse.json(x,{status:201})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid subject data"},{status:400})}
}