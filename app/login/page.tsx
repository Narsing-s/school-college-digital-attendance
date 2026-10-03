"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";

const LOCAL_USERS={
  admin:{password:"ChangeMe123!",role:"ADMIN"},
  teacher1:{password:"ChangeMe123!",role:"TEACHER"},
  student1:{password:"ChangeMe123!",role:"STUDENT"},
  parent1:{password:"ChangeMe123!",role:"PARENT"}
} as const;

type LocalUser=keyof typeof LOCAL_USERS;

export default function Login(){
  const [u,setU]=useState("");
  const [p,setP]=useState("");
  const [e,setE]=useState("");
  const [remember,setRemember]=useState(true);
  const r=useRouter();

  useEffect(()=>{
    try{
      const saved=localStorage.getItem("attendflow_session");
      if(saved){
        const s=JSON.parse(saved);
        if(s?.username) setU(s.username);
      }
    }catch{}
  },[]);

  async function go(x:React.FormEvent){
    x.preventDefault();
    setE("");
    const username=u.trim().toLowerCase();
    const local=LOCAL_USERS[username as LocalUser];

    if(!local || local.password!==p){
      setE("Invalid username or password");
      return;
    }

    // Persist the authenticated user locally. No database is required.
    const session={
      username,
      role:local.role,
      loggedIn:true,
      createdAt:Date.now()
    };

    if(remember) localStorage.setItem("attendflow_session",JSON.stringify(session));
    else localStorage.removeItem("attendflow_session");

    // Keep the existing server session when the API is available so
    // server-rendered dashboard/API routes continue to work.
    try{
      const q=await fetch("/api/auth/login",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({username,password:p})
      });
      if(!q.ok){
        const d=await q.json().catch(()=>({}));
        if(d?.error && q.status!==404) setE(d.error);
        else setE("Login service is unavailable");
        return;
      }
    }catch{
      setE("Login service is unavailable");
      return;
    }

    r.push("/dashboard");
  }

  return <main className="grid min-h-screen place-items-center p-6">
    <form onSubmit={go} className="card w-full max-w-md p-8">
      <h1 className="text-3xl font-black">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-400">Your login is kept locally on this device.</p>
      <input className="input mt-7" placeholder="Username" autoComplete="username" value={u} onChange={x=>setU(x.target.value)} required/>
      <input className="input mt-3" type="password" placeholder="Password" autoComplete="current-password" value={p} onChange={x=>setP(x.target.value)} required/>
      {e&&<p className="mt-3 text-red-300">{e}</p>}
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-400">
        <input type="checkbox" checked={remember} onChange={x=>setRemember(x.target.checked)}/>
        Keep me signed in on this device
      </label>
      <button className="btn mt-5 w-full bg-blue-500" type="submit">Sign in</button>
      <p className="mt-4 text-xs text-slate-500">Demo accounts: admin, teacher1, student1, parent1 — password: ChangeMe123!</p>
    </form>
  </main>
}