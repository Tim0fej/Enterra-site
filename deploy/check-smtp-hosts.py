#!/usr/bin/env python3
import os, paramiko
hosts = ["smtp.gmail.com", "smtp.mail.ru", "smtp.yandex.ru", "smtp-relay.brevo.com"]
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=30)
checks = " ".join(
    f'(timeout 4 bash -c "cat </dev/null >/dev/tcp/{h}/587" 2>/dev/null && echo {h}:587:OK || echo {h}:587:BLOCKED);'
    for h in hosts
)
_,o,_=c.exec_command(checks, timeout=60)
print(o.read().decode())
c.close()
