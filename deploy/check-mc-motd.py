#!/usr/bin/env python3
"""Diagnose MC server MOTD for EasyDonate verification."""
import json
import socket
import struct
import sys
import urllib.request

import paramiko

HOST = "enterra.minerent.io"
SFTP_PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = "SCCPm@W39sMjd.h"


def ping_mc(host: str, port: int, timeout: float = 5.0) -> dict | None:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((host, port))
        host_bytes = host.encode("utf-8")
        data = b"\x00" + bytes([len(host_bytes)]) + host_bytes + struct.pack(">H", port) + b"\x01"
        sock.send(struct.pack(">H", len(data)) + data)
        sock.send(struct.pack(">H", 9) + b"\x01\x00")
        raw = sock.recv(4096)
        sock.close()
        if len(raw) < 5:
            return None
        length = struct.unpack(">I", raw[1:5])[0]
        payload = raw[5 : 5 + length].decode("utf-8", errors="replace")
        return json.loads(payload)
    except OSError as exc:
        return {"error": str(exc)}


def extract_motd(status: dict) -> str:
    desc = status.get("description", "")
    if isinstance(desc, dict):
        return "".join(part.get("text", "") for part in desc.get("extra", [desc]))
    return str(desc)


def main() -> int:
    print("=== server.properties motd ===")
    transport = paramiko.Transport((HOST, SFTP_PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)
    with sftp.open("server.properties", "r") as f:
        for line in f.read().decode("utf-8", errors="replace").splitlines():
            if line.startswith(("motd=", "server-port=", "enable-status=")):
                print(line)
    try:
        plugins = sorted(sftp.listdir("plugins"))
        print("\n=== plugins ===")
        for name in plugins:
            print(name)
    except OSError as exc:
        print("plugins list error:", exc)
    sftp.close()
    transport.close()

    for port in (25565, 31363):
        print(f"\n=== ping {HOST}:{port} ===")
        status = ping_mc(HOST, port)
        if not status:
            print("no response")
            continue
        if "error" in status:
            print("error:", status["error"])
            continue
        print("online:", "players" in status)
        print("motd:", extract_motd(status))

    try:
        url = f"https://api.mcsrvstat.us/2/{HOST}:25565"
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        print("\n=== mcsrvstat ===")
        print("online:", data.get("online"))
        if data.get("motd"):
            print("motd:", data["motd"])
        if data.get("debug", {}).get("error"):
            print("error:", data["debug"]["error"])
    except Exception as exc:
        print("mcsrvstat error:", exc)

    return 0


if __name__ == "__main__":
    sys.exit(main())
