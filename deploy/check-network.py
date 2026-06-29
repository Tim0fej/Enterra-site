#!/usr/bin/env python3
import os, paramiko
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('193.222.62.4', username='root', password=os.environ['DEPLOY_PASSWORD'], timeout=30)
_,o,_=c.exec_command('curl -s -m 5 -o /dev/null -w "https443:%{http_code}\n" https://api.brevo.com; timeout 8 bash -c "cat < /dev/null > /dev/tcp/smtp.gmail.com/587" 2>&1; echo exit587:$?', timeout=30)
print(o.read().decode())
c.close()
