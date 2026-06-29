#!/usr/bin/env python3
import os
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=30)

_, stdout, _ = client.exec_command(
    """curl -s -m 30 -X POST http://127.0.0.1:3001/api/auth/send-email-code \
  -H 'Content-Type: application/json' \
  -d '{"email":"verifytest2026@gmail.com","purpose":"register"}'
echo
grep SMTP /opt/enterra-site/.env | sed 's/SMTP_PASS=.*/SMTP_PASS=***/'
""",
    timeout=45,
)
print(stdout.read().decode("utf-8", errors="replace").encode("ascii", errors="replace").decode("ascii"))
client.close()
