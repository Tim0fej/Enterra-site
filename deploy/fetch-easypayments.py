#!/usr/bin/env python3
from pathlib import Path
import paramiko

OUT = Path(__file__).resolve().parent / "_easypayments_config.yml"
transport = paramiko.Transport(("enterra.minerent.io", 2050))
transport.connect(username="tw1xty.a005b814", password="SCCPm@W39sMjd.h")
sftp = paramiko.SFTPClient.from_transport(transport)
with sftp.open("plugins/EasyPayments/config.yml", "r") as f:
    OUT.write_bytes(f.read())
sftp.close()
transport.close()
