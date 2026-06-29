#!/usr/bin/env python3
"""Upload versioned EnterraAuth jar to Minerent MC server via SFTP."""
import os
import re
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
POM = ROOT / "plugin" / "pom.xml"

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")


def read_version() -> str:
    text = POM.read_text(encoding="utf-8")
    match = re.search(r"<version>([^<]+)</version>", text)
    if not match:
        raise RuntimeError("Cannot read version from plugin/pom.xml")
    return match.group(1).strip()


def jar_paths(version: str) -> tuple[Path, str]:
    name = f"EnterraAuth-{version}.jar"
    return ROOT / "plugin" / "target" / name, f"plugins/{name}"


def remove_legacy_jars(sftp: paramiko.SFTPClient) -> None:
    try:
        names = sftp.listdir("plugins")
    except OSError:
        return

    for name in names:
        if name == "EnterraAuth.jar" or (
            name.startswith("EnterraAuth-") and name.endswith(".jar")
        ):
            path = f"plugins/{name}"
            print(f"  remove old {path}")
            sftp.remove(path)


def main() -> int:
    version = read_version()
    jar, remote_jar = jar_paths(version)

    if not jar.is_file():
        print(f"Build first: {jar}", file=sys.stderr)
        return 1

    print(f"Uploading {jar.name} ({jar.stat().st_size} bytes) -> {remote_jar}")
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    remove_legacy_jars(sftp)
    sftp.put(str(jar), remote_jar)
    stat = sftp.stat(remote_jar)
    print(f"OK: remote size {stat.st_size} bytes")

    sftp.close()
    transport.close()
    print("Restart the MC server in Minerent panel to load the new plugin.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
