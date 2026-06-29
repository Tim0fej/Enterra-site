#!/usr/bin/env python3
"""Configure YooKassa credentials on production .env and restart app."""
import os
import re
import sys

import paramiko

HOST = "193.222.62.4"
ENV_PATH = "/opt/enterra-site/.env"

SHOP_ID = os.environ.get("YOOKASSA_SHOP_ID", "1391430")
SECRET = os.environ.get(
    "YOOKASSA_SECRET_KEY",
    "test_PV0JnlI2ryOfMw3-7Zj4G4PrvCXCKigKcRCUZNEIf7A",
)


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=30)
    sftp = client.open_sftp()

    try:
        content = sftp.open(ENV_PATH).read().decode("utf-8")
    except OSError:
        content = ""

    updates = {
        "YOOKASSA_SHOP_ID": SHOP_ID,
        "YOOKASSA_SECRET_KEY": SECRET,
        "YOOKASSA_RETURN_URL": "https://enterra.tech/support?payment=return",
        "VIP_PURCHASE_ENABLED": "true",
    }

    for key, value in updates.items():
        line = f"{key}={value}"
        if re.search(rf"^{re.escape(key)}=", content, re.MULTILINE):
            content = re.sub(rf"^{re.escape(key)}=.*$", line, content, flags=re.MULTILINE)
        else:
            content = content.rstrip() + "\n" + line + "\n"

    with sftp.open(ENV_PATH, "w") as f:
        f.write(content.encode("utf-8"))
    sftp.close()

    script = """
export PATH="/usr/local/bin:/usr/bin:$PATH"
pm2 restart enterra-site --update-env
sleep 2
echo "=== support ==="
curl -s http://127.0.0.1:3001/api/support | python3 -c "import sys,json; d=json.load(sys.stdin); print('vipPurchaseEnabled', d.get('vipPurchaseEnabled'))"
echo
echo "=== yookassa test payment ==="
cd /opt/enterra-site
node --input-type=module <<'NODE'
import 'dotenv/config';
import { createYooPayment } from './server/lib/yookassa.ts';

try {
  const payment = await createYooPayment({
    amountRub: 99,
    description: 'Enterra VIP test',
    returnUrl: 'https://enterra.tech/support?payment=return&order=0',
    metadata: { test: '1' },
  });
  console.log('YOOKASSA_OK', payment.id, payment.status);
  console.log('PAY_URL', payment.confirmation?.confirmation_url ?? 'none');
} catch (e) {
  console.error('YOOKASSA_FAIL', e.message);
  process.exit(1);
}
NODE
echo DONE
"""

    _, stdout, stderr = client.exec_command(script, timeout=120000)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(out.encode("ascii", errors="replace").decode("ascii"))
    if err:
        print(err.encode("ascii", errors="replace").decode("ascii"))
    client.close()
    return 0 if "YOOKASSA_OK" in out and "DONE" in out else 1


if __name__ == "__main__":
    sys.exit(main())
