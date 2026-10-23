import unittest,threading,http.server,pathlib,subprocess,functools
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 mode='valid'
 def log_message(self,*args):pass
 def end_headers(self):
  self.send_header('Cache-Control','public,max-age=0,must-revalidate')
  if self.mode=='noindex':self.send_header('X-Robots-Tag','noindex')
  super().end_headers()
 def guess_type(self,path):
  if path.endswith('.xml'):return 'application/xml; charset=utf-8'
  if path.endswith('.txt'):return 'text/plain; charset=utf-8'
  return super().guess_type(path)
 def do_GET(self):
  if self.path=='/sitemap.xml' and self.mode in ['html','redirect','xml']:
   if self.mode=='redirect':self.send_response(307);self.send_header('Location','/ar/');self.end_headers();return
   self.send_response(200);self.send_header('Content-Type','text/html' if self.mode=='html' else 'application/xml; charset=utf-8');self.end_headers();self.wfile.write(b'<html>SPA fallback</html>' if self.mode=='html' else b'<urlset>broken XML');return
  if self.path=='/robots.txt' and self.mode=='blocked':
   self.send_response(200);self.send_header('Content-Type','text/plain');self.end_headers();self.wfile.write(b'User-agent: *\nDisallow: /\nSitemap: https://mazentoolsfree.mazooniosman299.workers.dev/sitemap.xml\n');return
  super().do_GET()
class SitemapRegression(unittest.TestCase):
 def check(self,mode,success):
  handler=type('CaseHandler',(Handler,),{'mode':mode})
  server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(handler,directory=str(ROOT/'dist')))
  thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
  try:
   p=subprocess.run(['python3',str(ROOT/'scripts/check-sitemap.py'),'--base',f'http://127.0.0.1:{server.server_port}','--require-self'],capture_output=True,text=True,timeout=30)
   self.assertEqual(p.returncode==0,success,p.stdout+p.stderr)
  finally:server.shutdown();server.server_close()
 def test_valid_production_artifact(self):self.check('valid',True)
 def test_html_fallback_is_rejected(self):self.check('html',False)
 def test_redirected_sitemap_is_rejected(self):self.check('redirect',False)
 def test_malformed_xml_is_rejected(self):self.check('xml',False)
 def test_noindex_header_is_rejected(self):self.check('noindex',False)
 def test_robots_block_is_rejected(self):self.check('blocked',False)
if __name__=='__main__':unittest.main()
