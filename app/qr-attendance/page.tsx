"use client";
import{useEffect,useRef,useState}from"react";

export default function QRAttendance(){
 const video=useRef<HTMLVideoElement>(null);
 const stream=useRef<MediaStream|null>(null);
 const runningRef=useRef(false);
 const[token,setToken]=useState("");
 const[msg,setMsg]=useState("");
 const[running,setRunning]=useState(false);

 async function scan(value=token){
  if(!value){setMsg("Scan or enter a QR token.");return}
  try{
   const r=await fetch("/api/attendance/qr/scan",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:value})});
   const d=await r.json();setMsg(r.ok?"Attendance recorded successfully.":d.error||"QR attendance failed");if(r.ok)stop();
  }catch{setMsg("Unable to connect.")}
 }
 async function start(){
  try{
   if(!("BarcodeDetector" in window)){setMsg("Camera QR scanning is not supported by this browser. Use the paste-token fallback below.");return}
   const Detector:any=(window as any).BarcodeDetector;
   const detector=new Detector({formats:["qr_code"]});
   const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});
   stream.current=s;runningRef.current=true;setRunning(true);
   if(video.current){video.current.srcObject=s;await video.current.play()}
   const loop=async()=>{
    if(!runningRef.current||!video.current)return;
    try{
     const codes=await detector.detect(video.current);
     const value=codes?.[0]?.rawValue;
     if(value){setToken(value);await scan(value);return}
    }catch{}
    if(runningRef.current)requestAnimationFrame(loop);
   };
   requestAnimationFrame(loop);
  }catch{setMsg("Camera permission was denied or unavailable.")}
 }
 function stop(){
  runningRef.current=false;
  stream.current?.getTracks().forEach(t=>t.stop());
  stream.current=null;
  setRunning(false);
 }
 useEffect(()=>()=>stop(),[]);
 return <main className="min-h-screen p-5 pb-24 md:p-8"><div className="mx-auto max-w-xl"><div className="card overflow-hidden"><div className="p-6"><p className="text-blue-300">STUDENT QR ATTENDANCE</p><h1 className="text-3xl font-black">Scan attendance QR</h1><p className="mt-2 text-slate-400">Your signed-in student account is authenticated before the attendance is recorded. Codes expire automatically.</p></div>{running&&<video ref={video} className="aspect-square w-full bg-black object-cover" muted playsInline/>}<div className="p-6"><div className="grid gap-2 md:grid-cols-2"><button className="btn bg-blue-600" onClick={running?stop:start}>{running?"STOP CAMERA":"OPEN CAMERA"}</button><button className="btn bg-emerald-600" onClick={()=>scan()}>MARK PRESENT</button></div><input className="input mt-4" placeholder="Paste scanned QR token if camera is unavailable" value={token} onChange={e=>setToken(e.target.value)}/>{msg&&<p className="mt-4 text-sm text-slate-300">{msg}</p>}</div></div></div></main>
}