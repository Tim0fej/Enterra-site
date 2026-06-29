#!/usr/bin/env python3
import os
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=30)

script = """
echo "=== port check ==="
for port in 587 465 25 2525; do
  timeout 5 nc -zv smtp.gmail.com $port 2>&1 | tail -1 || true
done
echo "=== try 465 ssl ==="
cd /opt/enterra-site
node --input-type=module <<'NODE'
import nodemailer from 'nodemailer';
import 'dotenv/config';
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
for (const cfg of [
  { host: 'smtp.gmail.com', port: 465, secure: true },
  { host: 'smtp.gmail.com', port: 587, secure: false },
]) {
  try {
    const t = nodemailer.createTransport({ ...cfg, auth: { user, pass }, connectionTimeout: 10000 });
    await t.verify();
    console.log('OK port', cfg.port);
  } catch (e) {
    console.log('FAIL port', cfg.port, e.message);
  }
}
NODE
"""

_, stdout, _ = client.exec_command(script, timeout=90000)
print(stdout.read().decode("utf-8", errors="replace").encode("ascii", errors="replace").decode("ascii"))
client.close()
