"use client";
import {useEffect,useState} from "react";
export default function PwaInstall(){
 const[deferred,setDeferred]=useState<any>(null);const[installed,setInstalled]=useState(false);
 useEffect(()=>{const onBefore=(e:Event)=>{e.preventDefault();setDeferred(e)};const onInstalled=()=>{setInstalled(true);setDeferred(null)};window.addEventListener("beforeinstallprompt",onBefore);window.addEventListener("appinstalled",onInstalled);return()=>{window.removeEventListener("beforeinstallprompt",onBefore);window.removeEventListener("appinstalled",onInstalled)}},[]);
 if(installed||!deferred)return null;
 return <button className="fixed bottom-20 right-4 z-50 rounded-full bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-xl" onClick={async()=>{const e=deferred;await e.prompt();await e.userChoice;setDeferred(null)}}>INSTALL ATTENDFLOW</button>
}
