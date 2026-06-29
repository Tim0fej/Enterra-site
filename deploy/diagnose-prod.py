#!/usr/bin/env python3
import os
import re
import urllib.request
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
cmds = [
    "export PATH=/usr/local/bin:/usr/bin:$PATH; pm2 status",
    "export PATH=/usr/local/bin:/usr/bin:$PATH; pm2 logs enterra-site --lines 30 --nostream",
    "curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/api/health; echo",
    "ls -la /opt/enterra-site/dist/assets/*.js /opt/enterra-site/dist/assets/*.css 2>/dev/null | tail -5",
    "python3 -c \"import re; h=open('/opt/enterra-site/dist/index.html').read(); print(re.search(r'assets/index-[^\\\"]+\\\\.js', h).group(0))\"",
]
for cmd in cmds:
    _, o, e = c.exec_command(cmd, timeout=60)
    out = (o.read() + e.read()).decode("utf-8", "replace")
    print("---", cmd[:60], "---")
    print(out.encode("ascii", "replace").decode())
c.close()

html = urllib.request.urlopen("https://enterra.tech/", timeout=20).read().decode()
js = re.search(r'src="(/assets/index-[^"]+\.js)"', html)
css = re.search(r'href="(/assets/index-[^"]+\.css)"', html)
print("--- public assets ---")
for m in [js, css]:
    if not m:
        print("MISSING in html")
        continue
    u = "https://enterra.tech" + m.group(1)
    try:
        r = urllib.request.urlopen(u, timeout=20)
        print(u, r.status, len(r.read()), "bytes")
    except Exception as ex:
        print(u, "FAIL", ex)
