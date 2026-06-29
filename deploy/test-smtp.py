#!/usr/bin/env python3
import os
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=30)

_, stdout, stderr = client.exec_command(
    """curl -s -X POST http://127.0.0.1:3001/api/auth/send-email-code \
  -H 'Content-Type: application/json' \
  -d '{"email":"testverify999@gmail.com","purpose":"register"}'
echo
export PATH=/usr/local/bin:/usr/bin:$PATH
pm2 logs enterra-site --lines 5 --nostream 2>&1 | tail -8
""",
    timeout=30,
)
print(stdout.read().decode("utf-8", errors="replace"))
client.close()
