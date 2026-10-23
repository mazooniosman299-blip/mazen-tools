import urllib.request,urllib.error,hashlib,json,pathlib,xml.etree.ElementTree as ET,datetime
BASE='https://mazentoolsfree.mazooniosman299.workers.dev'
agents={
 'monitor':'MazenTools-Sitemap-Check/1.0',
 'browser':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
 'googlebot-desktop-string':'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
 'googlebot-mobile-string':'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
 'inspection-tool-string':'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)',
 'python-default':'Python-urllib/3.12'}
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect)
rows=[]
for round in [1,2]:
 for name,agent in agents.items():
  for path in ['/sitemap.xml','/robots.txt']:
   row={'round':round,'identity':name,'url':BASE+path}
   try:
    response=opener.open(urllib.request.Request(BASE+path,headers={'User-Agent':agent,'Cache-Control':'no-cache'}),timeout=25)
   except urllib.error.HTTPError as error:response=error
   except Exception as error:
    row['networkError']=type(error).__name__;rows.append(row);print(json.dumps(row));continue
   with response:
    body=response.read();row.update(status=response.status,headers={k:v for k,v in response.headers.items() if k.lower() in ['content-type','location','x-robots-tag','cf-mitigated','cf-ray','server','cache-control']},sha256=hashlib.sha256(body).hexdigest(),bytes=len(body))
    if path=='/sitemap.xml' and response.status==200:
     try:
      root=ET.fromstring(body);locs=[e.text for e in root.findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc')];row.update(xmlValid=True,urls=len(locs),uniqueUrls=len(set(locs)),productionOriginsOnly=all(u.startswith(BASE+'/') for u in locs))
     except ET.ParseError:row['xmlValid']=False
   rows.append(row);print('REQUEST_IDENTITY_AUDIT='+json.dumps(row))
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Requests originate from GitHub Actions, NOT verified Googlebot IP addresses. User-Agent comparison cannot prove real Google access.','requests':rows,'allRequests200':all(r.get('status')==200 for r in rows),'identicalSitemapBodies':len({r.get('sha256') for r in rows if r['url'].endswith('/sitemap.xml')})==1}
pathlib.Path('work').mkdir(exist_ok=True);pathlib.Path('work/request-identity-audit.json').write_text(json.dumps(report,indent=2))
print('IDENTITY_AUDIT_SUMMARY='+json.dumps({k:v for k,v in report.items() if k!='requests'}))
