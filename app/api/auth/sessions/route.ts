import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {createHash} from "crypto";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";

export async function GET(){
 const u=await requireUser();
 const token=(await cookies()).get("attendance_session")?.value;
 const current=token?createHash("sha256").update(token).digest("hex"):null;
 const sessions=await db.session.findMany({
  where:{userId:u.id},
  select:{id:true,createdAt:true,lastSeenAt:true,expiresAt:true,tokenHash:true},
  orderBy:{lastSeenAt:"desc"}
 });
 return NextResponse.json(sessions.map(x=>({...x,current:x.tokenHash===current,tokenHash:undefined})));
}

export async function DELETE(){
 const u=await requireUser();
 await db.session.deleteMany({where:{userId:u.id}});
 (await cookies()).delete("attendance_session");
 (await cookies()).delete("attendance_local_session");
 return NextResponse.json({ok:true});
}