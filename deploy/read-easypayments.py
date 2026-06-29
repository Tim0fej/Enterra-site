#!/usr/bin/env python3
import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = "SCCPm@W39sMjd.h"

transport = paramiko.Transport((HOST, PORT))
transport.connect(username=USER, password=PASSWORD)
sftp = paramiko.SFTPClient.from_transport(transport)
for path in ["plugins/EasyPayments", "plugins/EasyPayments/config.yml"]:
    try:
        if path.endswith(".yml"):
            with sftp.open(path, "r") as f:
                print("===", path, "===")
                print(f.read().decode("utf-8", errors="replace")[:6000])
        else:
            print("===", path, "===")
            print("\n".join(sftp.listdir(path)))
    except OSError as exc:
        print(path, exc)
sftp.close()
transport.close()
