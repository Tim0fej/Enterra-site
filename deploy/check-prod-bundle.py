#!/usr/bin/env python3
import os
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
_, o, _ = c.exec_command(
    "ls /opt/enterra-site/dist/assets/index-*.js && "
    "python3 -c \""
    "import glob; p=glob.glob('/opt/enterra-site/dist/assets/index-*.js')[0]; "
    "d=open(p,encoding='utf-8').read(); "
    "print('file', p); "
    "print('skoro', d.count('\\u0421\\u043a\\u043e\\u0440\\u043e')); "
    "print('vip_btn', d.count('\\u041e\\u0444\\u043e\\u0440\\u043c\\u0438\\u0442\\u044c VIP')); "
    "print('vip_route', '/support/vip' in d)"
    "\"",
    timeout=60,
)
print(o.read().decode("utf-8", errors="replace"))
c.close()
