#!/usr/bin/env python3
import os
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
script = r"""
python3 << 'PY'
import re, glob
html = open('/opt/enterra-site/dist/index.html', encoding='utf-8').read()
m = re.search(r'assets/index-([^.]+)\.js', html)
print('index.html bundle:', m.group(0) if m else 'NONE')
for name in ['index-5BGN7eDB.js', m.group(0).split('/')[-1] if m else '']:
    if not name: continue
    paths = glob.glob('/opt/enterra-site/dist/assets/' + name)
    if not paths: 
        print(name, 'MISSING')
        continue
    d = open(paths[0], encoding='utf-8').read()
    print(name, 'skoro', d.count('\u0421\u043a\u043e\u0440\u043e'), 'vip_btn', d.count('\u041e\u0444\u043e\u0440\u043c\u0438\u0442\u044c VIP'), 'vip_route', '/support/vip' in d)
PY
"""
_, o, e = c.exec_command(script, timeout=60)
print(o.read().decode("utf-8", errors="replace"))
err = e.read().decode("utf-8", errors="replace")
if err:
    print(err)
c.close()
