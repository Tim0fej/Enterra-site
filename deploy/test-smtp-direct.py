#!/usr/bin/env python3
"""Test Gmail SMTP directly on the VDS."""
import os
import sys

import paramiko

HOST = "193.222.62.4"
PASSWORD = os.environ.get("DEPLOY_PASSWORD")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD, timeout=30)

script = r"""
cd /opt/enterra-site
node --input-type=module <<'NODE'
import nodemailer from 'nodemailer';
import 'dotenv/config';

const user = process.env.SMTP_USER || process.env.SMTP_FROM;
const pass = process.env.SMTP_PASS;
console.log('SMTP_USER', user);
console.log('SMTP_PASS set', Boolean(pass), 'len', pass?.length ?? 0);

const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user, pass },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

try {
  await transport.verify();
  console.log('VERIFY_OK');
  const info = await transport.sendMail({
    from: `"Enterra" <${user}>`,
    to: 'romazaytsev917@gmail.com',
    subject: 'Enterra test code 123456',
    text: 'Test 123456',
  });
  console.log('SEND_OK', info.messageId);
} catch (e) {
  console.error('MAIL_ERR', e.message);
  process.exit(1);
}
NODE
"""

_, stdout, stderr = client.exec_command(script, timeout=60000)
out = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
print(out.encode("ascii", errors="replace").decode("ascii"))
if err:
    print("STDERR:", err.encode("ascii", errors="replace").decode("ascii"))
client.close()
sys.exit(0 if "SEND_OK" in out else 1)
