import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
 const u=await requireUser();
 if(!["ADMIN","PRINCIPAL","TEACHER"].includes(u.role)) return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await params;
 const s=await db.attendanceSession.findFirst({where:{id,institutionId:u.institutionId||""}});
 if(!s) return NextResponse.json({error:"Not found"},{status:404});
 return NextResponse.json(await db.attendanceSession.update({where:{id},data:{status:"CLOSED",endTime:new Date().toISOString().slice(11,16)}}));
}