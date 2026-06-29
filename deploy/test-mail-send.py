#!/usr/bin/env python3
"""Send test verification email via production mailer."""
import os
import sys

import paramiko

HOST = "193.222.62.4"
TO = os.environ.get("TEST_EMAIL_TO", "romazaytsev917@gmail.com")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=30)

script = f"""
cd /opt/enterra-site
node --input-type=module <<'NODE'
import 'dotenv/config';
import {{ sendVerificationCodeEmail }} from './server/lib/mailer.ts';

const to = '{TO}';
const code = String(Math.floor(100000 + Math.random() * 900000));
console.log('Sending test to', to, 'code', code);
try {{
  await sendVerificationCodeEmail(to, code);
  console.log('TEST_SEND_OK', code);
}} catch (e) {{
  console.error('TEST_SEND_FAIL', e.message);
  process.exit(1);
}}
NODE
"""

_, stdout, stderr = client.exec_command(script, timeout=60000)
out = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
print(out.encode("ascii", errors="replace").decode("ascii"))
if err:
    print(err.encode("ascii", errors="replace").decode("ascii"))
client.close()
sys.exit(0 if "TEST_SEND_OK" in out else 1)
