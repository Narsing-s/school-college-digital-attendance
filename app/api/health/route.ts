import {NextResponse} from "next/server";
export async function GET(){return NextResponse.json({status:"ok",database:"not-required",storage:"in-memory-demo",timestamp:new Date().toISOString()},{headers:{"cache-control":"no-store"}})}
