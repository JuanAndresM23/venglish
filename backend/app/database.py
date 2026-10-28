from contextlib import contextmanager
from datetime import time
from urllib.parse import unquote, urlparse

import pymysql
from flask import current_app
from pymysql.constants import FIELD_TYPE
from pymysql.converters import conversions


def _time_as_time(value):
    # MySQL TIME llega como timedelta; el resto del código espera datetime.time.
    seconds = int(value.total_seconds()) % 86400
    return time(seconds // 3600, seconds % 3600 // 60, seconds % 60)


_decode_timedelta = conversions[FIELD_TYPE.TIME]
_CONVERSIONS = {**conversions, FIELD_TYPE.TIME: lambda raw: _time_as_time(_decode_timedelta(raw))}


def init_db(app):
    if not app.config.get("DATABASE_URL"):
        raise RuntimeError("DATABASE_URL no está definida. Revisa el archivo .env.")


def get_connection():
    url = urlparse(current_app.config["DATABASE_URL"])
    return pymysql.connect(
        host=url.hostname or "localhost",
        port=url.port or 3306,
        user=unquote(url.username or ""),
        password=unquote(url.password or ""),
        database=url.path.lstrip("/"),
        charset="utf8mb4",
        connect_timeout=10,
        conv=_CONVERSIONS,
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
