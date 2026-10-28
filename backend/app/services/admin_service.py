from datetime import datetime, timedelta

from psycopg2 import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from app.database import db_cursor
from app.models import admin_model, booking_model, student_model
from app.constants import LEVEL_SUPERADMIN
from app.utils.errors import ServiceError
from app.utils.http import clean_text

SUPERADMIN_COLOR = "#1976d2"
TEACHER_COLOR = "#e91e63"


def dashboard_events(is_superadmin, admin_id):
    with db_cursor() as cursor:
        rows = booking_model.list_for_dashboard(
            cursor, None if is_superadmin else admin_id
        )
    return [
        {
            "id": str(row[0]),
            "title": f"{row[1]} ({row[5]})" if is_superadmin else row[1],
            "start": f"{row[3]}T{row[4]}",
            "end": (datetime.combine(row[3], row[4]) + timedelta(minutes=row[6])).isoformat(),
            "extendedProps": {"course": row[2], "teacher": row[5], "duration": row[6]},
            "color": SUPERADMIN_COLOR if is_superadmin else TEACHER_COLOR,
        }
        for row in rows
    ]


def stats(is_superadmin, admin_id):
    teacher_filter = None if is_superadmin else admin_id
    with db_cursor() as cursor:
        total_students = student_model.count(cursor) if is_superadmin else None
        total_teachers = admin_model.count_teachers(cursor) if is_superadmin else None
        upcoming = booking_model.count_upcoming(cursor, teacher_filter)
        week = booking_model.count_next_week(cursor, teacher_filter)

    return {
        "is_superadmin": is_superadmin,
        "students": total_students,
        "teachers": total_teachers,
        "upcoming_bookings": upcoming,
        "week_bookings": week,
    }


def list_students():
    with db_cursor() as cursor:
        rows = student_model.list_all(cursor)
    return [
        {
            "id": row[0],
            "name": row[1],
            "phone": row[2],
            "email": row[3],
            "code": row[4],
            "active": bool(row[5]),
        }
        for row in rows
    ]


def _clean_student(data):
    name = clean_text(data.get("name"), 150)
    phone = clean_text(data.get("phone"), 30)
    email = clean_text(data.get("email"), 254).lower()
    student_code = clean_text(data.get("student_code"), 50).upper()
    if not name or not student_code:
        raise ServiceError("Nombre y código son obligatorios", 400)
    if email and ("@" not in email or "." not in email.split("@")[-1]):
        raise ServiceError("Correo inválido", 400)
    return name, phone, email or None, student_code


def add_student(data):
    name, phone, email, student_code = _clean_student(data)

    try:
        with db_cursor(commit=True) as cursor:
            student_model.create(cursor, name, phone, email, student_code)
    except IntegrityError:
        raise ServiceError("El código o el correo ya están registrados", 409)


def update_student(student_id, data):
    name, phone, email, student_code = _clean_student(data)

    try:
        with db_cursor(commit=True) as cursor:
            if not student_model.get_for_delete(cursor, student_id):
                raise ServiceError("El estudiante no existe", 404)
            student_model.update(cursor, student_id, name, phone, email, student_code)
    except IntegrityError:
        raise ServiceError("El código o el correo ya están registrados", 409)


def delete_student(student_id):
    with db_cursor(commit=True) as cursor:
        if not student_model.get_for_delete(cursor, student_id):
            raise ServiceError("El estudiante no existe", 404)

        bookings = booking_model.count_by_student(cursor, student_id)
        if bookings:
            raise ServiceError(
                f"No se puede eliminar: tiene {bookings} reserva(s) registradas. "
                "Cancela sus clases primero.",
                409,
            )
        student_model.delete(cursor, student_id)


MIN_PASSWORD_LENGTH = 10


def list_teachers():
    with db_cursor() as cursor:
        rows = admin_model.list_teacher_accounts(cursor)
    return [
        {"id": row[0], "username": row[1], "name": row[2] or row[1], "email": row[3]}
        for row in rows
    ]


def add_teacher(data):
    username = clean_text(data.get("username"), 100).lower()
    full_name = clean_text(data.get("full_name"), 150)
    email = clean_text(data.get("email"), 255).lower()
    password = str(data.get("password") or "")
    if not username or not full_name:
        raise ServiceError("Usuario y nombre son obligatorios", 400)
    if " " in username:
        raise ServiceError("El usuario no puede contener espacios", 400)
    if email and ("@" not in email or "." not in email.split("@")[-1]):
        raise ServiceError("Correo inválido", 400)
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ServiceError("La contraseña debe tener al menos 10 caracteres", 400)

    try:
        with db_cursor(commit=True) as cursor:
            if admin_model.username_exists(cursor, username):
                raise ServiceError("Ese nombre de usuario ya está registrado", 409)
            admin_model.create_teacher(
                cursor, username, generate_password_hash(password), full_name, email or None
            )
    except IntegrityError:
        raise ServiceError("Ese nombre de usuario ya está registrado", 409)


def get_profile(admin_id):
    with db_cursor() as cursor:
        row = admin_model.get_by_id(cursor, admin_id)
    if not row:
        raise ServiceError("Usuario no encontrado", 404)
    return {
        "username": row[0],
        "full_name": row[1] or "",
        "email": row[2] or "",
        "level": row[3],
        "role": "Superadministrador" if row[3] == LEVEL_SUPERADMIN else "Docente",
    }


def update_profile(admin_id, data):
    full_name = clean_text(data.get("full_name"), 100)
    email = clean_text(data.get("email"), 100).lower()
    if not full_name:
        raise ServiceError("El nombre es obligatorio", 400)
    if email and ("@" not in email or "." not in email.split("@")[-1]):
        raise ServiceError("Correo inválido", 400)

    with db_cursor(commit=True) as cursor:
        admin_model.update_profile(cursor, admin_id, full_name, email or None)
    return full_name


def change_password(admin_id, current_password, new_password):
    current_password = str(current_password or "")
    new_password = str(new_password or "")
    if len(new_password) < MIN_PASSWORD_LENGTH:
        raise ServiceError("La nueva contraseña debe tener al menos 10 caracteres", 400)

    with db_cursor(commit=True) as cursor:
        current_hash = admin_model.get_password_hash(cursor, admin_id)
        if not current_hash or not check_password_hash(current_hash, current_password):
            raise ServiceError("La contraseña actual es incorrecta", 400)
        admin_model.set_password(cursor, admin_id, generate_password_hash(new_password))
