"use client";
import {useEffect,useState} from "react";
export default function Notifications(){
 const[rows,setRows]=useState<any[]>([]);
 async function load(){const r=await fetch("/api/notifications");if(r.ok)setRows(await r.json())}
 useEffect(()=>{load()},[]);
 async function read(id:string){await fetch("/api/notifications/"+id,{method:"PATCH"});setRows(x=>x.map(n=>n.id===id?{...n,readAt:new Date().toISOString()}:n))}
 return <main className="min-h-screen p-5 pb-24 md:p-8"><div className="mx-auto max-w-3xl"><h1 className="text-4xl font-black">Notifications</h1><div className="mt-6 space-y-3">{rows.map(n=><button onClick={()=>read(n.id)} className={"card block w-full p-5 text-left "+(!n.readAt?"border-blue-500":"")} key={n.id}><div className="flex items-start justify-between gap-4"><div><p className="font-bold">{n.title}</p><p className="mt-1 text-slate-400">{n.message}</p></div><span className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString("en-IN")}</span></div></button>)}{!rows.length&&<div className="card p-8 text-center text-slate-400">No notifications.</div>}</div></div></main>
}