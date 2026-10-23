import unittest,sys,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from crawler_identity import verify_address,records
class CrawlerIdentity(unittest.TestCase):
 def test_address_must_match_official_range(self):
  ranges=[{'ipv4Prefix':'66.249.64.0/19'}]
  self.assertTrue(verify_address('66.249.66.1',ranges));self.assertFalse(verify_address('192.0.2.1',ranges))
 def test_ipv6_and_missing_addresses(self):
  self.assertTrue(verify_address('2001:4860:4801:10::1',[{'ipv6Prefix':'2001:4860:4801:10::/64'}]));self.assertIsNone(verify_address(None,[]))
 def test_only_structured_monitor_records_are_used(self):
  data={'events':[{'source':{'event':'mazen-crawl-fetch-v1','path':'/sitemap.xml'}},{'userAgent':'{"event":"mazen-crawl-fetch-v1"}'}]}
  self.assertEqual(len(list(records(data))),1)
