#!/usr/bin/env python3
"""Remove stale Vite bundles from production dist/assets."""
import os
import re
import paramiko

DIST = "/opt/enterra-site/dist"


def collect_keep_paths(dist_dir: str) -> set[str]:
    html = open(f"{dist_dir}/index.html", encoding="utf-8").read()
    keep = {p.lstrip("/") for p in re.findall(r"/assets/[^\"']+", html)}

    for css_rel in re.findall(r"/assets/[^\"']+\.css", html):
        css_path = f"{dist_dir}/{css_rel.lstrip('/')}"
        if not os.path.isfile(css_path):
            continue
        css = open(css_path, encoding="utf-8").read()
        for ref in re.findall(r"url\((/assets/[^)]+)\)", css):
            keep.add(ref.lstrip("/"))

    return keep


c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
script = f"""
python3 << 'PY'
import glob, os, re

dist = {DIST!r}

def collect_keep_paths(dist_dir):
    html = open(f"{{dist_dir}}/index.html", encoding="utf-8").read()
    keep = {{p.lstrip("/") for p in re.findall(r"/assets/[^\\"']+", html)}}
    for css_rel in re.findall(r"/assets/[^\\"']+\\.css", html):
        css_path = f"{{dist_dir}}/{{css_rel.lstrip('/')}}"
        if not os.path.isfile(css_path):
            continue
        css = open(css_path, encoding="utf-8").read()
        for ref in re.findall(r"url\\((/assets/[^)]+)\\)", css):
            keep.add(ref.lstrip("/"))
    return keep

keep = collect_keep_paths(dist)
assets = dist + "/assets"
removed = 0
for path in glob.glob(assets + "/*"):
    rel = "assets/" + os.path.basename(path)
    if rel not in keep:
        os.remove(path)
        removed += 1
print("kept", len(keep), "files")
print("removed", removed)
PY
"""
_, o, e = c.exec_command(script, timeout=120)
print(o.read().decode("utf-8", errors="replace"))
err = e.read().decode("utf-8", errors="replace")
if err:
    print(err)
c.close()
