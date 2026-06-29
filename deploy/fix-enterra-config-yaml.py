#!/usr/bin/env python3
"""Rebuild EnterraAuth config.yml from template, preserving api-url/api-key."""
import os
import re
import sys

import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")
ENTERRA_CONFIG = "plugins/EnterraAuth/config.yml"
SITE = "https://enterra.tech"


def main() -> int:
    template_path = os.path.join(
        os.path.dirname(__file__), "..", "plugin", "src", "main", "resources", "config.yml"
    )
    with open(template_path, encoding="utf-8") as f:
        template = f.read()

    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    try:
        old = sftp.open(ENTERRA_CONFIG).read().decode("utf-8")
    except OSError:
        old = ""

    api_key = re.search(r'^api-key:\s*"(.*)"', old, re.MULTILINE)
    api_url = re.search(r'^api-url:\s*"(.*)"', old, re.MULTILINE)
    website = re.search(r'^website-url:\s*"(.*)"', old, re.MULTILINE)

    fixed = template
    fixed = re.sub(r'^api-url:.*$', f'api-url: "{api_url.group(1) if api_url else SITE}"', fixed, flags=re.MULTILINE)
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

    with sftp.open(ENTERRA_CONFIG, "w") as f:
        f.write(fixed.encode("utf-8"))

    sftp.close()
    transport.close()
    print("REBUILT", ENTERRA_CONFIG)
    return 0


if __name__ == "__main__":
    sys.exit(main())
