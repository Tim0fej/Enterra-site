#!/usr/bin/env python3
"""Upload moderation API + server changes and reload PM2."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    "shared/moderation.ts",
    "shared/easydonateConfig.ts",
    "shared/nameColor.ts",
    "shared/mediaRequirements.ts",
    "shared/vipCommands.ts",
    "shared/privilegeBenefits.ts",
    "shared/rulesContent.ts",
    "shared/faqContent.ts",
    "shared/termsContent.ts",
    "shared/shopCatalog.ts",
    "shared/forumConfig.ts",
    "shared/botProtection.ts",
    "shared/supportConfig.ts",
    "server/db.ts",
    "server/auth.ts",
    "server/index.ts",
    "server/env.ts",
    "server/middleware/security.ts",
    "server/middleware/botGuard.ts",
    "server/lib/authCookie.ts",
    "server/lib/turnstile.ts",
    "server/lib/webSessions.ts",
    "server/lib/secureCompare.ts",
    "server/lib/minecraftAuth.ts",
    "server/lib/attachments.ts",
    "server/lib/emailVerification.ts",
    "server/routes/players.ts",
    "server/routes/uploads.ts",
    "server/lib/donationAlertsOAuth.ts",
    "server/lib/donationAlertsWidget.ts",
    "server/lib/shopFeed.ts",
    "server/lib/shopFulfillment.ts",
    "server/lib/nameColor.ts",
    "server/lib/userProfile.ts",
    "server/routes/donationalerts.ts",
    "server/lib/easydonatePayments.ts",
    "server/routes/minecraft.ts",
    "server/routes/forum.ts",
    "server/routes/tickets.ts",
    "server/routes/moderation.ts",
    "server/routes/shop.ts",
    "server/routes/auth.ts",
    "server/lib/emailVerification.ts",
    "server/routes/support.ts",
]


def upload_dir(sftp: paramiko.SFTPClient, local: Path, remote: str) -> None:
    try:
        sftp.mkdir(remote)
    except OSError:
        pass
    for item in local.iterdir():
        lp = local / item.name
        rp = f"{remote}/{item.name}"
        if lp.is_dir():
            upload_dir(sftp, lp, rp)
        else:
            sftp.put(str(lp), rp)


def main() -> int:
    if not (ROOT / "dist").is_dir():
        print("Run npm run build first", file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
    sftp = c.open_sftp()

    for rel in FILES:
        local = ROOT / rel
        remote = f"/opt/enterra-site/{rel.replace(chr(92), '/')}"
        print("upload", rel)
        sftp.put(str(local), remote)

    print("upload dist/")
    upload_dir(sftp, ROOT / "dist", "/opt/enterra-site/dist")
    sftp.close()

    _, o, _ = c.exec_command(
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "pm2 restart enterra-site --update-env; sleep 3; "
        "curl -sf https://enterra.tech/api/health; echo; echo MODERATION_OK",
        timeout=90,
    )
    print(o.read().decode("utf-8", "replace").encode("ascii", "replace").decode())
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
