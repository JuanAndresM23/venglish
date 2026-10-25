from psycopg2 import IntegrityError

from app.database import db_cursor
from app.models import admin_model, booking_model, student_model
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
            "extendedProps": {"course": row[2], "teacher": row[5]},
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
        {"id": row[0], "name": row[1], "phone": row[2], "email": row[3], "code": row[4]}
        for row in rows
    ]


def add_student(data):
    name = clean_text(data.get("name"), 150)
    phone = clean_text(data.get("phone"), 30)
    email = clean_text(data.get("email"), 254).lower()
    student_code = clean_text(data.get("student_code"), 50).upper()
    if not name or not student_code:
        raise ServiceError("Nombre y código son obligatorios", 400)

    try:
        with db_cursor(commit=True) as cursor:
            student_model.create(cursor, name, phone, email or None, student_code)
    except IntegrityError:
        raise ServiceError("El código o el correo ya están registrados", 409)
