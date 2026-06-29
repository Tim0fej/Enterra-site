#!/usr/bin/env python3
"""List MiniMOTD config on Minerent."""
import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = "SCCPm@W39sMjd.h"

transport = paramiko.Transport((HOST, PORT))
transport.connect(username=USER, password=PASSWORD)
sftp = paramiko.SFTPClient.from_transport(transport)

for path in [
    "plugins/MiniMOTD",
    "plugins/minimotd",
]:
    try:
        print("===", path, "===")
        for name in sftp.listdir(path):
            print(name)
            if name.endswith((".yml", ".yaml", ".conf", ".toml", ".json")):
                with sftp.open(f"{path}/{name}", "r") as f:
                    print(f.read().decode("utf-8", errors="replace")[:4000])
    except OSError as exc:
        print(path, exc)

sftp.close()
transport.close()
