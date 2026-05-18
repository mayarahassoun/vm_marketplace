import os

SECRET_KEY = "super-secret-key-change-this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost/vm_marketplace_db")

MANAGEONE_IAM_ENDPOINT = os.getenv(
    "MANAGEONE_IAM_ENDPOINT",
    "https://iam-apigateway-proxy.mesrscloud.rnu.tn",
)
MANAGEONE_SC_ENDPOINT = os.getenv(
    "MANAGEONE_SC_ENDPOINT",
    "https://sc.mesrscloud.rnu.tn:443",
)
MANAGEONE_USERNAME = os.getenv("MANAGEONE_USERNAME", "")
MANAGEONE_PASSWORD = os.getenv("MANAGEONE_PASSWORD", "")
MANAGEONE_DOMAIN_NAME = os.getenv("MANAGEONE_DOMAIN_NAME", "")
MANAGEONE_VERIFY_SSL = os.getenv("MANAGEONE_VERIFY_SSL", "false").lower() == "true"

