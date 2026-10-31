from datetime import time
from urllib.parse import unquote, urlparse

import pymysql
from flask import current_app
from pymysql import converters
from pymysql.constants import FIELD_TYPE
from pymysql.err import IntegrityError  # noqa: F401  (los servicios lo importan desde aquí)

from app.repositories import (
    AdminRepository,
    BookingRepository,
    CourseRepository,
    PasswordResetTokenRepository,
    StudentRepository,
    TeacherScheduleRepository,
)
from app.utils.singleton import SingletonMeta


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


def _to_bool(value):
    if isinstance(value, bytes):
        value = value.decode()
    return str(value) not in ("0", "")


def _converters():
    conv = converters.conversions.copy()
    conv[FIELD_TYPE.TIME] = _to_time
    conv[FIELD_TYPE.TINY] = _to_bool  # BOOLEAN es TINYINT(1)
    return conv


class Database(metaclass=SingletonMeta):
    """Punto único de acceso a MySQL (Singleton).

    DATABASE_URL tiene la forma mysql://usuario:contraseña@host:puerto/base_de_datos
    """

    def connect(self):
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


class UnitOfWork:
    """Una transacción con todos los repositorios que comparten su cursor (Unit of Work).

    Uso:
        with UnitOfWork(commit=True) as uow:
            student = uow.students.find_by_id(1)

    Al salir sin error confirma (si commit=True); ante una excepción hace rollback.
    """

    def __init__(self, commit=False):
        self._commit = commit
        self._conn = None
        self._cursor = None

    def __enter__(self):
        self._conn = Database().connect()
        self._cursor = self._conn.cursor()
        self.courses = CourseRepository(self._cursor)
        self.admins = AdminRepository(self._cursor)
        self.students = StudentRepository(self._cursor)
        self.bookings = BookingRepository(self._cursor)
        self.schedules = TeacherScheduleRepository(self._cursor)
        self.reset_tokens = PasswordResetTokenRepository(self._cursor)
        return self

    def __exit__(self, exc_type, exc, traceback):
        try:
            if exc_type is None:
                if self._commit:
                    self._conn.commit()
            else:
                self._conn.rollback()
        finally:
            self._cursor.close()
            self._conn.close()
        return False
