const DB="attendflow-offline";const STORE="queue";const MAX_RETRIES=8;
type QueueItem={id?:number;operationId:string;payload:any;createdAt:number;attempts:number;nextRetryAt:number;status:"QUEUED"|"SYNCING"|"CONFLICT"|"FAILED"};
function open(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,2);r.onupgradeneeded=()=>{const db=r.result;let s=db.objectStoreNames.contains(STORE)?r.transaction!.objectStore(STORE):db.createObjectStore(STORE,{keyPath:"id",autoIncrement:true});if(!s.indexNames.contains("operationId"))s.createIndex("operationId","operationId",{unique:true});if(!s.indexNames.contains("nextRetryAt"))s.createIndex("nextRetryAt","nextRetryAt",{unique:false})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function uid(){return crypto.randomUUID()}
export async function queueAttendance(payload:any){
 const database=await open();const item:QueueItem={operationId:uid(),payload,createdAt:Date.now(),attempts:0,nextRetryAt:Date.now(),status:"QUEUED"};
 await new Promise((resolve,reject)=>{const tx=database.transaction(STORE,"readwrite");tx.objectStore(STORE).add(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
 return item.operationId;
}
async function all():Promise<QueueItem[]>{const database=await open();return new Promise((resolve,reject)=>{const tx=database.transaction(STORE,"readonly");const r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function update(id:number,data:Partial<QueueItem>){const database=await open();await new Promise((resolve,reject)=>{const tx=database.transaction(STORE,"readwrite");const s=tx.objectStore(STORE);const r=s.get(id);r.onsuccess=()=>{const next={...r.result,...data};s.put(next);};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function remove(id:number){const database=await open();await new Promise((resolve,reject)=>{const tx=database.transaction(STORE,"readwrite");tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
export async function getOfflineSyncStatus(){const items=await all();return{queued:items.filter(x=>x.status==="QUEUED"||x.status==="SYNCING").length,conflicts:items.filter(x=>x.status==="CONFLICT").length,failed:items.filter(x=>x.status==="FAILED").length}}
export async function syncAttendance(){
 if(!navigator.onLine)return getOfflineSyncStatus();
 const items=await all();
 for(const item of items){
  if(!item.id||item.nextRetryAt>Date.now()||item.status==="CONFLICT")continue;
  await update(item.id,{status:"SYNCING"});
  try{
   const r=await fetch("/api/attendance/sessions/"+item.payload.sessionId+"/records",{method:"POST",headers:{"content-type":"application/json","x-client-operation-id":item.operationId},body:JSON.stringify({records:item.payload.records,clientOperationId:item.operationId})});
   if(r.ok){await remove(item.id);continue}
   if(r.status===409){await update(item.id,{status:"CONFLICT"});continue}
   const attempts=item.attempts+1;if(attempts>=MAX_RETRIES){await update(item.id,{status:"FAILED",attempts});continue}
   await update(item.id,{status:"QUEUED",attempts,nextRetryAt:Date.now()+Math.min(300000,1000*Math.pow(2,attempts))});
  }catch{
   const attempts=item.attempts+1;if(attempts>=MAX_RETRIES)await update(item.id,{status:"FAILED",attempts});else await update(item.id,{status:"QUEUED",attempts,nextRetryAt:Date.now()+Math.min(300000,1000*Math.pow(2,attempts))});
  }
 }
 return getOfflineSyncStatus();
}