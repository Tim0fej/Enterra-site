#!/usr/bin/env python3
"""Fix SkinsRestorer for offline Enterra server (skins visible for all players)."""
import os
import re
import sys

import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")
CONFIG_PATH = "plugins/SkinsRestorer/config.yml"

PATCHES = {
    r"(\s+detection:\s*)AUTO": r"\1DISABLED",
    r"(\s+detection:\s*)ENABLED": r"\1DISABLED",
    r"(\s+alwaysApplyPremium:\s*)false": r"\1true",
    r"(\s+elyByEnabled:\s*)false": r"\1true",
    r"(fetchRecommendedSkins:\s*)false": r"\1true",
    r"(defaultSkins:\s*\n\s+enabled:\s*)true": r"\1false",
    r"(    custom:\s*\n        # Whether custom skins are enabled in the /skins GUI\s*\n        enabled:\s*)false": r"\1true",
    r"(    players:\s*\n        # Whether player skins are enabled in the /skins GUI\s*\n        enabled:\s*)false": r"\1true",
}


def main() -> int:
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    data = sftp.open(CONFIG_PATH).read().decode("utf-8")
    original = data

    for pattern, repl in PATCHES.items():
        data = re.sub(pattern, repl, data, count=1)

    if data == original:
        print("No changes needed (already patched?)")
    else:
        with sftp.open(CONFIG_PATH, "w") as f:
            f.write(data.encode("utf-8"))
        print("SkinsRestorer config updated:")
        print("  proxyMode.detection -> DISABLED (standalone server)")
        print("  login.alwaysApplyPremium -> true")
        print("  api.elyByEnabled -> true (Ely.by / TLSkins)")
        print("  api.fetchRecommendedSkins -> true (/skins catalog)")
        print("  gui.players/custom -> true")
        print("  storage.defaultSkins.enabled -> false (no random skins)")

    sftp.close()
    transport.close()
    print("Restart MC server or /sr reload")
    return 0


if __name__ == "__main__":
    sys.exit(main())
