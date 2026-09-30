import {db} from "@/lib/db";
type Tx = typeof db;
async function parentUserIds(tx:Tx,institutionId:string,studentId:string){
 const links=await tx.parentStudent.findMany({where:{studentId,parent:{institutionId}},include:{parent:{select:{userId:true}}}});
 return links.map(x=>x.parent.userId);
}
async function createMany(tx:Tx,institutionId:string,userIds:string[],type:string,title:string,message:string){
 const ids=[...new Set(userIds.filter(Boolean))];
 if(ids.length) await tx.notification.createMany({data:ids.map(userId=>({institutionId,userId,type,title,message}))});
}
export async function notifyAttendanceEvent(tx:Tx,args:{institutionId:string;studentId:string;status:"PRESENT"|"ABSENT"|"LATE"|"EXCUSED"|"LEAVE";date:Date;actorUserId:string;correction?:{oldStatus:string;newStatus:string;reason?:string}}){
 const student=await tx.student.findFirst({where:{id:args.studentId,institutionId:args.institutionId},select:{firstName:true,lastName:true}});
 if(!student)return;
 const name=[student.firstName,student.lastName].filter(Boolean).join(" ");
 const recipients=await parentUserIds(tx,args.institutionId,args.studentId);
 if(args.correction) await createMany(tx,args.institutionId,recipients,"ATTENDANCE_CORRECTION","Attendance corrected",name+" attendance changed from "+args.correction.oldStatus+" to "+args.correction.newStatus+" on "+args.date.toLocaleDateString("en-IN")+"."+(args.correction.reason?" "+args.correction.reason:""));
 else if(args.status==="ABSENT") await createMany(tx,args.institutionId,recipients,"ABSENCE","Attendance absence",name+" was marked absent on "+args.date.toLocaleDateString("en-IN")+".");
}
export async function notifyLeaveEvent(tx:Tx,args:{institutionId:string;studentId:string;status:"APPROVED"|"REJECTED"|"CANCELLED";reason?:string}){
 const student=await tx.student.findFirst({where:{id:args.studentId,institutionId:args.institutionId},select:{firstName:true,lastName:true}});
 if(!student)return;
 const recipients=await parentUserIds(tx,args.institutionId,args.studentId);
 const title=args.status==="APPROVED"?"Leave approved":args.status==="REJECTED"?"Leave rejected":"Leave cancelled";
 await createMany(tx,args.institutionId,recipients,"LEAVE_STATUS",title,[student.firstName,student.lastName].filter(Boolean).join(" ")+" leave request was "+args.status.toLowerCase()+"."+(args.reason?" Reason: "+args.reason:""));
}