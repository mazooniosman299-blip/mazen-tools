import argparse,json,urllib.request,urllib.parse,urllib.robotparser,xml.etree.ElementTree as ET
from pathlib import Path
from html.parser import HTMLParser
class PageHead(HTMLParser):
 def __init__(self):super().__init__();self.canonical=None;self.languages=set();self.noindex=False
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='meta' and d.get('name','').lower() in ['robots','googlebot'] and 'noindex' in d.get('content','').lower():self.noindex=True
  if tag=='link' and d.get('rel')=='canonical':self.canonical=d.get('href')
  if tag=='link' and d.get('rel')=='alternate':self.languages.add(d.get('hreflang'))
p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--require-self',action='store_true');p.add_argument('--require-release-headers',action='store_true');a=p.parse_args();base=a.base.rstrip('/');origin='https://mazentoolsfree.mazooniosman299.workers.dev'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect)
def fetch(path):
 with opener.open(urllib.request.Request(base+path,headers={'User-Agent':'MazenTools-Sitemap-Check/1.0'}),timeout=15) as r:
  assert r.status==200,(path,r.status)
  assert 'noindex' not in r.headers.get('X-Robots-Tag','').lower(),path
  return r.headers,r.read()
h,body=fetch('/sitemap.xml');assert h.get_content_type() in ['application/xml','text/xml'];root=ET.fromstring(body);ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9','x':'http://www.w3.org/1999/xhtml'}
if a.require_release_headers:
 assert h.get_content_charset()=='utf-8' and 'must-revalidate' in h.get('Cache-Control','')
assert root.tag=='{'+ns['s']+'}urlset';urls=root.findall('s:url',ns);assert len(urls)==38
rh,rb=fetch('/robots.txt');assert rh.get_content_type()=='text/plain';robots=urllib.robotparser.RobotFileParser();robots.parse(rb.decode().splitlines());assert origin+'/sitemap.xml' in robots.site_maps()
seen=set()
for item in urls:
 loc=item.find('s:loc',ns).text;assert loc.startswith(origin+'/') and loc not in seen;seen.add(loc);path=loc[len(origin):];assert robots.can_fetch('Googlebot',loc)
 ph,pb=fetch(path);assert ph.get_content_type()=='text/html';head=PageHead();head.feed(pb.decode());assert not head.noindex;assert head.canonical==loc;assert head.languages>={'ar','en','x-default'}
 links=item.findall('x:link',ns)
 for link in links:assert link.get('href').startswith(origin+'/')
 if a.require_self:
  assert {x.get('hreflang') for x in links}>={'ar','en'}
  assert any(x.get('href')==loc for x in links)
assert all(link.get('href') in seen for item in urls for link in item.findall('x:link',ns))
warnings=[]
try:opener.open(urllib.request.Request(base+'/nonexistent-sitemap-check-404',headers={'User-Agent':'MazenTools-Sitemap-Check/1.0'}),timeout=10);raise AssertionError('Missing URL returned success (soft 404)')
except urllib.error.HTTPError as e:
 unknown_status=e.code
 assert e.code in [403,404,410],f'Unknown route returned unexpected HTTP {e.code}'
 if e.code==403:warnings.append('An unknown test route is forbidden (403), rather than not found (404). All listed sitemap URLs are checked separately and must return 200.')
with urllib.request.urlopen(urllib.request.Request(base+'/google611146e9ceec162a.html',headers={'User-Agent':'MazenTools-Sitemap-Check/1.0'}),timeout=15) as verification:
 assert verification.status==200 and verification.read()==b'google-site-verification: google611146e9ceec162a.html'
print(json.dumps({'scope':'HTTP checks against supplied base, not Google indexing confirmation','base':base,'sitemapStatus':200,'contentType':h.get_content_type(),'xmlValid':True,'urlsChecked':len(seen),'robotsAllowsGooglebot':True,'canonicalMatches':True,'redirectsRejected':True,'verificationFilePreserved':True,'real404':unknown_status==404,'unknownRouteStatus':unknown_status,'warnings':warnings},indent=2))
