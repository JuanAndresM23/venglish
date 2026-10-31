from datetime import datetime, timedelta

from app.constants import BOGOTA
from app.entities.admin import Admin
from app.entities.base import Entity
from app.entities.course import Course
from app.entities.student import Student


def format_duration(minutes):
    hours, rest = divmod(minutes, 60)
    parts = []
    if hours:
        parts.append(f"{hours} h")
    if rest:
        parts.append(f"{rest} min")
    return " ".join(parts)


class Booking(Entity):
    TABLE = "bookings"
    COLUMNS = (
        "id", "course_id", "student_id", "teacher_id", "class_date", "class_time",
        "duration_minutes", "status", "calendar_event_id", "reminder_24h_sent",
        "reminder_1h_sent",
    )

    def __init__(
        self,
        id=None,
        course_id=None,
        student_id=None,
        teacher_id=None,
        class_date=None,
        class_time=None,
        duration_minutes=60,
        status=None,
        calendar_event_id=None,
        reminder_24h_sent=None,
        reminder_1h_sent=None,
    ):
        super().__init__(id)
        self.course_id = course_id
        self.student_id = student_id
        self.teacher_id = teacher_id
        self.class_date = class_date
        self.class_time = class_time
        self.duration_minutes = duration_minutes
        self.status = status
        self.calendar_event_id = calendar_event_id
        self.reminder_24h_sent = reminder_24h_sent
        self.reminder_1h_sent = reminder_1h_sent

    @property
    def starts_at(self):
        """Inicio de la clase como hora local de Bogotá, sin zona (como se guarda en BD)."""
        return datetime.combine(self.class_date, self.class_time)

    @property
    def ends_at(self):
        return self.starts_at + timedelta(minutes=self.duration_minutes)

    @property
    def starts_at_bogota(self):
        return self.starts_at.replace(tzinfo=BOGOTA)

    def attach_calendar_event(self, event_id):
        self.calendar_event_id = event_id


class BookingDetail:
    """Composición: una reserva junto con el estudiante, curso y docente que referencia."""

    def __init__(self, booking, student, course, teacher):
        self.booking = booking
        self.student = student
        self.course = course
        self.teacher = teacher

    @classmethod
    def from_row(cls, row):
        """Convierte una fila `bookings + students + courses + admins` en sus 4 entidades."""
        parts = []
        start = 0
        for entity in (Booking, Student, Course, Admin):
            size = len(entity.columns())
            parts.append(entity.from_row(row[start:start + size]))
            start += size
        return cls(*parts)

    @property
    def time_range(self):
        start, end = self.booking.starts_at, self.booking.ends_at
        return f"{start:%H:%M} - {end:%H:%M} ({format_duration(self.booking.duration_minutes)})"

    def to_student_view(self):
        return {
            "id": self.booking.id,
            "course": self.course.course_name,
            "date": str(self.booking.class_date),
            "time": str(self.booking.class_time),
            "teacher": self.teacher.display_name,
            "duration": self.booking.duration_minutes,
        }
