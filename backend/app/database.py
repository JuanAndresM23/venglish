from contextlib import contextmanager

import psycopg2
from flask import current_app


def init_db(app):
    if not app.config.get("DATABASE_URL"):
        raise RuntimeError("DATABASE_URL no está definida. Revisa el archivo .env.")


def get_connection():
    return psycopg2.connect(current_app.config["DATABASE_URL"], connect_timeout=10)


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
