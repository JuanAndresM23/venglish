import os
from contextlib import contextmanager

import psycopg2
from dotenv import load_dotenv

load_dotenv(override=os.getenv("APP_ENV", "development") == "development")

DATABASE_URL = os.getenv("DATABASE_URL", "").strip().strip('"').strip("'")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definida. Revisa el archivo .env.")


def get_connection():
    return psycopg2.connect(DATABASE_URL, connect_timeout=10)


@contextmanager
def db_cursor(commit=False):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            yield cursor
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
