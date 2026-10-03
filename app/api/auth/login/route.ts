import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {db,DEMO_CREDENTIALS} from "@/lib/db";
import {createSession} from "@/lib/auth";
import {loginSchema} from "@/lib/validation";
import {loginRateLimit} from "@/lib/rate-limit";

export async function POST(req:Request){
 try{
  const b=loginSchema.parse(await req.json());
  const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  const limit=loginRateLimit(ip+":"+b.username.toLowerCase());
  if(!limit.allowed)return NextResponse.json({error:"Too many login attempts. Try again later."},{status:429,headers:{"retry-after":String(limit.retryAfter)}});
  const u=await db.user.findUnique({where:{username:b.username}});
  const demoOk=b.password===DEMO_CREDENTIALS.password && ["admin","teacher1","student1","parent1"].includes(b.username.toLowerCase());
  if(!u||u.status!=="ACTIVE"||(!demoOk && !(u.passwordHash&&await bcrypt.compare(b.password,u.passwordHash))))return NextResponse.json({error:"Invalid username or password"},{status:401});
  await createSession(u.id);
  await db.user.update({where:{id:u.id},data:{lastLoginAt:new Date()}});
  return NextResponse.json({ok:true,role:u.role});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:400})}
}
