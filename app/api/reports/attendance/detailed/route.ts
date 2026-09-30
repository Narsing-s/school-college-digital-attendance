import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {requireUser} from "@/lib/auth";

function startOfDay(d:Date){const x=new Date(d);x.setHours(0,0,0,0);return x}
function endOfDay(d:Date){const x=new Date(d);x.setHours(23,59,59,999);return x}

export async function GET(req:Request){
  try{
    const u=await requireUser();
    if(!u.institutionId)return NextResponse.json({error:"No institution"},{status:400});
    const url=new URL(req.url);
    const period=url.searchParams.get("period")||"all";
    const academicYearId=url.searchParams.get("academicYearId")||"";
    const semester=url.searchParams.get("semester")||"";
    const subjectId=url.searchParams.get("subjectId")||"";
    const classId=url.searchParams.get("classId")||"";
    const sectionId=url.searchParams.get("sectionId")||"";
    const departmentId=url.searchParams.get("departmentId")||"";
    const teacherId=url.searchParams.get("teacherId")||"";
    const studentId=url.searchParams.get("studentId")||"";
    let from=url.searchParams.get("from")?startOfDay(new Date(url.searchParams.get("from")!)):undefined;
    let to=url.searchParams.get("to")?endOfDay(new Date(url.searchParams.get("to")!)):undefined;

    if(period!=="all"&&!from&&!to){
      const now=new Date();
      if(period==="daily"){from=startOfDay(now);to=endOfDay(now)}
      if(period==="weekly"){const d=startOfDay(now);const day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));from=d;const e=new Date(d);e.setDate(e.getDate()+6);to=endOfDay(e)}
      if(period==="monthly"){from=new Date(now.getFullYear(),now.getMonth(),1);to=endOfDay(new Date(now.getFullYear(),now.getMonth()+1,0))}
    }

    const sessionWhere:any={institutionId:u.institutionId};
    if(academicYearId)sessionWhere.academicYearId=academicYearId;
    if(subjectId)sessionWhere.subjectId=subjectId;
    if(sectionId)sessionWhere.sectionId=sectionId;
    if(teacherId)sessionWhere.teacherId=teacherId;
    if(from||to)sessionWhere.date={...(from?{gte:from}:{}),...(to?{lte:to}:{})};
    if(classId||departmentId)sessionWhere.section={...(sectionId?{}:{}),classLevel:{...(classId?{id:classId}:{}),...(departmentId?{departmentId}: {})}};

    if(semester&&academicYearId){
      const ay=await db.academicYear.findFirst({where:{id:academicYearId,institutionId:u.institutionId}});
      if(ay){
        const midpoint= new Date((ay.startDate.getTime()+ay.endDate.getTime())/2);
        sessionWhere.date=semester==="1"?{gte:ay.startDate,lte:midpoint}:{gt:midpoint,lte:ay.endDate};
      }
    }

    const rows=await db.attendanceRecord.findMany({
      where:{institutionId:u.institutionId,studentId:studentId||undefined,session:sessionWhere},
      include:{student:true,session:{include:{subject:true,section:{include:{classLevel:{include:{department:true}}}},teacher:true}}},
      orderBy:[{session:{date:"desc"}},{markedAt:"desc"}],
      take:10000
    });

    const byStudent=new Map<string,any>();
    for(const r of rows){
      let x=byStudent.get(r.studentId);
      if(!x){x={student:r.student,total:0,present:0,absent:0,late:0,excused:0,leave:0,earned:0};byStudent.set(r.studentId,x)}
      x.total++;
      if(r.status==="PRESENT"){x.present++;x.earned+=1}
      if(r.status==="ABSENT")x.absent++;
      if(r.status==="LATE"){
        x.late++;
        if(r.session.latePolicy==="PRESENT")x.earned+=1;
        if(r.session.latePolicy==="HALF_DAY")x.earned+=0.5;
      }
      if(r.status==="EXCUSED")x.excused++;
      if(r.status==="LEAVE")x.leave++;
    }

    const students=[...byStudent.values()].map(x=>({...x,percentage:x.total?Number((x.earned/x.total*100).toFixed(2)):0}));
    const trendMap=new Map<string,{date:string,present:number,absent:number,late:number,excused:number,leave:number,total:number}>();
    for(const r of rows){
      const date=new Date(r.session.date).toISOString().slice(0,10);
      const t=trendMap.get(date)||{date,present:0,absent:0,late:0,excused:0,leave:0,total:0};
      t.total++;
      if(r.status==="PRESENT")t.present++;
      if(r.status==="ABSENT")t.absent++;
      if(r.status==="LATE")t.late++;
      if(r.status==="EXCUSED")t.excused++;
      if(r.status==="LEAVE")t.leave++;
      trendMap.set(date,t);
    }
    return NextResponse.json({
      filters:{period,academicYearId,semester,subjectId,classId,sectionId,departmentId,teacherId,studentId,from:from?.toISOString()||null,to:to?.toISOString()||null},
      students,
      trend:[...trendMap.values()].sort((a,b)=>a.date.localeCompare(b.date)),
      summary:{records:rows.length,students:students.length,below75:students.filter(x=>x.percentage<75).length,between75and80:students.filter(x=>x.percentage>=75&&x.percentage<80).length,above80:students.filter(x=>x.percentage>=80).length}
    });
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unauthorized"},{status:401})}
}