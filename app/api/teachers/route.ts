import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";
import {z} from "zod";

const schema=z.object({username:z.string().trim().min(3).max(80).regex(/^[A-Za-z0-9._-]+$/),password:z.string().min(8).max(128),email:z.string().email().optional().nullable(),employeeId:z.string().trim().min(1).max(40),name:z.string().trim().min(1).max(120),phone:z.string().trim().max(30).optional().nullable(),departmentId:z.string().optional().nullable()});
export async function GET(){const u=await requireUser();if(!u.institutionId)return NextResponse.json({error:"No institution"},{status:400});return NextResponse.json(await db.teacher.findMany({where:{institutionId:u.institutionId},include:{user:true,department:true}}))}
export async function POST(req:Request){
 const u=await requireUser();if(!u.institutionId||!["ADMIN","PRINCIPAL"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
 try{const b=schema.parse(await req.json());if(b.departmentId&&!(await db.department.findFirst({where:{id:b.departmentId,institutionId:u.institutionId}})))return NextResponse.json({error:"Invalid department"},{status:400});
  const passwordHash=await bcrypt.hash(b.password,12);
  const created=await db.$transaction(async tx=>{const user=await tx.user.create({data:{institutionId:u.institutionId,email:b.email||null,username:b.username,passwordHash,role:"TEACHER"}});const teacher=await tx.teacher.create({data:{institutionId:u.institutionId,userId:user.id,employeeId:b.employeeId,name:b.name,email:b.email||null,phone:b.phone||null,departmentId:b.departmentId||null}});await tx.auditLog.create({data:{institutionId:u.institutionId,actorUserId:u.id,userId:user.id,action:"CREATE",entityType:"Teacher",entity:"Teacher",entityId:teacher.id,newValue:{employeeId:b.employeeId,name:b.name,email:b.email||null,departmentId:b.departmentId||null},reason:"Teacher created"}});return teacher});
  return NextResponse.json(created,{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid teacher data"},{status:400})}
}