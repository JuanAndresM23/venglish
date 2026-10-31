from datetime import datetime, timedelta

from app.constants import (
    ALLOWED_DURATIONS,
    BOGOTA,
    CLASS_DURATION_MINUTES,
    MIN_BOOKING_NOTICE_HOURS,
)
from app.utils.dates import parse_class_datetime
from app.utils.errors import ServiceError
from app.utils.http import clean_text


class BookingRequest:
    """Solicitud de reserva ya validada (objeto de valor)."""

    def __init__(self, course_id, teacher_id, requested_at, duration):
        self.course_id = course_id
        self.teacher_id = teacher_id
        self.requested_at = requested_at
        self.duration = duration

    @classmethod
    def from_payload(cls, data):
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

        return cls(course_id, teacher_id, requested_at, duration)

    @property
    def time_text(self):
        return f"{self.requested_at:%H:%M}"

    @property
    def class_start(self):
        return self.requested_at.replace(tzinfo=None)

    @property
    def class_end(self):
        return (self.requested_at + timedelta(minutes=self.duration)).replace(tzinfo=None)
