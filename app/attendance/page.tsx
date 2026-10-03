"use client";
import {useEffect,useState} from "react";
import {saveOrQueue} from "@/app/attendance/attendance-client";
import {syncAttendance,getOfflineSyncStatus,listOfflineConflicts,retryOfflineConflict,discardOfflineConflict} from "@/lib/offline-attendance";

type Student={id:string;firstName:string;lastName?:string|null;rollNumber?:string|null};
type Section={id:string;name:string;classLevel?:{name:string}|null};
type Subject={id:string;name:string;code?:string};
const statuses=["PRESENT","ABSENT","LATE","EXCUSED","LEAVE"];

export default function Attendance(){
 const [sections,setSections]=useState<Section[]>([]);
 const [subjects,setSubjects]=useState<Subject[]>([]);
 const [sectionId,setSectionId]=useState("");
 const [subjectId,setSubjectId]=useState("");
 const [rows,setRows]=useState<{student:Student;status:string}[]>([]);
 const [session,setSession]=useState("");
 const [meta,setMeta]=useState<any>(null);
 const [msg,setMsg]=useState("");
 const [conflicts,setConflicts]=useState<any[]>([]);
 const [loading,setLoading]=useState(false);
 const [online,setOnline]=useState(true);
 const [sync,setSync]=useState({queued:0,conflicts:0,failed:0});

 useEffect(()=>{
  setOnline(navigator.onLine);
  const on=()=>{setOnline(true);syncAttendance().then(getOfflineSyncStatus).then(s=>{setSync(s);listOfflineConflicts().then(setConflicts).catch(()=>{})}).catch(()=>{})};
  const off=()=>setOnline(false);
  window.addEventListener("online",on);window.addEventListener("offline",off);
  Promise.all([fetch("/api/sections"),fetch("/api/subjects")]).then(async([a,b])=>{if(a.ok)setSections(await a.json());if(b.ok)setSubjects(await b.json())});
  syncAttendance().then(getOfflineSyncStatus).then(setSync).catch(()=>{});
  return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off)};
 },[]);

 useEffect(()=>{
  if(!sectionId){setRows([]);setMeta(null);return}
  setLoading(true);
  fetch("/api/sections/"+sectionId+"/roster").then(async r=>{
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Roster failed");
   setMeta(d);localStorage.setItem("attendance-roster-"+sectionId,JSON.stringify(d));
   const saved=localStorage.getItem("attendance-draft-"+sectionId);
   setRows(saved?JSON.parse(saved):d.students.map((student:Student)=>({student,status:"PRESENT"})));
  }).catch(e=>{
   const cached=localStorage.getItem("attendance-roster-"+sectionId);
   if(cached){const d=JSON.parse(cached);setMeta(d);const saved=localStorage.getItem("attendance-draft-"+sectionId);setRows(saved?JSON.parse(saved):d.students.map((student:Student)=>({student,status:"PRESENT"})));setMsg("Offline: using the saved roster.")}
   else setMsg(e.message);
  }).finally(()=>setLoading(false));
 },[sectionId]);

 function setStatus(id:string,status:string){
  const n=rows.map(x=>x.student.id===id?{...x,status}:x);
  setRows(n);localStorage.setItem("attendance-draft-"+sectionId,JSON.stringify(n));
 }

 async function create(){
  if(!sectionId||!meta?.academicYear?.id){setMsg("Select a section.");return}
  const r=await fetch("/api/attendance/sessions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({academicYearId:meta.academicYear.id,sectionId,subjectId:subjectId||undefined,date:new Date().toISOString(),method:"MANUAL"})});
  const d=await r.json();if(!r.ok){setMsg(d.error||"Could not create session");return}
  setSession(d.id);setMsg("Attendance session created.");
 }

 async function save(){
  if(!session){await create();return}
  const ok=await saveOrQueue(session,rows.map(x=>({studentId:x.student.id,status:x.status})));
  setMsg(ok?"Attendance saved successfully.":online?"Server unavailable. Attendance queued for sync.":"Offline: attendance saved on this device and will sync automatically.");
  if(ok)localStorage.removeItem("attendance-draft-"+sectionId);
  syncAttendance().then(getOfflineSyncStatus).then(setSync).catch(()=>{});
 }

 const counts=Object.fromEntries(statuses.map(s=>[s,rows.filter(x=>x.status===s).length]));

 return <main className="min-h-screen p-4 pb-24 md:p-8">
  <div className="mx-auto max-w-5xl">
   <div className="card overflow-hidden">
    <div className="border-b border-slate-700 p-5">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-blue-300">TEACHER • ATTENDANCE</p><h1 className="text-3xl font-black">Take attendance</h1><p className="text-slate-400">{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</p></div>
      <span className={"rounded-full px-3 py-1 text-xs "+(online?"bg-emerald-900 text-emerald-300":"bg-amber-900 text-amber-300")}>{online?"ONLINE":"OFFLINE • QUEUING"}</span>
     </div>
     <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400"><span>Queued: {sync.queued}</span><span>Conflicts: {sync.conflicts}</span><span>Failed: {sync.failed}</span></div>
     {conflicts.length>0&&<div className="mt-4 rounded-xl border border-amber-700 bg-amber-950/40 p-3 text-sm"><b>Offline conflicts need review.</b><div className="mt-2 space-y-2">{conflicts.map(x=><div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/60 p-2" key={x.id}><span>Attendance changed elsewhere · {x.operationId.slice(0,8)}…</span><span className="flex gap-2"><button className="rounded-lg bg-blue-700 px-3 py-1" onClick={async()=>{const s=await retryOfflineConflict(x.id);setSync(s);setConflicts(await listOfflineConflicts())}}>Keep my changes</button><button className="rounded-lg bg-slate-700 px-3 py-1" onClick={async()=>{const s=await discardOfflineConflict(x.id);setSync(s);setConflicts(await listOfflineConflicts())}}>Keep server</button></span></div>)}</div></div>}
    </div>
    <div className="grid gap-3 p-5 md:grid-cols-2">
     <label>Section<select className="input" value={sectionId} onChange={e=>{setSectionId(e.target.value);setSession("")}}><option value="">Select section</option>{sections.map(s=><option key={s.id} value={s.id}>{s.classLevel?.name||"Class"} • {s.name}</option>)}</select></label>
     <label>Subject<select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Select subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    </div>
    {sectionId&&<><div className="grid grid-cols-2 gap-2 px-5 md:grid-cols-5">{statuses.map(s=><div className="rounded-xl bg-slate-900 p-3" key={s}><b>{counts[s]}</b><p className="text-xs text-slate-400">{s}</p></div>)}</div>
     <div className="p-5">
      <button className="btn mb-4 bg-slate-700" onClick={()=>{const n=rows.map(x=>({...x,status:"PRESENT"}));setRows(n);localStorage.setItem("attendance-draft-"+sectionId,JSON.stringify(n))}}>MARK ALL PRESENT</button>
      {loading?<p>Loading roster…</p>:<div className="space-y-2">{rows.map((r,i)=><div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl bg-slate-900 p-3" key={r.student.id}><span className="text-slate-500">{r.student.rollNumber||i+1}</span><span>{r.student.firstName} {r.student.lastName||""}</span><select className="rounded-lg bg-slate-800 p-2" value={r.status} onChange={e=>setStatus(r.student.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>)}</div>}
      <div className="mt-5 grid gap-2 md:grid-cols-2"><button className="btn bg-blue-600" onClick={create} disabled={!!session}>{session?"SESSION CREATED":"CREATE SESSION"}</button><button className="btn bg-emerald-600" onClick={save}>{online?"SAVE ATTENDANCE":"SAVE OFFLINE"}</button></div>
      {session&&<p className="mt-3 text-xs text-slate-400">Session: {session}</p>}{msg&&<p className="mt-3 text-sm text-slate-300">{msg}</p>}
     </div>
    </>}
   </div>
  </div>
 </main>;
}