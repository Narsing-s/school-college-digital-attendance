"use client";
import {useEffect,useState} from "react";

export default function Sessions(){
 const [rows,setRows]=useState<any[]>([]);
 const [m,setM]=useState("");
 async function load(){const r=await fetch("/api/auth/sessions");if(r.ok)setRows(await r.json())}
 useEffect(()=>{load()},[]);
 async function revoke(id:string){await fetch("/api/auth/sessions/"+id,{method:"DELETE"});setM("Session revoked.");load()}
 async function revokeAll(){await fetch("/api/auth/sessions",{method:"DELETE"});setM("All sessions revoked.");setRows([])}
 return <main className="min-h-screen p-5 pb-24 md:p-8">
  <div className="mx-auto max-w-3xl">
   <div className="flex items-center justify-between gap-4"><div><p className="text-blue-300">SECURITY</p><h1 className="text-4xl font-black">Devices & sessions</h1></div><button className="btn bg-red-700" onClick={revokeAll}>Sign out all devices</button></div>
   <div className="mt-6 space-y-3">
    {rows.map(x=><div className="card flex items-center justify-between gap-4 p-5" key={x.id}><div><p className="font-bold">{x.current?"Current device":"Signed-in device"}</p><p className="text-sm text-slate-400">Created {new Date(x.createdAt).toLocaleString("en-IN")}</p><p className="text-sm text-slate-500">Last seen {new Date(x.lastSeenAt).toLocaleString("en-IN")}</p></div>{!x.current&&<button className="btn bg-slate-700" onClick={()=>revoke(x.id)}>Revoke</button>}</div>)}
    {m&&<p className="text-sm text-slate-300">{m}</p>}
   </div>
  </div>
 </main>;
}