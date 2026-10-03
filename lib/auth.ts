import {cookies} from "next/headers";
import {randomBytes} from "crypto";
import {db} from "./db";

type Role="SUPER_ADMIN"|"ADMIN"|"PRINCIPAL"|"TEACHER"|"STUDENT"|"PARENT";
export async function createSession(userId:string){
 const user=await db.user.findUnique({where:{id:userId}});
 if(!user) throw new Error("USER_NOT_FOUND");
 const token=randomBytes(24).toString("hex");
 (await cookies()).set("attendance_session",JSON.stringify({userId:user.id,token,exp:Date.now()+2592000000}),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:2592000});
}
export async function getCurrentUser(){
 const raw=(await cookies()).get("attendance_session")?.value;
 if(!raw)return null;
 try{
  const s=JSON.parse(raw);
  if(!s.userId||s.exp<Date.now())return null;
  const u=await db.user.findUnique({where:{id:s.userId}});
  return u&&u.status==="ACTIVE"?u:null;
 }catch{return null}
}
export async function requireUser(){const u=await getCurrentUser();if(!u)throw new Error("AUTHENTICATION_REQUIRED");return u;}
export async function logout(){(await cookies()).delete("attendance_session");}
