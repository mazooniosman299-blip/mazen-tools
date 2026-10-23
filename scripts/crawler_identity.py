"""Verify private crawler source addresses against Google's official lists; emit no IPs."""
import datetime,ipaddress,json,pathlib,sys,urllib.request
SOURCES={'googlebot':'https://developers.google.com/static/crawling/ipranges/common-crawlers.json','inspection':'https://developers.google.com/static/crawling/ipranges/user-triggered-fetchers-google.json'}
def verify_address(address,prefixes):
 try:
  ip=ipaddress.ip_address(address)
  return any(ip in ipaddress.ip_network(p.get('ipv4Prefix') or p.get('ipv6Prefix')) for p in prefixes)
 except (ValueError,TypeError):return None

def records(value):
 if isinstance(value,dict):
  if value.get('event')=='mazen-crawl-fetch-v1':yield value
  else:
   for child in value.values():yield from records(child)
 elif isinstance(value,list):
  for child in value:yield from records(child)

def report(value):
 rows=[];ranges={};seen=set();observed=list(records(value))
 for row in observed:
  agent=row.get('userAgent','').lower()
  kind='googlebot' if 'googlebot' in agent else 'inspection' if 'google-inspectiontool' in agent else None
  if not kind:continue
  key=(row.get('at'),row.get('ray'),row.get('path'))
  if key in seen:continue
  seen.add(key)
  if kind not in ranges:
   try:
    with urllib.request.urlopen(urllib.request.Request(SOURCES[kind],headers={'User-Agent':'MazenTools-Crawler-Verification/1.0'}),timeout=15) as r:ranges[kind]=json.load(r)['prefixes']
   except Exception:ranges[kind]=None
  verified=verify_address(row.get('sourceIp'),ranges[kind]) if ranges[kind] else None
  rows.append({'at':row.get('at'),'path':row.get('path'),'status':row.get('status'),'kind':kind,'verifiedGoogleSource':verified})
 return {'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'logQueryAvailable':True,'monitorRecordsObserved':len(observed),'verifiedGoogleRequests':sum(r['verifiedGoogleSource'] is True for r in rows),'events':rows,'scope':'Last 24h, limited to returned Worker events. Pre-Worker WAF denials are not visible. No indexing confirmation. Source IPs stay private and are not included in this report.'}
if __name__=='__main__':print(json.dumps(report(json.loads(pathlib.Path(sys.argv[1]).read_text())),indent=2))
