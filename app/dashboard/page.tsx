import Link from "next/link";
import{getCurrentUser}from "@/lib/auth";
import{db}from "@/lib/db";

function todayRange(){
 const s=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date());
 return{start:new Date(s+"T00:00:00+05:30"),end:new Date(s+"T23:59:59.999+05:30")};
}
export default async function Dashboard(){
 const u=await getCurrentUser();
 if(!u)return <main className="p-10"><Link href="/login">Sign in</Link></main>;
 const id=u.institutionId;
 if(!id)return <main className="p-10">No institution is assigned to this account.</main>;
 const{start,end}=todayRange();
 const[students,teachers,classes,todayRecords,pendingLeaves,allRecords,recent]=await Promise.all([
  db.student.count({where:{institutionId:id,status:"ACTIVE"}}),
  db.teacher.count({where:{institutionId:id,status:"ACTIVE"}}),
  db.classLevel.count({where:{institutionId:id}}),
  db.attendanceRecord.findMany({where:{institutionId:id,session:{date:{gte:start,lte:end}}},select:{status:true}}),
  db.leaveRequest.count({where:{institutionId:id,status:"PENDING"}}),
  db.attendanceRecord.findMany({where:{institutionId:id},select:{studentId:true,status:true,session:{select:{latePolicy:true}}},take:100000}),
  db.auditLog.findMany({where:{institutionId:id},include:{actor:true},orderBy:{createdAt:"desc"},take:8})
 ]);
 const present=todayRecords.filter(x=>x.status==="PRESENT").length;
 const absent=todayRecords.filter(x=>x.status==="ABSENT").length;
 const late=todayRecords.filter(x=>x.status==="LATE").length;
 const byStudent=new Map<string,{total:number;earned:number}>();
 for(const r of allRecords){const x=byStudent.get(r.studentId)||{total:0,earned:0};x.total++;if(r.status==="PRESENT")x.earned++;if(r.status==="LATE"&&r.session.latePolicy==="PRESENT")x.earned++;if(r.status==="LATE"&&r.session.latePolicy==="HALF_DAY")x.earned+=.5;byStudent.set(r.studentId,x)}
 const low=[...byStudent.values()].filter(x=>x.total>0&&x.earned/x.total*100<75).length;
 const todayPct=todayRecords.length?Number((present/todayRecords.length*100).toFixed(2)):0;
 const cards=[[students,"Total Students"],[teachers,"Teachers"],[classes,"Classes"],[todayPct+"%","Today's Attendance"],[absent,"Absences"],[low,"Low Attendance"],[pendingLeaves,"Pending Leaves"]];
 return <main className="min-h-screen p-5 pb-24 md:p-8"><div className="mx-auto max-w-7xl"><header><p className="text-blue-300">{u.role}</p><h1 className="text-4xl font-black">Attendance dashboard</h1><p className="text-slate-400">@{u.username} • {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</p></header>
 <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([n,t])=><div className="card p-5" key={String(t)}><p className="text-slate-400">{t}</p><b className="text-3xl">{n}</b></div>)}</div>
 <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><div className="card p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Today's attendance</h2><p className="text-sm text-slate-400">Present {present} • Absent {absent} • Late {late}</p></div><span className="rounded-full bg-emerald-900 px-3 py-1 text-sm text-emerald-300">{todayPct}%</span></div><div className="mt-6 grid grid-cols-3 gap-3"><div className="rounded-xl bg-slate-900 p-4"><b>{present}</b><p className="text-xs text-slate-400">Present</p></div><div className="rounded-xl bg-slate-900 p-4"><b>{absent}</b><p className="text-xs text-slate-400">Absent</p></div><div className="rounded-xl bg-slate-900 p-4"><b>{late}</b><p className="text-xs text-slate-400">Late</p></div></div></div>
 <div className="card p-6"><h2 className="text-xl font-bold">Quick actions</h2><div className="mt-4 grid gap-2">{["attendance","students","teachers","timetable","leaves","reports","notifications"].map(x=><Link className="btn bg-slate-800 text-left" href={"/"+x} key={x}>{x.replace("-", " ").toUpperCase()}</Link>)}</div></div></div>
 <div className="card mt-6 p-6"><h2 className="text-xl font-bold">Recent activity</h2><div className="mt-4 space-y-3">{recent.map((x:any)=><div className="flex flex-wrap justify-between gap-2 border-b border-slate-800 pb-3" key={x.id}><span>{x.actor.username} • {x.action} • {x.entityType}</span><span className="text-xs text-slate-500">{new Date(x.createdAt).toLocaleString("en-IN")}</span></div>)}{!recent.length&&<p className="text-slate-400">No activity yet.</p>}</div></div>
 </div></main>
}