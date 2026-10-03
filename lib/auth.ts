import {cookies} from "next/headers";
import {randomBytes} from "crypto";
import {db} from "./db";

const LOCAL_COOKIE="attendance_local_session";
const SESSION_MS=2592000000;

function encode(value:unknown){return encodeURIComponent(JSON.stringify(value));}
function decode(value:string){try{return JSON.parse(decodeURIComponent(value));}catch{return null;}}

export async function createSession(userId:string){
  const user=await db.user.findUnique({where:{id:userId}});
  if(!user) throw new Error("USER_NOT_FOUND");
  const token=randomBytes(24).toString("hex");
  (await cookies()).set("attendance_session",JSON.stringify({userId:user.id,token,exp:Date.now()+SESSION_MS}),{
    httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:2592000
  });
}

export async function createLocalSession(username:string,role:string){
  (await cookies()).set(LOCAL_COOKIE,encode({username,role,exp:Date.now()+SESSION_MS}),{
    httpOnly:false,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:2592000
  });
}

export async function getCurrentUser(){
  const c=await cookies();
  const raw=c.get("attendance_session")?.value;
  if(raw){
    try{
      const s=JSON.parse(raw);
      if(s?.userId && s.exp>Date.now()){
        const u=await db.user.findUnique({where:{id:s.userId}});
        if(u&&u.status==="ACTIVE") return u;
      }
    }catch{}
  }

  const local=c.get(LOCAL_COOKIE)?.value;
  if(local){
    const s=decode(local);
    if(s?.username && s.exp>Date.now()){
      const u=await db.user.findUnique({where:{username:String(s.username)}});
      if(u&&u.status==="ACTIVE") return u;
    }
  }
  return null;
}

export async function requireUser(){
  const u=await getCurrentUser();
  if(!u) throw new Error("AUTHENTICATION_REQUIRED");
  return u;
}

export async function logout(){
  const c=await cookies();
  c.delete("attendance_session");
  c.delete(LOCAL_COOKIE);
}