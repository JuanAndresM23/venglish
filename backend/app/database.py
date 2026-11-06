from contextlib import contextmanager
from datetime import time
from urllib.parse import unquote, urlparse

import pymysql
from flask import current_app
from pymysql import converters
from pymysql.constants import FIELD_TYPE
from pymysql.err import IntegrityError  # noqa: F401  (los servicios lo importan desde aquí)


def init_db(app):
    if not app.config.get("DATABASE_URL"):
        raise RuntimeError("DATABASE_URL no está definida. Revisa el archivo .env.")


def _to_time(value):
    """TIME de MySQL -> datetime.time (PyMySQL lo entrega como timedelta o texto)."""
    if isinstance(value, bytes):
        value = value.decode()
    if not isinstance(value, str):
        total = int(value.total_seconds())
        return time(total // 3600 % 24, total // 60 % 60, total % 60)
    hours, minutes, seconds = value.split(":")
    return time(int(hours) % 24, int(minutes), int(float(seconds)))


def _converters():
    conv = converters.conversions.copy()
    conv[FIELD_TYPE.TIME] = _to_time
    return conv


def get_connection():
    """DATABASE_URL tiene la forma mysql://usuario:contraseña@host:puerto/base_de_datos"""
    url = urlparse(current_app.config["DATABASE_URL"])
    return pymysql.connect(
        host=url.hostname or "localhost",
        port=url.port or 3306,
        user=unquote(url.username or ""),
        password=unquote(url.password or ""),
        database=url.path.lstrip("/"),
        charset="utf8mb4",
        connect_timeout=10,
        conv=_converters(),
    )


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
