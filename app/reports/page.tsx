"use client";
import{useEffect,useState}from"react";
import{BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,LineChart,Line,CartesianGrid}from"recharts";

type Option={id:string;name:string;code?:string;classLevel?:{name:string}|null};
export default function Reports(){
 const[d,setD]=useState<any>();const[period,setPeriod]=useState("monthly");const[from,setFrom]=useState("");const[to,setTo]=useState("");
 const[academicYears,setAcademicYears]=useState<Option[]>([]);const[classes,setClasses]=useState<Option[]>([]);const[sections,setSections]=useState<Option[]>([]);const[subjects,setSubjects]=useState<Option[]>([]);const[departments,setDepartments]=useState<Option[]>([]);const[teachers,setTeachers]=useState<any[]>([]);
 const[academicYearId,setAcademicYearId]=useState("");const[semester,setSemester]=useState("");const[classId,setClassId]=useState("");const[sectionId,setSectionId]=useState("");const[subjectId,setSubjectId]=useState("");const[departmentId,setDepartmentId]=useState("");const[teacherId,setTeacherId]=useState("");
 async function loadOptions(){
  const paths=["/api/academic-years","/api/classes","/api/sections","/api/subjects","/api/departments","/api/teachers"];
  const rs=await Promise.all(paths.map(p=>fetch(p).then(r=>r.ok?r.json():[]).catch(()=>[])));
  setAcademicYears(rs[0]);setClasses(rs[1]);setSections(rs[2]);setSubjects(rs[3]);setDepartments(rs[4]);setTeachers(rs[5]);
 }
 async function load(){
  const q=new URLSearchParams({period});if(from)q.set("from",from);if(to)q.set("to",to);if(academicYearId)q.set("academicYearId",academicYearId);if(semester)q.set("semester",semester);if(classId)q.set("classId",classId);if(sectionId)q.set("sectionId",sectionId);if(subjectId)q.set("subjectId",subjectId);if(departmentId)q.set("departmentId",departmentId);if(teacherId)q.set("teacherId",teacherId);
  const r=await fetch("/api/reports/attendance/detailed?"+q.toString());setD(await r.json());
 }
 useEffect(()=>{loadOptions();load()},[]);
 const exportQuery=()=>{const q=new URLSearchParams();if(from)q.set("from",from);if(to)q.set("to",to);if(sectionId)q.set("sectionId",sectionId);if(subjectId)q.set("subjectId",subjectId);if(teacherId)q.set("teacherId",teacherId);if(classId)q.set("classId",classId);return q}; const exportCsv=()=>window.open("/api/reports/attendance/export?"+exportQuery().toString(),"_blank"); const exportPdf=()=>window.open("/api/reports/attendance/pdf?"+exportQuery().toString(),"_blank");
 return <main className="p-5 pb-24 md:p-8"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-blue-300">REPORTS</p><h1 className="text-4xl font-black">Attendance analytics</h1><p className="text-slate-400">Daily, weekly, monthly, subject, semester and academic-year views.</p></div><div className="flex gap-2"><button className="btn bg-emerald-600" onClick={exportCsv}>EXPORT CSV</button><button className="btn bg-slate-700" onClick={exportPdf}>EXPORT PDF</button></div></div>
 <div className="card mt-6 grid gap-3 p-5 md:grid-cols-4">
  <label>Period<select className="input" value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">All</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
  <label>Academic year<select className="input" value={academicYearId} onChange={e=>setAcademicYearId(e.target.value)}><option value="">All</option>{academicYears.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
  <label>Semester<select className="input" value={semester} onChange={e=>setSemester(e.target.value)}><option value="">All</option><option value="1">Semester 1</option><option value="2">Semester 2</option></select></label>
  <label>Department<select className="input" value={departmentId} onChange={e=>setDepartmentId(e.target.value)}><option value="">All</option>{departments.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
  <label>Class<select className="input" value={classId} onChange={e=>setClassId(e.target.value)}><option value="">All</option>{classes.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
  <label>Section<select className="input" value={sectionId} onChange={e=>setSectionId(e.target.value)}><option value="">All</option>{sections.map(x=><option key={x.id} value={x.id}>{x.classLevel?.name} • {x.name}</option>)}</select></label>
  <label>Subject<select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">All</option>{subjects.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
  <label>Teacher<select className="input" value={teacherId} onChange={e=>setTeacherId(e.target.value)}><option value="">All</option>{teachers.map(x=><option key={x.id} value={x.id}>{x.name||x.user?.username||x.employeeId}</option>)}</select></label>
  <label>From<input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
  <label>To<input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
  <button className="btn bg-blue-600 md:col-span-2" onClick={load}>APPLY FILTERS</button>
 </div>
 {d&&<><div className="mt-7 grid gap-4 md:grid-cols-4"><div className="card p-5"><b>{d.summary.students}</b><p className="text-slate-400">Students</p></div><div className="card p-5"><b>{d.summary.below75}</b><p className="text-slate-400">Below 75%</p></div><div className="card p-5"><b>{d.summary.between75and80}</b><p className="text-slate-400">75–80%</p></div><div className="card p-5"><b>{d.summary.above80}</b><p className="text-slate-400">Above 80%</p></div></div>
 <div className="card mt-6 h-80 p-5"><ResponsiveContainer width="100%" height="100%"><LineChart data={d.trend||[]}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis/><Tooltip/><Line type="monotone" dataKey="present"/><Line type="monotone" dataKey="absent"/><Line type="monotone" dataKey="late"/></LineChart></ResponsiveContainer></div>
 <div className="card mt-6 h-72 p-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{name:"Below 75",value:d.summary.below75},{name:"75–80",value:d.summary.between75and80},{name:"Above 80",value:d.summary.above80}]}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="value"/></BarChart></ResponsiveContainer></div>
 <div className="card mt-6 overflow-auto p-5"><table className="w-full text-left"><thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Excused</th><th>Leave</th><th>Attendance</th></tr></thead><tbody>{d.students.map((x:any)=><tr className="border-t border-slate-800" key={x.student.id}><td className="py-3">{x.student.firstName} {x.student.lastName||""}</td><td>{x.present}</td><td>{x.absent}</td><td>{x.late}</td><td>{x.excused}</td><td>{x.leave}</td><td className={x.percentage<75?"text-red-300":""}>{x.percentage}%</td></tr>)}</tbody></table></div></>}</div></main>
}