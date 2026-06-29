#!/usr/bin/env python3
import os
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
_, o, _ = c.exec_command("grep EASYDONATE /opt/enterra-site/.env || echo NONE", timeout=30)
for line in o.read().decode("utf-8", errors="replace").splitlines():
    if "SHOP_KEY" in line and "=" in line:
        k, _ = line.split("=", 1)
        print(f"{k}=***")
    else:
        print(line)
c.close()
