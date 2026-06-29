#!/usr/bin/env python3
import json
import re
import urllib.request

html = urllib.request.urlopen("https://enterra.tech/shop", timeout=20).read().decode("utf-8", "replace")
js = re.search(r"assets/index-[^\"]+\.js", html)
print("js:", js.group(0) if js else "MISSING")
print("embedded:", "__ENTERRA_SHOP__" in html)
idx = html.find("window.__ENTERRA_SHOP__=")
if idx >= 0:
    start = idx + len("window.__ENTERRA_SHOP__=")
    end = html.find("</script>", start)
    data = json.loads(html[start:end])
    print("products:", len(data.get("products", [])))

store = urllib.request.urlopen("https://enterra.tech/api/store", timeout=20)
print("api/store:", store.status, len(store.read()), "bytes")
