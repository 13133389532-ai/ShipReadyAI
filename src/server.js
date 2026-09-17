import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { scanDirectory } from './scanner.js';
import { renderHtml } from './report.js';
import { clonePublicRepo, parseGitHubRepoUrl } from './repo.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, '..', 'public');
const reports = new Map();
const rate = new Map();
const HOUR = 60 * 60 * 1000;
const MAX_FREE_SCANS_PER_HOUR = Number(process.env.FREE_SCAN_LIMIT || 3);

function commonHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    ...extra
  };
}
function json(res, status, body, headers = {}) { res.writeHead(status, commonHeaders({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers })); res.end(JSON.stringify(body)); }
function clientIp(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim(); }
function allowScan(ip) { const now=Date.now(); const entry=rate.get(ip)||{start:now,count:0}; if(now-entry.start>=HOUR){entry.start=now;entry.count=0;} entry.count+=1; rate.set(ip,entry); return entry.count<=MAX_FREE_SCANS_PER_HOUR; }
function readRaw(req,max=64*1024){return new Promise((resolve,reject)=>{let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>max){reject(new Error('Request too large'));req.destroy();}});req.on('end',()=>resolve(raw));req.on('error',reject);});}
async function readJson(req,max=64*1024){const raw=await readRaw(req,max);try{return JSON.parse(raw||'{}');}catch{throw new Error('Invalid JSON');}}
function checkoutConfig(){const checkout={starter:process.env.LEMONSQUEEZY_STARTER_CHECKOUT_URL||'',pro:process.env.LEMONSQUEEZY_PRO_CHECKOUT_URL||'',fix:process.env.FIX_PACK_CONTACT_URL||''};return{checkout,paymentsReady:Boolean(checkout.pro)};}
function safeEqualHex(a,b){if(!a||!b||a.length!==b.length)return false;try{return crypto.timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));}catch{return false;}}
async function handleLemonWebhook(req,res){const secret=process.env.LEMONSQUEEZY_WEBHOOK_SECRET||'';if(!secret)return json(res,503,{error:'Lemon Squeezy webhook is not configured.'});let raw;try{raw=await readRaw(req,1024*1024);}catch(e){return json(res,400,{error:e.message});}const signature=String(req.headers['x-signature']||'');const expected=crypto.createHmac('sha256',secret).update(raw).digest('hex');if(!safeEqualHex(signature,expected))return json(res,401,{error:'Invalid webhook signature.'});let payload;try{payload=JSON.parse(raw);}catch{return json(res,400,{error:'Invalid webhook JSON.'});}const event=payload?.meta?.event_name||'unknown';const id=payload?.data?.id||null;console.log(JSON.stringify({type:'lemon_webhook',event,id,receivedAt:new Date().toISOString()}));return json(res,200,{ok:true});}
function cleanOldReports(){const cutoff=Date.now()-30*60*1000;for(const[id,value]of reports)if(value.createdAt<cutoff)reports.delete(id);}
async function handleScan(req,res){const ip=clientIp(req);if(!allowScan(ip))return json(res,429,{error:'Free scan limit reached. Try again later.'},{'Retry-After':'3600'});let body;try{body=await readJson(req);}catch(e){return json(res,400,{error:e.message});}const repoUrl=String(body.repoUrl||'').trim();try{parseGitHubRepoUrl(repoUrl);}catch(e){return json(res,400,{error:e.message});}let cloned;try{cloned=clonePublicRepo(repoUrl);const report=scanDirectory(cloned.target);report.source={type:'github',owner:cloned.owner,repo:cloned.repo,url:repoUrl};const html=renderHtml(report);reports.set(report.scanId,{createdAt:Date.now(),html,report});cleanOldReports();return json(res,200,{scanId:report.scanId,score:report.score,verdict:report.verdict,coverage:report.coverage,summary:report.summary,stack:report.stack,filesScanned:report.filesScanned,reportUrl:`/report/${report.scanId}`,jsonUrl:`/report/${report.scanId}.json`});}catch(e){return json(res,422,{error:e.message});}finally{cloned?.cleanup?.();}}
function serveStatic(req,res){const target=req.url==='/'?'index.html':req.url.replace(/^\//,'');const safe=path.normalize(target).replace(/^\.\.(\/|\\|$)/,'');const file=path.join(publicDir,safe);if(!file.startsWith(publicDir)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404,commonHeaders());return res.end('Not found');}const ext=path.extname(file);const type=ext==='.html'?'text/html; charset=utf-8':ext==='.js'?'text/javascript; charset=utf-8':ext==='.css'?'text/css; charset=utf-8':'text/plain; charset=utf-8';res.writeHead(200,commonHeaders({'Content-Type':type,'Cache-Control':'public, max-age=300'}));fs.createReadStream(file).pipe(res);}
const server=http.createServer(async(req,res)=>{if(req.method==='POST'&&req.url==='/api/scan')return handleScan(req,res);if(req.method==='POST'&&req.url==='/api/webhooks/lemonsqueezy')return handleLemonWebhook(req,res);if(req.method==='GET'&&req.url==='/api/config')return json(res,200,checkoutConfig());if(req.method==='GET'&&req.url==='/api/health')return json(res,200,{ok:true,product:'ShipReady AI',version:'0.3.0'});if(req.method==='GET'&&/^\/report\/[a-f0-9]{12}\.json$/.test(req.url)){const id=req.url.split('/').pop().replace('.json','');const saved=reports.get(id);if(!saved)return json(res,404,{error:'Report expired or not found.'});return json(res,200,saved.report,{'Content-Disposition':`attachment; filename="shipready-${id}.json"`});}if(req.method==='GET'&&req.url.startsWith('/report/')){const id=req.url.split('/').pop();const saved=reports.get(id);if(!saved){res.writeHead(404,commonHeaders({'Content-Type':'text/plain; charset=utf-8'}));return res.end('Report expired or not found.');}res.writeHead(200,commonHeaders({'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}));return res.end(saved.html);}if(req.method==='GET')return serveStatic(req,res);res.writeHead(405,commonHeaders());res.end('Method not allowed');});
const port=Number(process.env.PORT||3000);server.listen(port,()=>console.log(`ShipReady AI v0.3: http://localhost:${port}`));
