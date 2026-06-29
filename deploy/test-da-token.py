#!/usr/bin/env python3
import os
import paramiko

TOKEN = "EQd49leVa7zuH3Z9lo03"
alert_types = "1,4,13,15,11,16,14,2,3,5,12"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)

cmd = (
    f"curl -sS -L -A '{UA}' 'https://www.donationalerts.com/widget/lastdonations?"
    f"alert_type={alert_types}&limit=20&token={TOKEN}' -w ' HTTP:%{{http_code}}' | tail -c 500; echo"
)
_, o, _ = c.exec_command(cmd, timeout=90)
print(o.read().decode("utf-8", "replace").encode("ascii", "replace").decode())
c.close()
