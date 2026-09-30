import{NextResponse}from"next/server";import{db}from"@/lib/db";import{requireUser}from"@/lib/auth";

function esc(s:string){return s.replace(/\\/g,"\\\\").replace(/\\(/g,"\\(").replace(/\\)/g,"\\)")}
function pdf(lines:string[]){const per=48,pages:string[][]=[];for(let i=0;i<lines.length;i+=per)pages.push(lines.slice(i,i+per));if(!pages.length)pages.push(["No attendance data"]);
const objects:string[]=[];objects.push("<< /Type /Catalog /Pages 2 0 R >>");const pageIds:number[]=[];const contentIds:number[]=[];let next=3;
for(let i=0;i<pages.length;i++){pageIds.push(next++);contentIds.push(next++);}
objects.push("<< /Type /Pages /Kids ["+pageIds.map(x=>x+" 0 R").join(" ")+"] /Count "+pages.length+" >>");
for(let i=0;i<pages.length;i++){objects[pageIds[i]-1]="<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 "+(next++)+" 0 R >> >> /Contents "+contentIds[i]+" 0 R >>";objects[contentIds[i]-1]="";}
// rebuild font object ids and page resources
const fontId=next-1;objects[fontId-1]="<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
for(let i=0;i<pages.length;i++){const stream=["BT","/F1 9 Tf","40 760 Td",...pages[i].map((l,j)=>j===0?"("+esc(l)+") Tj":"0 -14 Td ("+esc(l)+") Tj"),"ET"].join("\n");objects[contentIds[i]-1]="<< /Length "+Buffer.byteLength(stream)+" >>\nstream\n"+stream+"\nendstream";objects[pageIds[i]-1]="<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 "+fontId+" 0 R >> >> /Contents "+contentIds[i]+" 0 R >>";}
let out="%PDF-1.4\n",offsets:number[]=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(out));out+=(i+1)+" 0 obj\n"+objects[i]+"\nendobj\n";}const x=Buffer.byteLength(out);out+="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";for(let i=1;i<offsets.length;i++)out+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";out+="trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+x+"\n%%EOF";return Buffer.from(out,"binary")}

export async function GET(req:Request){try{
 const u=await requireUser();if(!u.institutionId||!["ADMIN","PRINCIPAL","TEACHER"].includes(u.role))return NextResponse.json({error:"Forbidden"},{status:403});
 const url=new URL(req.url),from=url.searchParams.get("from"),to=url.searchParams.get("to"),sectionId=url.searchParams.get("sectionId"),subjectId=url.searchParams.get("subjectId"),teacherId=url.searchParams.get("teacherId"),studentId=url.searchParams.get("studentId");
 const sessionWhere:any={institutionId:u.institutionId};if(sectionId)sessionWhere.sectionId=sectionId;if(subjectId)sessionWhere.subjectId=subjectId;if(studentId){}if(from||to)sessionWhere.date={...(from?{gte:new Date(from)}:{}),...(to?{lte:new Date(to+"T23:59:59.999Z")}: {})};
 if(u.role==="TEACHER"){const t=await db.teacher.findFirst({where:{userId:u.id,institutionId:u.institutionId},select:{id:true}});if(!t)return NextResponse.json({error:"Teacher profile not found"},{status:403});sessionWhere.teacherId=t.id}else if(teacherId)sessionWhere.teacherId=teacherId;
 const rows=await db.attendanceRecord.findMany({where:{institutionId:u.institutionId,studentId:studentId||undefined,session:sessionWhere},include:{student:true,session:{include:{subject:true,section:{include:{classLevel:true}},teacher:true}}},orderBy:[{session:{date:"asc"}},{student:{rollNumber:"asc"}}],take:5000});
 const lines=["AttendFlow Attendance Report","Generated: "+new Date().toLocaleString("en-IN"),"Records: "+rows.length,"","Date | Class | Section | Subject | Student | Roll | Status"];
 for(const r of rows)lines.push(new Date(r.session.date).toLocaleDateString("en-IN")+" | "+(r.session.section.classLevel?.name||"-")+" | "+r.session.section.name+" | "+(r.session.subject?.name||"-")+" | "+[r.student.firstName,r.student.lastName].filter(Boolean).join(" ")+" | "+(r.student.rollNumber||"-")+" | "+r.status);
 const body=pdf(lines);return new NextResponse(body,{status:200,headers:{"content-type":"application/pdf","content-disposition":"attachment; filename=attendance-report.pdf","cache-control":"no-store"}});
}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Report failed"},{status:400})}}