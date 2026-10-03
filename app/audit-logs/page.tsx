"use client";
import {useEffect,useState} from "react";

export default function AuditLogs(){
 const [rows,setRows]=useState<any[]>([]);
 useEffect(()=>{fetch("/api/audit-logs").then(r=>r.json()).then(setRows)},[]);
 return <main className="p-5 pb-24 md:p-8">
  <div className="mx-auto max-w-7xl">
   <p className="text-blue-300">AUDIT LOGS</p>
   <h1 className="text-4xl font-black">Recent activity</h1>
   <div className="mt-6 space-y-3">
    {rows.map(x=><div className="card p-5" key={x.id}>
     <div className="flex flex-wrap justify-between gap-2"><b>{x.action} · {x.entityType}</b><span className="text-xs text-slate-500">{new Date(x.createdAt).toLocaleString()}</span></div>
     <p className="mt-2 text-slate-300">{x.reason||"No reason recorded"}</p>
     <p className="mt-2 text-xs text-slate-500">Actor: {x.actor?.username||x.actorUserId} · Device: {x.deviceName||x.userAgent||"Unknown"} · IP: {x.ip||"Unknown"}</p>
    </div>)}
   </div>
  </div>
 </main>;
}