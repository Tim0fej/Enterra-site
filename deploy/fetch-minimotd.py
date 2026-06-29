#!/usr/bin/env python3
"""Download MiniMOTD main.conf locally."""
import paramiko
from pathlib import Path

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = "SCCPm@W39sMjd.h"
OUT = Path(__file__).resolve().parent / "_minimotd_main.conf"

transport = paramiko.Transport((HOST, PORT))
transport.connect(username=USER, password=PASSWORD)
sftp = paramiko.SFTPClient.from_transport(transport)
with sftp.open("plugins/MiniMOTD/main.conf", "r") as f:
    OUT.write_bytes(f.read())
sftp.close()
transport.close()
print("saved", OUT)
