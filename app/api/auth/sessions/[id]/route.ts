import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";

export async function DELETE(_req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const u=await requireUser(); const {id}=await params;
    const row=await db.session.findFirst({where:{id,userId:u.id}});
    if(!row)return NextResponse.json({error:"Session not found"},{status:404});
    await db.session.delete({where:{id}});
    return NextResponse.json({ok:true});
  }catch(e){return NextResponse.json({error:"Unauthorized"},{status:401})}
}