import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";
import {z} from "zod";

const studentSchema=z.object({
  admissionNumber:z.string().trim().min(1).max(50),
  rollNumber:z.string().trim().max(30).optional().nullable(),
  firstName:z.string().trim().min(1).max(100),
  lastName:z.string().trim().max(100).optional().nullable(),
  dateOfBirth:z.coerce.date().optional().nullable(),
  gender:z.string().trim().max(30).optional().nullable(),
  email:z.string().email().optional().nullable(),
  phone:z.string().trim().max(30).optional().nullable(),
  guardianName:z.string().trim().max(120).optional().nullable(),
  guardianPhone:z.string().trim().max(30).optional().nullable()
});
const canManage=(role:string)=>["ADMIN","PRINCIPAL"].includes(role);
export async function GET(){const u=await requireUser();if(!u.institutionId)return NextResponse.json({error:"No institution"},{status:400});return NextResponse.json(await db.student.findMany({where:{institutionId:u.institutionId},orderBy:{firstName:"asc"}}))}
export async function POST(req:Request){
 const u=await requireUser();if(!u.institutionId||!canManage(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
 try{const b=studentSchema.parse(await req.json());const x=await db.student.create({data:{institutionId:u.institutionId,...b}});await db.auditLog.create({data:{institutionId:u.institutionId,actorUserId:u.id,userId:u.id,action:"CREATE",entityType:"Student",entity:"Student",entityId:x.id,newValue:b,reason:"Student created"}});return NextResponse.json(x,{status:201})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid student data"},{status:400})}
}