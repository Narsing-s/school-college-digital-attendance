const attempts=new Map<string,{count:number;reset:number}>();
export function loginRateLimit(key:string){const now=Date.now();const current=attempts.get(key);if(!current||current.reset<now){attempts.set(key,{count:1,reset:now+15*60*1000});return {allowed:true,retryAfter:0}}current.count++;return {allowed:current.count<=10,retryAfter:Math.ceil((current.reset-now)/1000)}}
