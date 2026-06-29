#!/usr/bin/env python3
import os
import re
import sys

import paramiko

HOST = "193.222.62.4"
ENV_PATH = "/opt/enterra-site/.env"
WEBAPP_URL = os.environ.get(
    "GMAIL_WEBAPP_URL",
    "https://script.google.com/macros/s/AKfycbz3AB-ALua8yH0apd19PBTtuVUDsb8B4g3U-pvO-WFBh-La_pfDo2zy_II6nhLnQnSl6g/exec",
)


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=30)
    sftp = client.open_sftp()

    content = sftp.open(ENV_PATH).read().decode("utf-8")
    for key, value in {
        "GMAIL_WEBAPP_URL": WEBAPP_URL,
        "GMAIL_WEBAPP_SECRET": "enterra-mail-secret-2026",
        "SMTP_FROM": "enterraverif@gmail.com",
    }.items():
        line = f"{key}={value}"
        if re.search(rf"^{re.escape(key)}=", content, re.MULTILINE):
            content = re.sub(rf"^{re.escape(key)}=.*$", line, content, flags=re.MULTILINE)
        else:
            content = content.rstrip() + "\n" + line + "\n"

    with sftp.open(ENV_PATH, "w") as f:
        f.write(content.encode("utf-8"))
    sftp.close()

    test_payload = (
        '{"secret":"enterra-mail-secret-2026","to":"romazaytsev917@gmail.com",'
        '"subject":"Enterra test","text":"Test 123456","html":"<b>123456</b>"}'
    )

    script = f"""
export PATH="/usr/local/bin:/usr/bin:$PATH"
pm2 restart enterra-site --update-env
sleep 2
echo "=== webapp test ==="
curl -s -L -m 30 -X POST '{WEBAPP_URL}' \\
  -H 'Content-Type: application/json' \\
  -d '{test_payload}'
echo
echo "=== api test ==="
curl -s -m 30 -X POST http://127.0.0.1:3001/api/auth/send-email-code \\
  -H 'Content-Type: application/json' \\
  -d '{{"email":"newuser.test.mail@gmail.com","purpose":"register"}}'
echo
echo DONE
"""

    _, stdout, stderr = client.exec_command(script, timeout=90000)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(out.encode("ascii", errors="replace").decode("ascii"))
    if err:
        print(err.encode("ascii", errors="replace").decode("ascii"))
    client.close()
    return 0 if "DONE" in out else 1


if __name__ == "__main__":
    sys.exit(main())
