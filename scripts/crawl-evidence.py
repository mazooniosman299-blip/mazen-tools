"""Public HTTP evidence for CI; never prints credentials or private user files."""
import hashlib,json,pathlib,urllib.request,urllib.error,urllib.robotparser,xml.etree.ElementTree as ET
origin='https://mazentoolsfree.mazooniosman299.workers.dev'
rows=[]
for path in ['/sitemap.xml','/robots.txt','/ar/images-pdf/','/en/images-pdf/','/google611146e9ceec162a.html']:
 row={'path':path}
 try:
  with urllib.request.urlopen(urllib.request.Request(origin+path,headers={'User-Agent':'MazenTools-Crawl-Diagnostic/1.0'}),timeout=25) as response:
   body=response.read();row.update(status=response.status,finalUrl=response.url,headers={k:v for k,v in response.headers.items() if k.lower() in ['content-type','cache-control','x-robots-tag','location']},bytes=len(body),sha256=hashlib.sha256(body).hexdigest())
   if path=='/sitemap.xml':
    try:
     root=ET.fromstring(body);ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9','x':'http://www.w3.org/1999/xhtml'};urls=root.findall('s:url',ns)
     row.update(xmlValid=True,root=root.tag,urlCount=len(urls),selfAlternates=all(any(x.get('href')==u.find('s:loc',ns).text for x in u.findall('x:link',ns)) for u in urls),origins=sorted(set(urllib.parse.urlsplit(u.find('s:loc',ns).text).netloc for u in urls)))
    except ET.ParseError as error:row.update(xmlValid=False,error=str(error))
   if path=='/robots.txt':row['body']=body.decode('utf-8',errors='replace')[:2000]
 except Exception as error:row['error']=str(error)
 rows.append(row)
pathlib.Path('work').mkdir(exist_ok=True)
pathlib.Path('work/public-evidence.json').write_text(json.dumps(rows,indent=2))
print('PUBLIC_CRAWL_EVIDENCE='+json.dumps(rows))
