import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml','.txt':'text/plain'};
const headers={};for(const line of (await readFile('dist/_headers','utf8')).split('\n')){const m=line.match(/^\s+([^:]+):\s*(.*)$/);if(m)headers[m[1]]=m[2]}
http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return}const meta=await stat(file);if(meta.isDirectory())file=path.join(file,'index.html');const bytes=await readFile(file);res.writeHead(200,{...headers,'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':file.includes('/assets/')?'public,max-age=31536000,immutable':'no-cache'});res.end(bytes)}catch{res.writeHead(404,{...headers,'Content-Type':'text/plain'});res.end('Not found')}}).listen(4173,'127.0.0.1',()=>console.log('Production headers preview http://127.0.0.1:4173'));
