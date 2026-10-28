import logging
from datetime import datetime, timedelta

from psycopg2 import IntegrityError

from app.constants import (
    ALLOWED_DURATIONS,
    BOGOTA,
    CLASS_DURATION_MINUTES,
    LEVEL_SUPERADMIN,
    MIN_BOOKING_NOTICE_HOURS,
    MIN_CANCELLATION_NOTICE_HOURS,
    ROLE_STUDENT,
)
from app.database import db_cursor
from app.models import admin_model, booking_model, course_model
from app.services import email_service, schedule_service
from app.utils.dates import parse_class_datetime
from app.utils.errors import ServiceError
from app.utils.http import clean_text

logger = logging.getLogger(__name__)


def list_courses():
    with db_cursor() as cursor:
        rows = course_model.list_all(cursor)
    return [{"id": row[0], "name": row[1]} for row in rows]


def list_teachers():
    with db_cursor() as cursor:
        rows = admin_model.list_teachers(cursor)
    return [{"id": row[0], "name": row[1]} for row in rows]


def list_student_classes(student_id):
    with db_cursor() as cursor:
        rows = booking_model.list_by_student(cursor, student_id)
    return [
        {
            "id": row[0],
            "course": row[1],
            "date": str(row[2]),
            "time": str(row[3]),
            "teacher": row[4],
            "duration": row[5],
        }
        for row in rows
    ]


def create_booking(student_id, data):
    course_id = data.get("course_id")
    teacher_id = data.get("teacher_id")
    date_text = clean_text(data.get("date"), 10)
    time_text = clean_text(data.get("time"), 5)
    try:
        duration = int(data.get("duration", CLASS_DURATION_MINUTES))
    except (TypeError, ValueError):
        duration = None
    if duration not in ALLOWED_DURATIONS:
        raise ServiceError("Duración de clase inválida", 400)

    requested_at = parse_class_datetime(date_text, time_text)
    if not all([course_id, teacher_id, date_text, time_text]) or requested_at is None:
        raise ServiceError("Curso, profesor, fecha y hora son requeridos", 400)

    if requested_at < datetime.now(BOGOTA) + timedelta(hours=MIN_BOOKING_NOTICE_HOURS):
        raise ServiceError("Debes reservar con mínimo 48 horas de anticipación", 400)

    class_start = requested_at.replace(tzinfo=None)
    class_end = (requested_at + timedelta(minutes=duration)).replace(tzinfo=None)

    try:
        with db_cursor(commit=True) as cursor:
            if not course_model.exists(cursor, course_id):
                raise ServiceError("Curso inválido", 400)
            if not admin_model.teacher_exists(cursor, teacher_id):
                raise ServiceError("Profesor inválido", 400)

            if time_text not in schedule_service.available_slots(
                cursor, teacher_id, requested_at.date(), duration
            ):
                raise ServiceError(
                    "El profesor no está disponible en ese horario para la duración elegida", 409
                )

            if booking_model.find_student_overlap(cursor, student_id, class_end, class_start):
                raise ServiceError("Ya tienes una clase que se cruza con ese horario", 409)
            if booking_model.find_teacher_overlap(cursor, teacher_id, class_end, class_start):
                raise ServiceError("El profesor ya está ocupado en ese horario", 409)

            booking_id = booking_model.create(
                cursor, course_id, student_id, teacher_id, date_text, time_text, duration
            )
            contacts = booking_model.get_reservation_contacts(
                cursor, course_id, teacher_id, student_id
            )
    except ServiceError:
        raise
    except IntegrityError:
        raise ServiceError("El horario acaba de ser reservado. Selecciona otro", 409)
    except Exception:
        logger.exception("Error creando reserva")
        raise ServiceError("No fue posible crear la reserva", 500)

    _notify_booking(contacts, date_text, _time_range(time_text, duration))
    return booking_id


def cancel_booking(booking_id, role, student_id, user_id, role_level):
    with db_cursor(commit=True) as cursor:
        booking = booking_model.get_for_cancellation(cursor, booking_id)
        if not booking:
            raise ServiceError("La reserva no existe", 404)

        if role == ROLE_STUDENT:
            if booking[0] != student_id:
                raise ServiceError("No puedes cancelar esta reserva", 403)

            starts_at = datetime.combine(booking[2], booking[3]).replace(tzinfo=BOGOTA)
            limit = datetime.now(BOGOTA) + timedelta(hours=MIN_CANCELLATION_NOTICE_HOURS)
            if starts_at < limit:
                raise ServiceError("Solo puedes cancelar hasta 12 horas antes", 400)
        else:
            is_superadmin = role_level == LEVEL_SUPERADMIN
            is_owner_teacher = booking[1] == user_id
            if not is_superadmin and not is_owner_teacher:
                raise ServiceError("No puedes cancelar una clase de otro docente", 403)

        booking_model.delete(cursor, booking_id)

    _notify_cancellation(booking)


def _notify_booking(contacts, date_text, time_text):
    if not contacts:
        return
    student_name, student_email, course_name, teacher_name, teacher_email = contacts
    try:
        email_service.send_student_booking_email(
            student_name=student_name,
            student_email=student_email,
            teacher_name=teacher_name,
            course_name=course_name,
            date=date_text,
            time=time_text,
        )
        email_service.send_teacher_booking_email(
            teacher_name=teacher_name,
            teacher_email=teacher_email,
            student_name=student_name,
            course_name=course_name,
            date=date_text,
            time=time_text,
        )
    except Exception:
        logger.exception("Error enviando correos de reserva")


def format_duration(minutes):
    hours, rest = divmod(minutes, 60)
    parts = []
    if hours:
        parts.append(f"{hours} h")
    if rest:
        parts.append(f"{rest} min")
    return " ".join(parts)


def _time_range(start_text, minutes):
    start = datetime.strptime(start_text, "%H:%M")
    end = start + timedelta(minutes=minutes)
    return f"{start:%H:%M} - {end:%H:%M} ({format_duration(minutes)})"


def _notify_cancellation(booking):
    (
        _, _, class_date, class_time, student_name, student_email,
        course_name, teacher_name, teacher_email, duration,
    ) = booking
    time_range = _time_range(f"{class_time:%H:%M}", duration)
    try:
        email_service.send_student_cancellation_email(
            student_name=student_name,
            student_email=student_email,
            teacher_name=teacher_name,
            course_name=course_name,
            date=str(class_date),
            time=time_range,
        )
        email_service.send_teacher_cancellation_email(
            teacher_name=teacher_name,
            teacher_email=teacher_email,
            student_name=student_name,
            course_name=course_name,
            date=str(class_date),
            time=time_range,
        )
    except Exception:
        logger.exception("Error enviando correos de cancelación")
