import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";
import {sectionSchema} from "@/lib/master-data/validation";

export async function GET(){
 const u=await requireUser();
 if(!u.institutionId) return NextResponse.json({error:"No institution"},{status:400});
 return NextResponse.json(await db.section.findMany({where:{institutionId:u.institutionId},include:{classLevel:true,enrollments:{include:{student:true}}}}));
}

export async function POST(req:Request){
 const u=await requireUser();
 if(!u.institutionId||!["ADMIN","PRINCIPAL"].includes(u.role)) return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const b=sectionSchema.parse(await req.json());
  const cls=await db.classLevel.findFirst({where:{id:b.classLevelId,institutionId:u.institutionId}});
  if(!cls) return NextResponse.json({error:"Invalid class"},{status:400});
  const x=await db.section.create({data:{institutionId:u.institutionId,classLevelId:b.classLevelId,name:b.name,capacity:b.capacity}});
  await db.auditLog.create({data:{institutionId:u.institutionId,actorUserId:u.id,userId:u.id,action:"CREATE",entityType:"Section",entity:"Section",entityId:x.id,newValue:b,reason:"Section created"}});
  return NextResponse.json(x,{status:201});
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:"Invalid section data"},{status:400});
 }
}