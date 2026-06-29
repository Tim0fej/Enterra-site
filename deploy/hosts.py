"""Production VPS defaults — override with DEPLOY_HOST / DEPLOY_PASSWORD env."""
import os

DEPLOY_HOST = os.environ.get("DEPLOY_HOST", "193.222.62.4")
OLD_DEPLOY_HOST = "185.251.89.57"
DEPLOY_USER = os.environ.get("DEPLOY_USER", "root")
REMOTE_APP_DIR = "/opt/enterra-site"
REMOTE_DATA_DIR = "/var/lib/enterra/data"
DOMAIN = os.environ.get("DOMAIN", "enterra.tech")
CERTBOT_EMAIL = os.environ.get("CERTBOT_EMAIL", "romazaytsev917@gmail.com")
