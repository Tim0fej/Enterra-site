#!/usr/bin/env python3
import base64
import os
import urllib.parse
import paramiko

CLIENT_ID = "19534"
SECRET = os.environ.get("DONATION_ALERTS_CLIENT_SECRET", "MBafI2BVw1cmZUPIifxIlbLRWTE0mg4qW8GBNPVM").strip()

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)

basic = base64.b64encode(f"{CLIENT_ID}:{SECRET}".encode()).decode()
data = urllib.parse.urlencode(
    {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": SECRET,
    }
)
cmd = (
    f"echo '--- client_credentials'; curl -sS -X POST 'https://www.donationalerts.com/oauth/token' "
    f"-H 'Content-Type: application/x-www-form-urlencoded' -d '{data}'; echo; "
    f"echo '--- basic auth'; curl -sS -w ' HTTP:%{{http_code}}\\n' "
    f"-H 'Authorization: Basic {basic}' "
    f"'https://www.donationalerts.com/api/v1/alerts/donations' | tail -2"
)
_, o, _ = c.exec_command(cmd, timeout=60)
print(o.read().decode("utf-8", "replace").encode("ascii", "replace").decode())
c.close()
