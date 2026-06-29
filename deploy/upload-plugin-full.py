#!/usr/bin/env python3
"""Build (optional), upload EnterraAuth jar + sync config on Minerent MC server."""
import os
import re
import subprocess
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
POM = ROOT / "plugin" / "pom.xml"
HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "")
CONFIG_PATH = "plugins/EnterraAuth/config.yml"
SITE = "https://enterra.tech"


def read_version() -> str:
    text = POM.read_text(encoding="utf-8")
    match = re.search(r"<version>([^<]+)</version>", text)
    if not match:
        raise RuntimeError("Cannot read version from plugin/pom.xml")
    return match.group(1).strip()


def build_plugin() -> None:
    subprocess.run(["mvn", "-q", "package", "-DskipTests"], cwd=ROOT / "plugin", check=True)


def remove_legacy_jars(sftp: paramiko.SFTPClient) -> None:
    for name in sftp.listdir("plugins"):
        if name == "EnterraAuth.jar" or (name.startswith("EnterraAuth-") and name.endswith(".jar")):
            path = f"plugins/{name}"
            print("  remove old", path)
            sftp.remove(path)


def sync_config(sftp: paramiko.SFTPClient) -> None:
    template = (ROOT / "plugin" / "src" / "main" / "resources" / "config.yml").read_text(encoding="utf-8")
    try:
        old = sftp.open(CONFIG_PATH).read().decode("utf-8")
    except OSError:
        old = ""

    api_key = re.search(r'^api-key:\s*"(.*)"', old, re.MULTILINE)
    api_url = re.search(r'^api-url:\s*"(.*)"', old, re.MULTILINE)
    website = re.search(r'^website-url:\s*"(.*)"', old, re.MULTILINE)

    fixed = template
    fixed = re.sub(
        r'^api-url:.*$',
        f'api-url: "{api_url.group(1) if api_url else SITE}"',
        fixed,
        flags=re.MULTILINE,
    )
    fixed = re.sub(
        r'^api-key:.*$',
        f'api-key: "{api_key.group(1) if api_key else "enterra-plugin-key"}"',
        fixed,
        flags=re.MULTILINE,
    )
    fixed = re.sub(
        r'^website-url:.*$',
        f'website-url: "{website.group(1) if website else SITE}"',
        fixed,
        flags=re.MULTILINE,
    )

    with sftp.open(CONFIG_PATH, "w") as f:
        f.write(fixed.encode("utf-8"))
    print("  synced", CONFIG_PATH)


def main() -> int:
    if not PASSWORD:
        print("Set MINERENT_SFTP_PASSWORD (Minerent panel -> SFTP/FTP)", file=sys.stderr)
        return 1

    if "--build" in sys.argv or not (ROOT / "plugin" / "target").is_dir():
        print("Building plugin...")
        build_plugin()

    version = read_version()
    jar = ROOT / "plugin" / "target" / f"EnterraAuth-{version}.jar"
    if not jar.is_file():
        print(f"Missing {jar}", file=sys.stderr)
        return 1

    remote_jar = f"plugins/EnterraAuth-{version}.jar"
    print(f"Uploading {jar.name} ({jar.stat().st_size} bytes)")

    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    remove_legacy_jars(sftp)
    sftp.put(str(jar), remote_jar)
    sync_config(sftp)

    stat = sftp.stat(remote_jar)
    print(f"OK: remote {remote_jar} ({stat.st_size} bytes)")
    sftp.close()
    transport.close()
    print("Restart MC server in Minerent panel to apply.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
