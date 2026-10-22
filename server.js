/* Minimal zero-dependency demo server for adult-only OpenAI Realtime test. Node 20+. */
'use strict';
const http=require('node:http');const path=require('node:path');const fs=require('node:fs');const crypto=require('node:crypto');
const PORT=Number(process.env.PORT||3000);const HOST=process.env.HOST||'127.0.0.1';
const DEMO_PASSWORD=process.env.DEMO_ACCESS_PASSWORD||'';
if(HOST!=='127.0.0.1' && !DEMO_PASSWORD){console.error('DEMO_ACCESS_PASSWORD required when binding publicly.');process.exit(1)}
function credentialOK(req){if(!DEMO_PASSWORD)return true;const auth=req.headers.authorization||'';if(!auth.startsWith('Basic '))return false;let decoded='';try{decoded=Buffer.from(auth.slice(6),'base64').toString('utf8')}catch{return false}const ix=decoded.indexOf(':');if(ix<0)return false;const username=decoded.slice(0,ix),password=decoded.slice(ix+1);const lhs=crypto.createHash('sha256').update(username+'\0'+password).digest(),rhs=crypto.createHash('sha256').update('demo\0'+DEMO_PASSWORD).digest();return crypto.timingSafeEqual(lhs,rhs)}
function deny(res){res.writeHead(401,{'WWW-Authenticate':'Basic realm="NOVA Academy Adult Demo", charset="UTF-8"','Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('Protected adult-only demo: enter the credentials set by the site owner.')}
const PUBLIC=__dirname;const API_KEY=process.env.OPENAI_API_KEY;const MODEL=process.env.OPENAI_REALTIME_MODEL||'gpt-realtime-2.1';
const allowed=new Set(['marin','cedar','coral','sage','shimmer','verse']);
const limits=new Map();const MAX_REQUESTS=5;const WINDOW=60000;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.json':'application/json'};
function json(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
function getBody(req){return new Promise((resolve,reject)=>{let buf='';req.on('data',c=>{buf+=c;if(buf.length>3000){reject(new Error('Request too large'));req.destroy()}});req.on('end',()=>resolve(buf));req.on('error',reject)})}
const policy=`You are NOVA, an animated AI teaching assistant running an ADULT-ONLY concept demonstration with fictional students. You are an AI, not a person. Your tone is lively, warm, confident, curious, concise and articulate. Speak naturally, use short sentences and expressive emphasis, no lengthy monologues. Current subject: creative uses of AI, prompt specificity, verification, safety, invention. This is a guided classroom teaching context, not unrestricted chat. Use age-appropriate grade 3 vocabulary in a simulated scene, but never request real child data. For every approved slide, explain an idea then ask a single thoughtful question. Wait and let the adult tester answer. If asked to explain further, give an example or hint and invite thinking. Correct misunderstandings respectfully. If asked to go to next/previous slide, use request_slide_change; do not claim to change it without calling the tool. Never invent grades, student histories, real class performance, achievements or research. Never claim simulated assets are live generation. Never collect names, locations or identifying information; redirect to lesson topics. The session is for adult product evaluation only.`;
const slideTool={type:'function',name:'request_slide_change',description:'Change the current on-screen lesson slide when the adult operator asks to proceed, go back, or repeat. The app validates permission and bounds.',parameters:{type:'object',properties:{action:{type:'string',enum:['next','previous','repeat']}},required:['action'],additionalProperties:false}};
const allowedFiles=new Set(['index.html','styles.css','curriculum-data.js','data.js','app.js','live-classroom.html','live-classroom.css','live-classroom.js','NOVA_Enhanced_Classroom_Preview.html','NOVA_Academy_Offline_Demo.html','assets/favicon.svg']);
const server=http.createServer(async(req,res)=>{
try{
const url=new URL(req.url,'http://localhost');
if(url.pathname==='/healthz'){json(res,200,{ok:true});return}
if(!credentialOK(req)){deny(res);return}
if(url.pathname==='/api/status'){json(res,200,{configured:!!API_KEY,mode:'adult-demo-only',model:MODEL});return}
if(url.pathname==='/api/realtime-token'){
const origin=req.headers.origin; if(origin){const scheme=(req.headers['x-forwarded-proto']||'http').split(',')[0];const requestedHost=req.headers['x-forwarded-host']||req.headers.host;const expected=scheme+'://'+requestedHost;if(origin!==expected){json(res,403,{error:'Invalid request origin'});return}}
if(req.method!=='POST'){json(res,405,{error:'POST required'});return}
if(!API_KEY){json(res,503,{error:'OPENAI_API_KEY is not configured on the server. Revoke the old exposed key and supply a new one privately.'});return}
const now=Date.now(),ip=req.socket.remoteAddress||'local';const entries=(limits.get(ip)||[]).filter(t=>now-t<WINDOW);if(entries.length>=MAX_REQUESTS){json(res,429,{error:'Rate limit reached. Try again later.'});return}entries.push(now);limits.set(ip,entries);
let input={};try{input=JSON.parse(await getBody(req))}catch{json(res,400,{error:'Invalid request'});return}
const voice=allowed.has(input.voice)?input.voice:'marin';
const body={session:{type:'realtime',model:MODEL,instructions:policy,audio:{output:{voice},input:{turn_detection:{type:'semantic_vad',eagerness:'medium',create_response:true,interrupt_response:true}}},tools:[slideTool],tool_choice:'auto'}};
const identifier=crypto.createHash('sha256').update('nova-demo-adult-local').digest('hex');
let result;try{result=await fetch('https://api.openai.com/v1/realtime/client_secrets',{method:'POST',headers:{Authorization:`Bearer ${API_KEY}`,'Content-Type':'application/json','OpenAI-Safety-Identifier':identifier},body:JSON.stringify(body),signal:AbortSignal.timeout(16000)})}catch(e){json(res,502,{error:'Could not reach OpenAI Realtime service: '+e.message});return}
const data=await result.json().catch(()=>({}));if(!result.ok){json(res,result.status===401?401:502,{error:'OpenAI rejected the token request: '+(data.error?.message||result.statusText)});return}
json(res,200,{value:data.value,expires_at:data.expires_at});return
}
if(req.method!=='GET'&&req.method!=='HEAD'){json(res,405,{error:'Method not allowed'});return}
let file=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname).replace(/^\/+/, '');
if(!allowedFiles.has(file)){json(res,403,{error:'Restricted path'});return}
const ext=path.extname(file).toLowerCase();if(!types[ext]){json(res,404,{error:'Not found'});return}
const loc=path.resolve(PUBLIC,file);if(!loc.startsWith(PUBLIC+path.sep)){json(res,403,{error:'Restricted path'});return}
fs.stat(loc,(err,stats)=>{if(err||!stats.isFile()){json(res,404,{error:'Not found'});return}res.writeHead(200,{'Content-Type':types[ext],'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'microphone=(self), camera=()','Cache-Control':ext==='.html'?'no-store':'public, max-age=600','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.openai.com; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"});if(req.method==='HEAD')res.end();else fs.createReadStream(loc).pipe(res)})
}catch(e){console.error('Demo server error:',e.message);if(!res.headersSent)json(res,500,{error:'Server error'})}
});server.listen(PORT,HOST,()=>console.log(`NOVA adult demo available at http://${HOST}:${PORT}/live-classroom.html. OpenAI configured: ${!!API_KEY}`));
