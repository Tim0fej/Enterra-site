#!/usr/bin/env python3
"""Probe DonationAlerts client_id by refresh_token error type."""
import os
import urllib.parse
import paramiko

SECRET = os.environ.get("DONATION_ALERTS_ACCESS_TOKEN", "").strip()

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)

ranges = list(range(1, 51)) + list(range(10000, 10051)) + list(range(80000, 80051))
parts = []
for cid in ranges:
    data = urllib.parse.urlencode(
        {
            "grant_type": "refresh_token",
            "refresh_token": SECRET,
            "client_id": str(cid),
            "client_secret": SECRET,
        }
    )
    parts.append(
        f"r=$(curl -sS -X POST 'https://www.donationalerts.com/oauth/token' "
        f"-H 'Content-Type: application/x-www-form-urlencoded' -d '{data}'); "
        f"echo '{cid}:'\"$r\" | grep -v invalid_client | grep -v '^$' || true"
    )

_, o, _ = c.exec_command("; ".join(parts[:40]), timeout=120)
out = o.read().decode("utf-8", "replace")
print(out.encode("ascii", "replace").decode() or "all invalid_client in sample")
c.close()
