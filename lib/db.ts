/* In-memory demo data layer — no database, Prisma, or D1 required.
 * Data lives for the lifetime of the running server/Worker instance.
 * It is intentionally designed so existing API routes keep their Prisma-like
 * call shape while the product remains fully usable for demos and previews.
 */
import { randomUUID } from "crypto";

type Row = Record<string, any>;
type ModelName = string;

const now = new Date();
const iso = (s:string) => new Date(s);
const id = (prefix:string) => `${prefix}_${randomUUID().replace(/-/g,"").slice(0,12)}`;

const institution = {id:"inst_demo",name:"Demo School & College",code:"DEMO",type:"SCHOOL",timezone:"Asia/Kolkata",minAttendancePercent:75,latePolicy:"SEPARATE",createdAt:now,updatedAt:now};
const academicYear = {id:"year_2026_27",institutionId:institution.id,name:"2026-27",startDate:iso("2026-06-01T00:00:00+05:30"),endDate:iso("2027-05-31T23:59:59+05:30"),isCurrent:true};
const department = {id:"dept_sci",institutionId:institution.id,name:"Science & Mathematics",code:"SCI",status:"ACTIVE"};
const classLevel = {id:"class_10",institutionId:institution.id,departmentId:department.id,name:"Class 10",code:"C10",type:"SCHOOL"};
const section = {id:"section_10a",institutionId:institution.id,classLevelId:classLevel.id,name:"A",capacity:60};
const math = {id:"sub_math",institutionId:institution.id,classLevelId:classLevel.id,departmentId:department.id,code:"MATH10",name:"Mathematics",credits:5};
const science = {id:"sub_science",institutionId:institution.id,classLevelId:classLevel.id,departmentId:department.id,code:"SCI10",name:"Science",credits:5};

const users: Row[] = [
 {id:"user_admin",institutionId:institution.id,username:"admin",email:"admin@example.com",emailVerifiedAt:now,passwordHash:"DEMO_PASSWORD",role:"ADMIN",status:"ACTIVE",createdAt:now,updatedAt:now,lastLoginAt:null},
 {id:"user_teacher",institutionId:institution.id,username:"teacher1",email:"teacher@example.com",emailVerifiedAt:now,passwordHash:"DEMO_PASSWORD",role:"TEACHER",status:"ACTIVE",createdAt:now,updatedAt:now,lastLoginAt:null},
 {id:"user_student",institutionId:institution.id,username:"student1",email:"student1@example.com",emailVerifiedAt:now,passwordHash:"DEMO_PASSWORD",role:"STUDENT",status:"ACTIVE",createdAt:now,updatedAt:now,lastLoginAt:null},
 {id:"user_parent",institutionId:institution.id,username:"parent1",email:"parent1@example.com",emailVerifiedAt:now,passwordHash:"DEMO_PASSWORD",role:"PARENT",status:"ACTIVE",createdAt:now,updatedAt:now,lastLoginAt:null},
];

const students: Row[] = Array.from({length:10},(_,i)=>({
 id:`student_${i+1}`,institutionId:institution.id,userId:i===0?"user_student":null,
 admissionNumber:`ADM${String(i+1).padStart(3,"0")}`,rollNumber:String(i+1),
 firstName:["Rahul","Priya","Arjun","Sneha","Kiran","Ananya","Ravi","Meena","Vikram","Pooja"][i],
 lastName:"Demo",dob:null,dateOfBirth:null,gender:null,email:i===0?"student1@example.com":null,phone:null,
 guardianName:i===0?"Demo Parent":"Guardian",guardianPhone:null,status:"ACTIVE"
}));

const teacher={id:"teacher_1",institutionId:institution.id,userId:"user_teacher",employeeId:"T001",name:"Suresh Kumar",email:"teacher@example.com",departmentId:department.id,phone:"9000000001",status:"ACTIVE"};
const parent={id:"parent_1",institutionId:institution.id,userId:"user_parent",phone:"9000000000"};
const parentStudent={parentId:parent.id,studentId:students[0].id,relationship:"Parent"};
const enrollments: Row[] = students.map(s=>({id:`enroll_${s.id}`,institutionId:institution.id,academicYearId:academicYear.id,studentId:s.id,sectionId:section.id,rollNumber:s.rollNumber,status:"ACTIVE"}));
const assignments=[{id:"assign_math",institutionId:institution.id,academicYearId:academicYear.id,teacherId:teacher.id,subjectId:math.id,sectionId:section.id}];
const timetables=[
 {id:"tt_math",institutionId:institution.id,academicYearId:academicYear.id,sectionId:section.id,subjectId:math.id,teacherId:teacher.id,dayOfWeek:1,startTime:"09:00",endTime:"10:00",room:"Room 101"},
 {id:"tt_science",institutionId:institution.id,academicYearId:academicYear.id,sectionId:section.id,subjectId:science.id,teacherId:teacher.id,dayOfWeek:1,startTime:"10:00",endTime:"11:00",room:"Room 101"}
];
const session={id:"session_demo",institutionId:institution.id,academicYearId:academicYear.id,classId:classLevel.id,sectionId:section.id,subjectId:math.id,teacherId:teacher.id,date:iso("2026-09-30T09:00:00+05:30"),startTime:"09:00",endTime:"10:00",method:"MANUAL",status:"OPEN",latePolicy:"SEPARATE",createdBy:"user_admin",createdAt:now};
const statuses=["PRESENT","PRESENT","ABSENT","PRESENT","PRESENT","LATE","PRESENT","PRESENT","EXCUSED","PRESENT"];
const attendanceRecords: Row[] = students.map((s,i)=>({id:`record_${i+1}`,institutionId:institution.id,sessionId:session.id,studentId:s.id,status:statuses[i],markedAt:session.date,updatedAt:session.date,markedBy:teacher.userId,remarks:null}));
const stores: Record<ModelName,Row[]> = {
 institution:[institution], campus:[], academicYear:[academicYear], department:[department], classLevel:[classLevel],
 section:[section], subject:[math,science], user:users, student:students, teacher:[teacher], parent:[parent],
 parentStudent:[parentStudent], enrollment:enrollments, teacherAssignment:assignments, timetable:timetables,
 attendanceSession:[session], attendanceRecord:attendanceRecords, leaveRequest:[], notification:[], auditLog:[],
 session:[], emailVerificationToken:[], passwordResetToken:[], attendanceSyncOperation:[], academicCalendarDay:[]
};

const singular=(name:string)=>name.charAt(0).toLowerCase()+name.slice(1);
const foreignKeys: Record<string,Record<string,[string,string]>>={
 campus:{institution:["institutionId","id"],academicYears:["id","campusId"]},
 academicYear:{institution:["institutionId","id"],campus:["campusId","id"],enrollments:["id","academicYearId"],assignments:["id","academicYearId"],timetables:["id","academicYearId"],sessions:["id","academicYearId"],calendarDays:["id","academicYearId"]},
 department:{institution:["institutionId","id"],classes:["id","departmentId"],subjects:["id","departmentId"],teachers:["id","departmentId"]},
 classLevel:{institution:["institutionId","id"],department:["departmentId","id"],sections:["id","classLevelId"],subjects:["id","classLevelId"],attendanceSessions:["id","classId"]},
 section:{institution:["institutionId","id"],classLevel:["classLevelId","id"],enrollments:["id","sectionId"],assignments:["id","sectionId"],timetables:["id","sectionId"],sessions:["id","sectionId"]},
 subject:{institution:["institutionId","id"],classLevel:["classLevelId","id"],department:["departmentId","id"],assignments:["id","subjectId"],timetables:["id","subjectId"],sessions:["id","subjectId"]},
 user:{institution:["institutionId","id"],student:["id","userId"],teacher:["id","userId"],parent:["id","userId"],notifications:["id","userId"],auditLogs:["id","actorUserId"],sessions:["id","userId"],passwordResetTokens:["id","userId"],emailVerificationTokens:["id","userId"]},
 student:{institution:["institutionId","id"],user:["userId","id"],enrollments:["id","studentId"],attendanceRecords:["id","studentId"],leaves:["id","studentId"],parents:["id","studentId"]},
 teacher:{institution:["institutionId","id"],user:["userId","id"],department:["departmentId","id"],assignments:["id","teacherId"],timetables:["id","teacherId"],sessions:["id","teacherId"]},
 parent:{institution:["institutionId","id"],user:["userId","id"],students:["id","parentId"]},
 parentStudent:{parent:["parentId","id"],student:["studentId","id"]},
 enrollment:{institution:["institutionId","id"],academicYear:["academicYearId","id"],student:["studentId","id"],section:["sectionId","id"]},
 teacherAssignment:{institution:["institutionId","id"],academicYear:["academicYearId","id"],teacher:["teacherId","id"],subject:["subjectId","id"],section:["sectionId","id"]},
 timetable:{institution:["institutionId","id"],academicYear:["academicYearId","id"],section:["sectionId","id"],subject:["subjectId","id"],teacher:["teacherId","id"]},
 attendanceSession:{institution:["institutionId","id"],academicYear:["academicYearId","id"],class:["classId","id"],section:["sectionId","id"],subject:["subjectId","id"],teacher:["teacherId","id"],records:["id","sessionId"]},
 attendanceRecord:{institution:["institutionId","id"],session:["sessionId","id"],student:["studentId","id"]},
 leaveRequest:{institution:["institutionId","id"],student:["studentId","id"]},
 notification:{institution:["institutionId","id"],user:["userId","id"]},
 auditLog:{institution:["institutionId","id"],actor:["actorUserId","id"]},
 session:{user:["userId","id"]},emailVerificationToken:{user:["userId","id"]},passwordResetToken:{user:["userId","id"]},
 attendanceSyncOperation:{institution:["institutionId","id"],session:["sessionId","id"]},
 academicCalendarDay:{institution:["institutionId","id"],academicYear:["academicYearId","id"]}
};

function related(model:string,row:Row,name:string){
 const map=foreignKeys[model]?.[name]; if(!map) return undefined;
 const [local,remote]=map; const target=stores[name.slice(0,-1)] || stores[name] || [];
 if(Array.isArray(target)) return target.filter(x=>x[remote]===row[local]);
 return undefined;
}
function relation(model:string,row:Row,name:string){
 const map=foreignKeys[model]?.[name]; if(!map) return undefined;
 const [local,remote]=map;
 if(name.endsWith("s")) return related(model,row,name);
 const targetModel=name;
 const target=stores[targetModel]||[];
 return target.find(x=>x[remote]===row[local]);
}
function getValue(model:string,row:Row,key:string){
 if(key in row) return row[key];
 if(foreignKeys[model]?.[key]) return relation(model,row,key);
 return undefined;
}
function matches(model:string,row:Row,where:any):boolean{
 if(!where) return true;
 if(where.AND && !where.AND.every((x:any)=>matches(model,row,x))) return false;
 if(where.OR && !where.OR.some((x:any)=>matches(model,row,x))) return false;
 if(where.NOT && matches(model,row,where.NOT)) return false;
 for(const [key,rawCond] of Object.entries(where)){\n   const cond:any=rawCond;
   if(["AND","OR","NOT"].includes(key)) continue;
   const v=getValue(model,row,key);
   if(cond && typeof cond==="object" && !Array.isArray(cond) && !(cond instanceof Date)){
     if("in" in cond && !(cond as any).in.includes(v)) return false;
     if("notIn" in cond && (cond as any).notIn.includes(v)) return false;
     if("equals" in cond && v!==cond.equals) return false;
     if("not" in cond && v===cond.not) return false;
     if("contains" in cond && !String(v??"").includes(String(cond.contains))) return false;
     if("startsWith" in cond && !String(v??"").startsWith(String(cond.startsWith))) return false;
     if("gte" in cond && !(v>=cond.gte)) return false;
     if("lte" in cond && !(v<=cond.lte)) return false;
     if("gt" in cond && !(v>cond.gt)) return false;
     if("lt" in cond && !(v<cond.lt)) return false;
     if(!("in" in cond||"notIn" in cond||"equals" in cond||"not" in cond||"contains" in cond||"startsWith" in cond||"gte" in cond||"lte" in cond||"gt" in cond||"lt" in cond)){
       if(!v || !matches(key,v,cond)) return false;
     }
   } else if(v!==cond) return false;
 }
 return true;
}
function project(model:string,row:Row,args:any){
 let result={...row};
 if(args?.select){
   result={};
   for(const [k,on] of Object.entries(args.select)) if(on) result[k]=getValue(model,row,k);
 }
 if(args?.include){
   for(const [k,on] of Object.entries(args.include)) if(on) result[k]=Array.isArray(relation(model,row,k))?relation(model,row,k):relation(model,row,k);
   for(const [k,on] of Object.entries(args.include)){
     if(on && typeof on==="object"){
       const v=result[k];
       if(Array.isArray(v)) result[k]=v.map(x=>project(k.slice(0,-1),x,on));
       else if(v) result[k]=project(k,v,on);
     }
   }
 }
 return result;
}
function keyMatches(model:string,row:Row,where:any){
 if(where?.id) return row.id===where.id;
 const uniqueMap:Record<string,string[]>={user:["username"],institution:["code"],student:["id","admissionNumber"],academicYear:["id","institutionId","name"],department:["id","institutionId","code"],classLevel:["id","institutionId","code"],section:["id","classLevelId","name"],subject:["id","institutionId","code"],teacher:["id","institutionId","employeeId"],parent:["id","userId"],parentStudent:["parentId","studentId"],enrollment:["id","academicYearId","studentId"],teacherAssignment:["id","academicYearId","teacherId","subjectId","sectionId"],attendanceRecord:["id","sessionId","studentId"],attendanceSyncOperation:["id","operationId"]};
 const fields=uniqueMap[model]||[];
 for(const f of fields) if(f in where && row[f]!==where[f]) return false;
 return fields.some(f=>f in where);
}
function makeModel(model:string){
 const rows=()=>stores[model]||(stores[model]=[]);
 return {
  findMany: async (args:any={})=>{
   let r=rows().filter(x=>matches(model,x,args.where));
   if(args.orderBy){
     const orders=Array.isArray(args.orderBy)?args.orderBy:[args.orderBy];
     for(const o of orders.reverse()) { const [k,v]=Object.entries(o)[0] as any; r.sort((a,b)=>getValue(model,a,k)>getValue(model,b,k)?(v==="desc"?-1:1):(getValue(model,a,k)<getValue(model,b,k)?(v==="desc"?1:-1):0)); }
   }
   if(args.skip) r=r.slice(args.skip); if(args.take) r=r.slice(0,args.take);
   return r.map(x=>project(model,x,args));
  },
  findFirst: async (args:any={})=>{const r=(await (makeModel(model) as any).findMany({...args,take:1}));return r[0]||null;},
  findUnique: async (args:any={})=>{const r=rows().find(x=>keyMatches(model,x,args.where));return r?project(model,r,args):null;},
  create: async (args:any)=>{const x={id:id(model),createdAt:now,updatedAt:now,...args.data};rows().push(x);return project(model,x,args);},
  createMany: async (args:any)=>{for(const d of args.data||[])rows().push({id:id(model),createdAt:now,updatedAt:now,...d});return {count:(args.data||[]).length};},
  update: async (args:any)=>{const x=rows().find(x=>keyMatches(model,x,args.where));if(!x)throw new Error(`${model} not found`);Object.assign(x,args.data,{updatedAt:new Date()});return project(model,x,args);},
  updateMany: async (args:any)=>{let count=0;for(const x of rows())if(matches(model,x,args.where)){Object.assign(x,args.data,{updatedAt:new Date()});count++;}return {count};},
  delete: async (args:any)=>{const i=rows().findIndex(x=>keyMatches(model,x,args.where));if(i<0)throw new Error(`${model} not found`);return rows().splice(i,1)[0];},
  deleteMany: async (args:any={})=>{const before=rows().length;stores[model]=rows().filter(x=>!matches(model,x,args.where));return {count:before-stores[model].length};},
  upsert: async (args:any)=>{const found=rows().find(x=>keyMatches(model,x,args.where));if(found){Object.assign(found,args.update||{}, {updatedAt:new Date()});return project(model,found,args);}return (makeModel(model) as any).create({data:args.create,...args});
  },
  count: async (args:any={})=>rows().filter(x=>matches(model,x,args.where)).length,
  aggregate: async (args:any={})=>({ _count:{_all:rows().filter(x=>matches(model,x,args.where)).length} })
 };
}
export const db:any = new Proxy({}, {get(_target,property){if(property==="$transaction")return async(input:any)=>typeof input==="function"?input(db):Promise.all(input);if(property==="$queryRaw")return async()=>[{ok:1}];if(property==="$disconnect")return async()=>{};return makeModel(String(property));}});
export const DEMO_CREDENTIALS={username:"admin",password:"ChangeMe123!",roles:["ADMIN","TEACHER","STUDENT","PARENT"]};
