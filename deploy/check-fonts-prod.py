#!/usr/bin/env python3
import re
import urllib.request

html = urllib.request.urlopen("https://enterra.tech/", timeout=20).read().decode()
css_m = re.search(r'href="(/assets/index-[^"]+\.css)"', html)
css_path = css_m.group(1) if css_m else ""
css_text = urllib.request.urlopen("https://enterra.tech" + css_path, timeout=20).read().decode("utf-8", "replace")
fonts = re.findall(r"url\((/assets/[^)]+\.(?:woff2?))\)", css_text)
print("css:", css_path)
print("font refs:", len(fonts))
missing = 0
for font in fonts[:5]:
    try:
        urllib.request.urlopen("https://enterra.tech" + font, timeout=15)
        print("OK", font)
    except Exception as e:
        missing += 1
        print("MISSING", font, e)
print("checked", min(5, len(fonts)), "missing", missing)
